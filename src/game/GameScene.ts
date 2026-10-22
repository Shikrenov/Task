import { Container, Sprite, Texture } from 'pixi.js';
import { gsap } from 'gsap';
import { CageBar, type BarDirection } from './CageBar';
import { BAR_CONFIGS } from './barLayout';
import { LockMeter } from './LockMeter';
import { playTimeline, waitUsingGsap } from './animation';
import { createRandomCode } from './random';
import { STAGE_HEIGHT, STAGE_WIDTH, type GameAsset } from './constants';

type SceneTextures = Record<GameAsset, Texture>;
type GameState = 'playing' | 'transitioning' | 'resetting' | 'winning';

const BAR_ROWS = [331, 420, 507] as const;
const LEFT_BAR_X = 394;
const RIGHT_BAR_X = 902;

export class GameScene extends Container {
  private readonly bars: CageBar[] = [];
  private readonly tiger: Sprite;
  private readonly winText: Sprite;
  private readonly meter: LockMeter;
  private code: number[] = [];
  private progress = 0;
  private state: GameState = 'resetting';

  public constructor(textures: SceneTextures) {
    super();

    const background = new Sprite(textures.background);
    background.width = STAGE_WIDTH;
    background.height = STAGE_HEIGHT;

    const cage = new Sprite(textures.cage);
    cage.position.set(270, 86);
    cage.scale.set(0.5);

    this.tiger = new Sprite(textures.tiger);
    this.tiger.anchor.set(0.5);
    this.tiger.position.set(646, 395);
    this.tiger.scale.set(0.38);

    this.addChild(background, cage, this.tiger);
    this.createBars(textures);

    this.meter = new LockMeter(textures.plate);
    this.meter.position.set(36, 28);
    this.meter.scale.set(0.75);
    this.addChild(this.meter);

    this.winText = new Sprite(textures.winText);
    this.winText.anchor.set(0.5);
    this.winText.position.set(640, 535);
    this.winText.scale.set(0.48);
    this.winText.alpha = 0;
    this.winText.visible = false;
    this.addChild(this.winText);

    this.startNewRound();
  }

  private createBars(textures: SceneTextures): void {
    for (const config of BAR_CONFIGS) {
      const direction: BarDirection = config.direction;
      const bar = new CageBar({
        id: config.id,
        direction,
        x: direction === 'left' ? LEFT_BAR_X : RIGHT_BAR_X,
        y: BAR_ROWS[config.row],
        barTexture: textures.bar,
        shadowTexture: textures.barShadow,
        onSelect: (id) => {
          void this.handleBarSelection(id);
        },
      });
      this.bars.push(bar);
      this.addChild(bar);
    }
  }

  private async handleBarSelection(id: number): Promise<void> {
    if (this.state !== 'playing') {
      return;
    }

    this.setState('transitioning');

    if (id !== this.code[this.progress]) {
      await this.resetAfterMistake();
      return;
    }

    const bar = this.bars[id - 1];
    await bar.open(id <= 3 ? 'left' : 'right');
    this.progress += 1;
    this.meter.setCount(6 - this.progress);

    if (this.progress === this.code.length) {
      await this.playWinSequence();
      return;
    }

    this.setState('playing');
  }

  private async resetAfterMistake(): Promise<void> {
    this.setState('resetting');
    const openedBars = this.bars.filter((bar) => bar.isOpen);

    if (openedBars.length > 0) {
      await Promise.all(openedBars.map((bar) => bar.slamShut()));
    }

    this.startNewRound();
  }

  private async playWinSequence(): Promise<void> {
    this.setState('winning');
    this.setChildIndex(this.tiger, this.children.length - 1);
    this.setChildIndex(this.meter, this.children.length - 1);
    this.setChildIndex(this.winText, this.children.length - 1);
    this.winText.visible = true;

    await playTimeline(
      gsap
        .timeline({ paused: true })
        .to(this.tiger, { x: 635, y: 302, duration: 0.9, ease: 'power2.inOut' }, 0)
        .to(this.tiger.scale, { x: 0.63, y: 0.63, duration: 0.9, ease: 'back.out(1.2)' }, 0)
        .fromTo(
          this.winText,
          { alpha: 0, y: 580, rotation: -0.04 },
          { alpha: 1, y: 535, rotation: 0, duration: 0.55, ease: 'back.out(1.7)' },
          0.5,
        ),
    );

    await waitUsingGsap(3);
    await this.resetAfterWin();
  }

  private async resetAfterWin(): Promise<void> {
    this.setState('resetting');

    await playTimeline(
      gsap
        .timeline({ paused: true })
        .to(this.winText, { alpha: 0, y: 570, duration: 0.3, ease: 'power2.in' }, 0)
        .to(this.tiger, { x: 646, y: 395, duration: 0.5, ease: 'power2.inOut' }, 0)
        .to(this.tiger.scale, { x: 0.38, y: 0.38, duration: 0.5, ease: 'power2.inOut' }, 0),
    );

    this.winText.visible = false;
    this.setChildIndex(this.tiger, 2);
    this.bars.forEach((bar) => bar.resetImmediately());
    this.startNewRound();
  }

  private startNewRound(): void {
    this.progress = 0;
    this.code = createRandomCode();
    this.meter.setCount(6, false);
    console.log('[Free the Tiger] Secret code:', [...this.code]);
    this.setState('playing');
  }

  private setState(state: GameState): void {
    this.state = state;
    const enabled = state === 'playing';
    this.bars.forEach((bar) => bar.setInputEnabled(enabled));
  }
}

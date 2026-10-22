import { Container, Graphics, Rectangle, Sprite, Text, Texture } from 'pixi.js';
import { gsap } from 'gsap';
import { playTimeline } from './animation';

export type BarDirection = 'left' | 'right';

interface CageBarOptions {
  id: number;
  direction: BarDirection;
  x: number;
  y: number;
  barTexture: Texture;
  shadowTexture: Texture;
  onSelect: (id: number) => void;
}

const BAR_WIDTH = 241;
const OPEN_DISTANCE = 278;

export class CageBar extends Container {
  public readonly id: number;
  public isOpen = false;

  private readonly closedX: number;
  private inputEnabled = true;
  private readonly barSprite: Sprite;
  private readonly numberBadge: Container;

  public constructor(options: CageBarOptions) {
    super();

    this.id = options.id;
    this.closedX = options.x;
    this.position.set(options.x, options.y);
    this.label = `Cage bar ${options.id}`;
    this.eventMode = 'static';
    this.cursor = 'pointer';

    const isRight = options.direction === 'right';
    const shadowSprite = new Sprite(options.shadowTexture);
    shadowSprite.anchor.set(0, 0.5);
    shadowSprite.scale.x = isRight ? -1 : 1;
    shadowSprite.position.set(isRight ? -5 : 5, 5);
    shadowSprite.alpha = 0.68;

    this.barSprite = new Sprite(options.barTexture);
    this.barSprite.anchor.set(0, 0.5);
    this.barSprite.scale.x = isRight ? -1 : 1;

    this.numberBadge = this.createNumberBadge(options.id);
    this.numberBadge.position.set(isRight ? -193 : 193, 0);

    this.addChild(shadowSprite, this.barSprite, this.numberBadge);
    this.hitArea = new Rectangle(isRight ? -BAR_WIDTH : 0, -28, BAR_WIDTH, 56);

    this.on('pointertap', () => {
      if (this.inputEnabled && !this.isOpen) {
        options.onSelect(this.id);
      }
    });
    this.on('pointerover', () => this.animateHover(1));
    this.on('pointerout', () => this.animateHover(0));
  }

  public setInputEnabled(enabled: boolean): void {
    this.inputEnabled = enabled;
    this.eventMode = enabled && !this.isOpen ? 'static' : 'none';
    this.cursor = enabled && !this.isOpen ? 'pointer' : 'default';

    if (!enabled) {
      this.animateHover(0);
    }
  }

  public async open(direction: BarDirection): Promise<void> {
    if (this.isOpen) {
      return;
    }

    this.isOpen = true;
    this.setInputEnabled(false);
    gsap.killTweensOf(this);

    const targetX = this.closedX + (direction === 'left' ? -OPEN_DISTANCE : OPEN_DISTANCE);
    await playTimeline(
      gsap.timeline({ paused: true }).to(this, {
        x: targetX,
        duration: 0.58,
        ease: 'power3.inOut',
      }),
    );
  }

  public async slamShut(): Promise<void> {
    gsap.killTweensOf(this);

    await playTimeline(
      gsap
        .timeline({ paused: true })
        .to(this, { x: this.closedX + (this.x < this.closedX ? 18 : -18), duration: 0.2, ease: 'power3.in' })
        .to(this, { x: this.closedX, duration: 0.13, ease: 'back.out(1.8)' }),
    );

    this.isOpen = false;
  }

  public resetImmediately(): void {
    gsap.killTweensOf(this);
    gsap.set(this, { x: this.closedX });
    this.isOpen = false;
    this.animateHover(0, true);
  }

  private createNumberBadge(id: number): Container {
    const badge = new Container();
    const disc = new Graphics()
      .circle(0, 0, 15)
      .fill({ color: 0xffd51c })
      .stroke({ color: 0x18091f, width: 4 });
    const text = new Text({
      text: String(id),
      style: {
        fontFamily: 'Arial Black, Impact, sans-serif',
        fontSize: 18,
        fontWeight: '900',
        fill: 0x18091f,
        align: 'center',
      },
    });
    text.anchor.set(0.5);
    text.position.y = -1;
    badge.addChild(disc, text);
    return badge;
  }

  private animateHover(progress: number, immediate = false): void {
    if (this.isOpen) {
      return;
    }

    gsap.to([this.barSprite, this.numberBadge], {
      alpha: progress ? 0.88 : 1,
      duration: immediate ? 0 : 0.16,
      ease: 'power1.out',
      overwrite: true,
    });
    gsap.to(this.numberBadge.scale, {
      x: progress ? 1.12 : 1,
      y: progress ? 1.12 : 1,
      duration: immediate ? 0 : 0.16,
      ease: 'power1.out',
      overwrite: true,
    });
  }
}

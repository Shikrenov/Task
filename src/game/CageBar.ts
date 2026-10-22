import { Container, Rectangle, Sprite, Text, Texture } from 'pixi.js';
import { gsap } from 'gsap';
import { playTimeline } from './animation';
import { GOLD_TEXT_COLOR } from './colors';

export type BarDirection = 'left' | 'right';

interface CageBarOptions {
  id: number;
  direction: BarDirection;
  x: number;
  y: number;
  openX: number;
  barTexture: Texture;
  shadowTexture: Texture;
  onSelect: (id: number) => void;
}

const BAR_WIDTH = 241;

export class CageBar extends Container {
  public readonly id: number;
  public isOpen = false;

  private readonly closedX: number;
  private readonly openX: number;
  private inputEnabled = true;
  private readonly barSprite: Sprite;
  private readonly numberBadge: Container;

  public constructor(options: CageBarOptions) {
    super();

    this.id = options.id;
    this.closedX = options.x;
    this.openX = options.openX;
    this.position.set(options.x, options.y);
    this.label = `Cage bar ${options.id}`;
    this.eventMode = 'static';
    this.cursor = 'pointer';

    const isRight = options.direction === 'right';
    const shadowSprite = new Sprite(options.shadowTexture);
    shadowSprite.anchor.set(0, 0.5);
    shadowSprite.scale.x = isRight ? -1 : 1;
    shadowSprite.position.set(0, 6);
    shadowSprite.alpha = 1;

    this.barSprite = new Sprite(options.barTexture);
    this.barSprite.anchor.set(0, 0.5);
    this.barSprite.scale.x = isRight ? -1 : 1;

    this.numberBadge = this.createNumberBadge(options.id);
    this.numberBadge.position.set(isRight ? -18 : 18, 0);

    this.addChild(shadowSprite, this.barSprite, this.numberBadge);
    this.hitArea = new Rectangle(isRight ? -BAR_WIDTH : 0, -28, BAR_WIDTH, 56);

    this.on('pointertap', () => {
      if (this.inputEnabled && !this.isOpen) {
        options.onSelect(this.id);
      }
    });
  }

  public setInputEnabled(enabled: boolean): void {
    this.inputEnabled = enabled;
    this.eventMode = enabled && !this.isOpen ? 'static' : 'none';
    this.cursor = enabled && !this.isOpen ? 'pointer' : 'default';
  }

  public async open(): Promise<void> {
    if (this.isOpen) {
      return;
    }

    this.isOpen = true;
    this.setInputEnabled(false);
    gsap.killTweensOf(this);

    await playTimeline(
      gsap.timeline({ paused: true }).to(this, {
        x: this.openX,
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
  }

  private createNumberBadge(id: number): Container {
    const badge = new Container();
    const text = new Text({
      text: String(id),
      style: {
        fontFamily: 'Arial Black, Impact, sans-serif',
        fontSize: 11.4,
        fontWeight: '900',
        fill: GOLD_TEXT_COLOR,
        stroke: { color: 0x151027, width: 2 },
        align: 'center',
      },
    });
    text.anchor.set(0.5);
    text.position.y = -1;
    badge.addChild(text);
    return badge;
  }
}

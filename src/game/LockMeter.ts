import { Container, Sprite, Text, Texture } from 'pixi.js';
import { gsap } from 'gsap';
import { GOLD_TEXT_COLOR } from './colors';

const HEADING_Y = 92;
const COUNT_Y = 205;

export class LockMeter extends Container {
  private readonly countText: Text;

  public constructor(plateTexture: Texture) {
    super();

    const plate = new Sprite(plateTexture);
    plate.scale.set(0.25);
    this.addChild(plate);
    const contentCenterX = plate.width / 2;

    const heading = new Text({
      text: 'BARS LOCKED',
      style: {
        fontFamily: 'Arial Black, Impact, sans-serif',
        fontSize: 18,
        fontWeight: '900',
        fill: GOLD_TEXT_COLOR,
        stroke: { color: 0x151027, width: 5 },
        letterSpacing: 0.5,
      },
    });
    heading.anchor.set(0.5);
    heading.position.set(contentCenterX, HEADING_Y);

    this.countText = new Text({
      text: '6',
      style: {
        fontFamily: 'Arial Black, Impact, sans-serif',
        fontSize: 108,
        fontWeight: '900',
        fill: GOLD_TEXT_COLOR,
        stroke: { color: 0x151027, width: 10 },
        dropShadow: {
          color: 0x00141c,
          alpha: 0.65,
          blur: 2,
          angle: Math.PI / 2,
          distance: 7,
        },
      },
    });
    this.countText.anchor.set(0.5);
    this.countText.position.set(contentCenterX, COUNT_Y);
    this.addChild(heading, this.countText);
  }

  public setCount(count: number, animate = true): void {
    this.countText.text = String(count);

    if (animate) {
      gsap.fromTo(
        this.countText.scale,
        { x: 1.2, y: 1.2 },
        { x: 1, y: 1, duration: 0.28, ease: 'back.out(2)', overwrite: true },
      );
    }
  }
}

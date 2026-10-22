import { Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { gsap } from 'gsap';

export class LockMeter extends Container {
  private readonly countText: Text;
  private readonly pips: Graphics[] = [];

  public constructor(plateTexture: Texture) {
    super();

    const plate = new Sprite(plateTexture);
    plate.scale.set(0.25);
    this.addChild(plate);

    const heading = new Text({
      text: 'BARS LOCKED',
      style: {
        fontFamily: 'Arial Black, Impact, sans-serif',
        fontSize: 21,
        fontWeight: '900',
        fill: 0xffd71f,
        stroke: { color: 0x151027, width: 5 },
        letterSpacing: 1,
      },
    });
    heading.anchor.set(0.5);
    heading.position.set(132, 82);

    this.countText = new Text({
      text: '6',
      style: {
        fontFamily: 'Arial Black, Impact, sans-serif',
        fontSize: 116,
        fontWeight: '900',
        fill: 0xffd71f,
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
    this.countText.position.set(132, 187);

    const pipRow = new Container();
    pipRow.position.set(77, 277);
    for (let index = 0; index < 6; index += 1) {
      const pip = new Graphics()
        .roundRect(0, 0, 14, 27, 7)
        .fill({ color: 0xffd71f })
        .stroke({ color: 0x151027, width: 3 });
      pip.position.x = index * 22;
      this.pips.push(pip);
      pipRow.addChild(pip);
    }

    this.addChild(heading, this.countText, pipRow);
  }

  public setCount(count: number, animate = true): void {
    this.countText.text = String(count);

    this.pips.forEach((pip, index) => {
      const active = index < count;
      gsap.to(pip, {
        alpha: active ? 1 : 0.2,
        duration: animate ? 0.2 : 0,
        ease: 'power2.out',
        overwrite: true,
      });
    });

    if (animate) {
      gsap.fromTo(
        this.countText.scale,
        { x: 1.2, y: 1.2 },
        { x: 1, y: 1, duration: 0.28, ease: 'back.out(2)', overwrite: true },
      );
    }
  }
}

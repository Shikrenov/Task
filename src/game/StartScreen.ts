import { Container, Graphics, Rectangle, Sprite, Text, Texture } from 'pixi.js';
import { gsap } from 'gsap';
import { playTimeline } from './animation';
import { GOLD_TEXT_COLOR } from './colors';
import { STAGE_HEIGHT, STAGE_WIDTH } from './constants';

const DARK_COLOR = 0x151027;
const TEAL_COLOR = 0x0798a8;
const LIGHT_TEAL_COLOR = 0x37d2d5;
const LIGHT_TEXT_COLOR = 0xfff2c5;
const MENU_EXIT_DURATION = 1;
const PANEL_TRANSITION_DURATION = 0.28;
const MAIN_CONTENT_Y = 10;
const LANDSCAPE_PLATE_ROTATION = Math.PI / 2;
const LANDSCAPE_PLATE_SCALE_X = 0.5;
const LANDSCAPE_PLATE_SCALE_Y = 0.62;

interface StartScreenOptions {
  plateTexture: Texture;
  onPlay: () => void;
  onToggleSound: () => void;
}

interface GameButtonOptions {
  label: string;
  width?: number;
  onPress: () => void;
}

class GameButton extends Container {
  private readonly background = new Graphics();
  private enabled = true;

  public constructor(options: GameButtonOptions) {
    super();

    const width = options.width ?? 250;
    const height = 58;
    this.drawBackground(width, height);

    const label = new Text({
      text: options.label,
      style: {
        fontFamily: 'Arial Black, Impact, sans-serif',
        fontSize: 25,
        fontWeight: '900',
        fill: GOLD_TEXT_COLOR,
        stroke: { color: DARK_COLOR, width: 5 },
        letterSpacing: 1,
      },
    });
    label.anchor.set(0.5);
    label.position.y = -2;

    this.addChild(this.background, label);
    this.hitArea = new Rectangle(-width / 2, -height / 2, width, height);
    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerover', () => this.tweenScale(1.025));
    this.on('pointerout', () => this.tweenScale(1));
    this.on('pointerdown', () => this.tweenScale(0.98));
    this.on('pointerup', () => this.tweenScale(1.025));
    this.on('pointerupoutside', () => this.tweenScale(1));
    this.on('pointertap', () => {
      if (this.enabled) {
        options.onPress();
      }
    });
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.eventMode = enabled ? 'static' : 'none';
    this.cursor = enabled ? 'pointer' : 'default';

    if (!enabled) {
      gsap.killTweensOf(this.scale);
      this.scale.set(1);
    }
  }

  private drawBackground(width: number, height: number): void {
    this.background
      .roundRect(-width / 2 - 5, -height / 2 - 5, width + 10, height + 10, 15)
      .fill(DARK_COLOR)
      .roundRect(-width / 2, -height / 2, width, height, 11)
      .fill(TEAL_COLOR)
      .stroke({ color: GOLD_TEXT_COLOR, width: 3 })
      .roundRect(-width / 2 + 8, -height / 2 + 7, width - 16, height - 15, 7)
      .stroke({ color: LIGHT_TEAL_COLOR, width: 2, alpha: 0.7 });
  }

  private tweenScale(value: number): void {
    if (!this.enabled) {
      return;
    }

    gsap.to(this.scale, {
      x: value,
      y: value,
      duration: 0.12,
      ease: 'power2.out',
      overwrite: true,
    });
  }
}

export class SoundButton extends Container {
  private readonly icon = new Graphics();
  private muted = false;

  public constructor(onPress: () => void) {
    super();

    const background = new Graphics()
      .roundRect(-28, -25, 56, 50, 12)
      .fill(DARK_COLOR)
      .roundRect(-24, -21, 48, 42, 9)
      .fill(TEAL_COLOR)
      .stroke({ color: GOLD_TEXT_COLOR, width: 3 });

    this.addChild(background, this.icon);
    this.icon.position.x = -3;
    this.hitArea = new Rectangle(-30, -27, 60, 54);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.label = 'Mute sound';
    this.drawIcon();

    this.on('pointertap', onPress);
    this.on('pointerover', () => this.tweenScale(1.06));
    this.on('pointerout', () => this.tweenScale(1));
    this.on('pointerdown', () => this.tweenScale(0.94));
    this.on('pointerup', () => this.tweenScale(1.06));
    this.on('pointerupoutside', () => this.tweenScale(1));
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    this.label = muted ? 'Unmute sound' : 'Mute sound';
    this.drawIcon();
  }

  private drawIcon(): void {
    this.icon.clear();
    this.icon
      .poly([-14, -6, -7, -6, 2, -14, 2, 14, -7, 6, -14, 6])
      .fill(GOLD_TEXT_COLOR)
      .stroke({ color: DARK_COLOR, width: 2 });

    if (this.muted) {
      this.icon
        .moveTo(8, -8)
        .lineTo(19, 8)
        .moveTo(19, -8)
        .lineTo(8, 8)
        .stroke({ color: GOLD_TEXT_COLOR, width: 4, cap: 'round' });
      return;
    }

    this.icon
      .moveTo(8, -8)
      .quadraticCurveTo(18, 0, 8, 8)
      .moveTo(12, -13)
      .quadraticCurveTo(28, 0, 12, 13)
      .stroke({ color: GOLD_TEXT_COLOR, width: 3, cap: 'round' });
  }

  private tweenScale(value: number): void {
    gsap.to(this.scale, {
      x: value,
      y: value,
      duration: 0.12,
      ease: 'power2.out',
      overwrite: true,
    });
  }
}

export class StartScreen extends Container {
  private readonly backdrop: Graphics;
  private readonly holder = new Container();
  private readonly mainContent = new Container();
  private readonly rulesContent = new Container();
  private readonly playButton: GameButton;
  private readonly rulesButton: GameButton;
  private backButton!: GameButton;
  private readonly soundButton: SoundButton;
  private transitioning = false;

  public constructor(options: StartScreenOptions) {
    super();

    this.label = 'Free the Tiger start menu';
    this.eventMode = 'static';
    this.hitArea = new Rectangle(0, 0, STAGE_WIDTH, STAGE_HEIGHT);

    this.backdrop = new Graphics()
      .rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)
      .fill({ color: 0x07091d, alpha: 0.52 });
    this.addChild(this.backdrop);

    this.holder.position.set(STAGE_WIDTH / 2, STAGE_HEIGHT / 2);
    const plate = new Sprite(options.plateTexture);
    plate.anchor.set(0.5);
    plate.rotation = LANDSCAPE_PLATE_ROTATION;
    plate.scale.set(LANDSCAPE_PLATE_SCALE_X, LANDSCAPE_PLATE_SCALE_Y);
    this.holder.addChild(plate);

    const title = new Text({
      text: 'FREE THE TIGER',
      style: {
        fontFamily: 'Arial Black, Impact, sans-serif',
        fontSize: 62,
        fontWeight: '900',
        fill: GOLD_TEXT_COLOR,
        stroke: { color: DARK_COLOR, width: 9 },
        align: 'center',
        letterSpacing: 1.5,
        dropShadow: {
          color: 0x00141c,
          alpha: 0.65,
          blur: 2,
          angle: Math.PI / 2,
          distance: 6,
        },
      },
    });
    title.anchor.set(0.5);
    title.position.set(0, -135);

    const tagline = new Text({
      text: 'Unlock the bars in the right order\nand set the tiger free!',
      style: {
        fontFamily: 'Arial Black, Impact, sans-serif',
        fontSize: 16,
        fontWeight: '700',
        fill: LIGHT_TEXT_COLOR,
        stroke: { color: DARK_COLOR, width: 4 },
        align: 'center',
        lineHeight: 24,
      },
    });
    tagline.anchor.set(0.5);
    tagline.position.set(0, -60);

    this.playButton = new GameButton({
      label: 'PLAY',
      onPress: options.onPlay,
    });
    this.playButton.position.set(-150, 30);

    this.rulesButton = new GameButton({
      label: 'RULES',
      onPress: () => {
        void this.showRules();
      },
    });
    this.rulesButton.position.set(150, 30);

    this.soundButton = new SoundButton(options.onToggleSound);
    this.soundButton.position.set(0, 120);

    this.mainContent.position.y = MAIN_CONTENT_Y;
    this.mainContent.addChild(
      title,
      tagline,
      this.playButton,
      this.rulesButton,
      this.soundButton,
    );
    this.createRulesContent();
    this.rulesContent.visible = false;
    this.rulesContent.alpha = 0;

    this.holder.addChild(this.mainContent, this.rulesContent);
    this.addChild(this.holder);
  }

  public setMuted(muted: boolean): void {
    this.soundButton.setMuted(muted);
  }

  public async hide(): Promise<void> {
    if (this.transitioning || !this.visible) {
      return;
    }

    this.transitioning = true;
    this.setMenuEnabled(false);

    await playTimeline(
      gsap
        .timeline({ paused: true })
        .to(
          this.holder.scale,
          {
            x: 1.03,
            y: 1.03,
            duration: MENU_EXIT_DURATION,
            ease: 'power2.inOut',
          },
          0,
        )
        .to(
          this.holder,
          {
            alpha: 0,
            duration: MENU_EXIT_DURATION,
            ease: 'power2.inOut',
          },
          0,
        )
        .to(
          this.backdrop,
          {
            alpha: 0,
            duration: MENU_EXIT_DURATION,
            ease: 'power2.inOut',
          },
          0,
        ),
    );

    this.visible = false;
    this.eventMode = 'none';
  }

  private createRulesContent(): void {
    const heading = new Text({
      text: 'HOW TO PLAY',
      style: {
        fontFamily: 'Arial Black, Impact, sans-serif',
        fontSize: 34,
        fontWeight: '900',
        fill: GOLD_TEXT_COLOR,
        stroke: { color: DARK_COLOR, width: 7 },
        align: 'center',
      },
    });
    heading.anchor.set(0.5);
    heading.position.set(0, -135);

    const rules = new Text({
      text:
        'Open the numbered bars in the correct order.\n\n' +
        'Each correct choice unlocks one bar.\n\n' +
        'Choose the wrong bar and every opened bar slams shut — then a new sequence begins.\n\n' +
        'Unlock all six bars to FREE THE TIGER!',
      style: {
        fontFamily: 'Arial Black, Impact, sans-serif',
        fontSize: 15,
        fontWeight: '700',
        fill: LIGHT_TEXT_COLOR,
        stroke: { color: DARK_COLOR, width: 3 },
        align: 'center',
        lineHeight: 22,
        wordWrap: true,
        wordWrapWidth: 580,
      },
    });
    rules.anchor.set(0.5);
    rules.position.set(0, -5);

    this.backButton = new GameButton({
      label: 'BACK',
      width: 210,
      onPress: () => {
        void this.showMainMenu();
      },
    });
    this.backButton.position.set(0, 128);
    this.rulesContent.addChild(heading, rules, this.backButton);
  }

  private async showRules(): Promise<void> {
    if (this.transitioning) {
      return;
    }

    this.transitioning = true;
    this.playButton.setEnabled(false);
    this.rulesButton.setEnabled(false);
    this.setSoundButtonVisible(false);
    this.rulesContent.visible = true;
    this.rulesContent.x = 14;

    await playTimeline(
      gsap
        .timeline({ paused: true })
        .to(this.mainContent, {
          alpha: 0,
          x: -14,
          duration: PANEL_TRANSITION_DURATION,
          ease: 'power2.inOut',
        })
        .to(
          this.rulesContent,
          {
            alpha: 1,
            x: 0,
            duration: PANEL_TRANSITION_DURATION,
            ease: 'power2.inOut',
          },
          0.1,
        ),
    );

    this.mainContent.visible = false;
    this.backButton.setEnabled(true);
    this.transitioning = false;
  }

  private async showMainMenu(): Promise<void> {
    if (this.transitioning) {
      return;
    }

    this.transitioning = true;
    this.backButton.setEnabled(false);
    this.mainContent.visible = true;
    this.mainContent.x = -14;

    await playTimeline(
      gsap
        .timeline({ paused: true })
        .to(this.rulesContent, {
          alpha: 0,
          x: 14,
          duration: PANEL_TRANSITION_DURATION,
          ease: 'power2.inOut',
        })
        .to(
          this.mainContent,
          {
            alpha: 1,
            x: 0,
            duration: PANEL_TRANSITION_DURATION,
            ease: 'power2.inOut',
          },
          0.1,
        ),
    );

    this.rulesContent.visible = false;
    this.playButton.setEnabled(true);
    this.rulesButton.setEnabled(true);
    this.setSoundButtonVisible(true);
    this.transitioning = false;
  }

  private setSoundButtonVisible(visible: boolean): void {
    this.soundButton.visible = visible;
    this.soundButton.eventMode = visible ? 'static' : 'none';
    this.soundButton.cursor = visible ? 'pointer' : 'default';
  }

  private setMenuEnabled(enabled: boolean): void {
    this.playButton.setEnabled(enabled);
    this.rulesButton.setEnabled(enabled);
    this.backButton.setEnabled(enabled && this.rulesContent.visible);
    this.soundButton.eventMode = enabled ? 'static' : 'none';
    this.soundButton.cursor = enabled ? 'pointer' : 'default';
  }
}

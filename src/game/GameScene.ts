import { Container, Sprite, Texture } from "pixi.js";
import { gsap } from "gsap";
import { CageBar, type BarDirection } from "./CageBar";
import { BAR_CONFIGS } from "./barLayout";
import { LockMeter } from "./LockMeter";
import { playTimeline, waitUsingGsap } from "./animation";
import { createRandomCode } from "./random";
import { STAGE_HEIGHT, STAGE_WIDTH, type GameAsset } from "./constants";
import { GameAudio } from "./GameAudio";
import { SoundButton, StartScreen } from "./StartScreen";

type SceneTextures = Record<GameAsset, Texture>;
type GameState = "menu" | "playing" | "transitioning" | "resetting" | "winning";

const TOP_BAR_Y = 265;
const BOTTOM_BAR_Y = 475;
const BAR_ROW_GAP = (BOTTOM_BAR_Y - TOP_BAR_Y) / 2;
const BAR_ROWS = [TOP_BAR_Y, TOP_BAR_Y + BAR_ROW_GAP, BOTTOM_BAR_Y] as const;
const LEFT_BAR_X = 370;
const RIGHT_BAR_X = 910;
const CAGE_OPENING_LEFT = 405;
const CAGE_OPENING_RIGHT = 876;
const BAR_VISIBLE_WIDTH = 240;
const OPEN_CLEARANCE = 15;
const LEFT_BAR_OPEN_X = CAGE_OPENING_LEFT - OPEN_CLEARANCE - BAR_VISIBLE_WIDTH;
const RIGHT_BAR_OPEN_X =
  CAGE_OPENING_RIGHT + OPEN_CLEARANCE + BAR_VISIBLE_WIDTH;
const TIGER_START_X = 646;
const TIGER_START_Y = 418;
const TIGER_START_SCALE = 0.281;
const GAMEPLAY_REVEAL_DELAY = 0.12;
const GAMEPLAY_REVEAL_DURATION = 0.82;
const TIGER_NORMAL_LAYER_INDEX = 1;

export class GameScene extends Container {
  private readonly gameplayContainer = new Container();
  private readonly bars: CageBar[] = [];
  private readonly audio = new GameAudio();
  private readonly tiger: Sprite;
  private readonly winText: Sprite;
  private readonly meter: LockMeter;
  private readonly startScreen: StartScreen;
  private readonly gameSoundButton: SoundButton;
  private code: number[] = [];
  private progress = 0;
  private state: GameState = "menu";

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
    this.tiger.position.set(TIGER_START_X, TIGER_START_Y);
    this.tiger.scale.set(TIGER_START_SCALE);

    this.gameplayContainer.visible = false;
    this.gameplayContainer.alpha = 0;
    this.addChild(background, this.gameplayContainer);
    this.gameplayContainer.addChild(cage, this.tiger);
    this.createBars(textures);

    this.meter = new LockMeter(textures.plate);
    this.meter.position.set(0, -20);
    this.meter.scale.set(0.75);
    this.gameplayContainer.addChild(this.meter);

    this.winText = new Sprite(textures.winText);
    this.winText.anchor.set(0.5);
    this.winText.position.set(640, 535);
    this.winText.scale.set(0.48);
    this.winText.alpha = 0;
    this.winText.visible = false;
    this.gameplayContainer.addChild(this.winText);

    this.gameSoundButton = new SoundButton(() => this.toggleSound());
    this.gameSoundButton.position.set(1220, 52);
    this.gameSoundButton.visible = false;
    this.gameplayContainer.addChild(this.gameSoundButton);

    this.startScreen = new StartScreen({
      plateTexture: textures.plate,
      onPlay: () => {
        void this.startGame();
      },
      onToggleSound: () => this.toggleSound(),
    });
    this.startScreen.setMuted(this.audio.isMuted);
    this.addChild(this.startScreen);
    this.setState("menu");
  }

  private createBars(textures: SceneTextures): void {
    for (const config of BAR_CONFIGS) {
      const direction: BarDirection = config.direction;
      const bar = new CageBar({
        id: config.id,
        direction,
        x: direction === "left" ? LEFT_BAR_X : RIGHT_BAR_X,
        y: BAR_ROWS[config.row],
        openX: direction === "left" ? LEFT_BAR_OPEN_X : RIGHT_BAR_OPEN_X,
        barTexture: textures.bar,
        shadowTexture: textures.barShadow,
        onSelect: (id) => {
          void this.handleBarSelection(id);
        },
      });
      this.bars.push(bar);
      this.gameplayContainer.addChild(bar);
    }
  }

  private async handleBarSelection(id: number): Promise<void> {
    if (this.state !== "playing") {
      return;
    }

    this.audio.ensureBackgroundPlaying();
    this.setState("transitioning");

    if (id !== this.code[this.progress]) {
      await this.resetAfterMistake();
      return;
    }

    const bar = this.bars[id - 1];
    this.audio.playBarSound();
    await bar.open();
    this.progress += 1;
    this.meter.setCount(6 - this.progress);

    if (this.progress === this.code.length) {
      await this.playWinSequence();
      return;
    }

    this.setState("playing");
  }

  private async startGame(): Promise<void> {
    if (this.state !== "menu") {
      return;
    }

    this.setState("transitioning");
    this.audio.ensureBackgroundPlaying();
    this.gameplayContainer.visible = true;
    gsap.to(this.gameplayContainer, {
      alpha: 1,
      delay: GAMEPLAY_REVEAL_DELAY,
      duration: GAMEPLAY_REVEAL_DURATION,
      ease: "power2.inOut",
      overwrite: true,
    });
    await this.startScreen.hide();

    gsap.set(this.gameplayContainer, { alpha: 1 });
    this.gameSoundButton.visible = true;
    this.gameplayContainer.setChildIndex(
      this.gameSoundButton,
      this.gameplayContainer.children.length - 1
    );
    this.startNewRound();
  }

  private toggleSound(): void {
    const muted = this.audio.toggleMuted();
    this.startScreen.setMuted(muted);
    this.gameSoundButton.setMuted(muted);
  }

  private async resetAfterMistake(): Promise<void> {
    this.setState("resetting");
    const openedBars = this.bars.filter((bar) => bar.isOpen);

    if (openedBars.length > 0) {
      this.audio.playBarSound();
      await Promise.all(openedBars.map((bar) => bar.slamShut()));
    }

    this.startNewRound();
  }

  private async playWinSequence(): Promise<void> {
    this.setState("winning");
    this.gameplayContainer.setChildIndex(
      this.tiger,
      this.gameplayContainer.children.length - 1
    );
    this.gameplayContainer.setChildIndex(
      this.meter,
      this.gameplayContainer.children.length - 1
    );
    this.gameplayContainer.setChildIndex(
      this.winText,
      this.gameplayContainer.children.length - 1
    );
    this.gameplayContainer.setChildIndex(
      this.gameSoundButton,
      this.gameplayContainer.children.length - 1
    );
    this.winText.visible = true;
    const tigerSoundFinished = this.audio.playTigerWinSound();

    await playTimeline(
      gsap
        .timeline({ paused: true })
        .to(
          this.tiger,
          { x: 635, y: 302, duration: 0.9, ease: "power2.inOut" },
          0
        )
        .to(
          this.tiger.scale,
          { x: 0.63, y: 0.63, duration: 0.9, ease: "back.out(1.2)" },
          0
        )
        .fromTo(
          this.winText,
          { alpha: 0, y: 580, rotation: -0.04 },
          {
            alpha: 1,
            y: 535,
            rotation: 0,
            duration: 0.55,
            ease: "back.out(1.7)",
          },
          0.5
        )
    );

    await waitUsingGsap(3);
    await tigerSoundFinished;
    await this.resetAfterWin();
  }

  private async resetAfterWin(): Promise<void> {
    this.setState("resetting");
    this.audio.stopTigerWinSound();

    const resetTimeline = gsap
      .timeline({ paused: true })
        .to(
          this.winText,
          { alpha: 0, y: 570, duration: 0.3, ease: "power2.in" },
          0
        )
        .to(
          this.tiger,
          {
            x: TIGER_START_X,
            y: TIGER_START_Y,
            duration: 0.5,
            ease: "power2.inOut",
          },
          0
        )
        .to(
          this.tiger.scale,
          {
            x: TIGER_START_SCALE,
            y: TIGER_START_SCALE,
            duration: 0.5,
            ease: "power2.inOut",
          },
          0
        );

    await playTimeline(resetTimeline);

    this.winText.visible = false;
    this.gameplayContainer.setChildIndex(this.tiger, TIGER_NORMAL_LAYER_INDEX);

    this.audio.playBarSound();
    await Promise.all(this.bars.map((bar) => bar.slamShut()));
    this.startNewRound();
  }

  private startNewRound(): void {
    this.audio.reset();
    this.progress = 0;
    this.code = createRandomCode();
    this.meter.setCount(6, false);
    console.log("[Free the Tiger] Secret code:", [...this.code]);
    this.setState("playing");
  }

  private setState(state: GameState): void {
    this.state = state;
    const enabled = state === "playing";
    this.bars.forEach((bar) => bar.setInputEnabled(enabled));
  }
}

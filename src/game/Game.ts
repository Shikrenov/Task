import { Application, Assets, Container, Texture } from 'pixi.js';
import { ASSET_URLS, STAGE_HEIGHT, STAGE_WIDTH, type GameAsset } from './constants';
import { GameScene } from './GameScene';

export class Game {
  private readonly app = new Application();
  private readonly stageRoot = new Container();
  private readonly handleResize = (): void => this.resize();

  public constructor(private readonly mount: HTMLElement) {}

  public async start(): Promise<void> {
    await this.app.init({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x061b22,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      preference: 'webgl',
    });

    this.app.canvas.setAttribute('aria-label', 'Free the Tiger interactive game canvas');
    this.app.canvas.setAttribute('role', 'application');
    this.mount.appendChild(this.app.canvas);
    this.app.stage.addChild(this.stageRoot);

    const textures = await this.loadTextures();
    this.stageRoot.addChild(new GameScene(textures));

    window.addEventListener('resize', this.handleResize);
    this.resize();
  }

  private async loadTextures(): Promise<Record<GameAsset, Texture>> {
    const entries = await Promise.all(
      Object.entries(ASSET_URLS).map(async ([name, src]) => {
        const texture = await Assets.load<Texture>(src);
        return [name, texture] as const;
      }),
    );

    return Object.fromEntries(entries) as Record<GameAsset, Texture>;
  }

  private resize(): void {
    const width = Math.max(1, this.mount.clientWidth);
    const height = Math.max(1, this.mount.clientHeight);
    this.app.renderer.resize(width, height);

    const scale = Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT);
    this.stageRoot.scale.set(scale);
    this.stageRoot.position.set(
      Math.round((width - STAGE_WIDTH * scale) / 2),
      Math.round((height - STAGE_HEIGHT * scale) / 2),
    );
  }
}

import { AUDIO_URLS } from './constants';
import { waitUsingGsap } from './animation';

const BAR_SOUND_VOLUME = 0.68;
const TIGER_SOUND_VOLUME = 0.78;
const BACKGROUND_SOUND_VOLUME = 0.18;
const BACKGROUND_SOUND_DUCKED_VOLUME = 0.08;
const TIGER_SOUND_MAX_SECONDS = 5;
const BAR_SOUND_POOL_SIZE = 3;

function createAudio(src: string, volume: number): HTMLAudioElement {
  const audio = new Audio(src);
  audio.preload = 'auto';
  audio.volume = volume;
  return audio;
}

export class GameAudio {
  private readonly backgroundSound = createAudio(
    AUDIO_URLS.background,
    BACKGROUND_SOUND_VOLUME,
  );
  private readonly barSounds = Array.from({ length: BAR_SOUND_POOL_SIZE }, () =>
    createAudio(AUDIO_URLS.barOpen, BAR_SOUND_VOLUME),
  );
  private readonly tigerSound = createAudio(AUDIO_URLS.tigerWin, TIGER_SOUND_VOLUME);
  private nextBarSoundIndex = 0;
  private backgroundStartPending = false;
  private backgroundDucked = false;
  private muted = false;
  private readonly cancelPendingBarWaits = new Set<() => void>();
  private resolveTigerPlayback: (() => void) | undefined;

  public constructor() {
    this.backgroundSound.loop = true;
  }

  private readonly handleTigerTimeUpdate = (): void => {
    if (this.tigerSound.currentTime >= TIGER_SOUND_MAX_SECONDS) {
      this.stopTigerWinSound();
    }
  };

  private readonly handleTigerEnded = (): void => {
    this.stopTigerWinSound();
  };

  public playBarSound(): void {
    const sound = this.takeNextBarSound();
    this.restartAndPlay(sound);
  }

  public playBarSoundAndWait(releaseBeforeEndSeconds = 0): Promise<void> {
    if (this.muted) {
      return Promise.resolve();
    }

    const sound = this.takeNextBarSound();
    sound.pause();
    this.rewind(sound);

    return new Promise((resolve) => {
      let settled = false;
      const cancel = (): void => {
        sound.pause();
        this.rewind(sound);
        finish();
      };
      const finish = (): void => {
        if (settled) {
          return;
        }

        settled = true;
        sound.removeEventListener('ended', finish);
        sound.removeEventListener('error', finish);
        sound.removeEventListener('abort', finish);
        sound.removeEventListener('emptied', finish);
        this.cancelPendingBarWaits.delete(cancel);
        resolve();
      };

      sound.addEventListener('ended', finish);
      sound.addEventListener('error', finish);
      sound.addEventListener('abort', finish);
      sound.addEventListener('emptied', finish);
      this.cancelPendingBarWaits.add(cancel);

      try {
        void sound.play().then(() => {
          if (releaseBeforeEndSeconds > 0 && Number.isFinite(sound.duration)) {
            void waitUsingGsap(
              Math.max(0, sound.duration - releaseBeforeEndSeconds),
            ).then(finish);
          }
        }, finish);
      } catch {
        finish();
      }
    });
  }

  public ensureBackgroundPlaying(): void {
    if (!this.backgroundSound.paused || this.backgroundStartPending) {
      return;
    }

    this.backgroundStartPending = true;
    void this.backgroundSound.play().then(
      () => {
        this.backgroundStartPending = false;
      },
      () => {
        this.backgroundStartPending = false;
      },
    );
  }

  public playTigerWinSound(): Promise<void> {
    this.stopTigerWinSound();
    this.backgroundDucked = true;
    this.applyVolumes();
    this.tigerSound.addEventListener('timeupdate', this.handleTigerTimeUpdate);
    this.tigerSound.addEventListener('ended', this.handleTigerEnded);

    const playbackFinished = new Promise<void>((resolve) => {
      this.resolveTigerPlayback = resolve;
    });

    this.playSafely(this.tigerSound, () => this.stopTigerWinSound());
    return playbackFinished;
  }

  public stopTigerWinSound(): void {
    this.tigerSound.removeEventListener('timeupdate', this.handleTigerTimeUpdate);
    this.tigerSound.removeEventListener('ended', this.handleTigerEnded);
    this.tigerSound.pause();
    this.rewind(this.tigerSound);
    this.backgroundDucked = false;
    this.applyVolumes();

    const resolvePlayback = this.resolveTigerPlayback;
    this.resolveTigerPlayback = undefined;
    resolvePlayback?.();
  }

  public reset(): void {
    this.stopTigerWinSound();
  }

  public toggleMuted(): boolean {
    this.muted = !this.muted;

    if (this.muted) {
      [...this.cancelPendingBarWaits].forEach((cancel) => cancel());
    }

    this.applyVolumes();
    return this.muted;
  }

  public get isMuted(): boolean {
    return this.muted;
  }

  private restartAndPlay(audio: HTMLAudioElement): void {
    audio.pause();
    this.rewind(audio);
    this.playSafely(audio);
  }

  private takeNextBarSound(): HTMLAudioElement {
    const sound = this.barSounds[this.nextBarSoundIndex];
    this.nextBarSoundIndex = (this.nextBarSoundIndex + 1) % this.barSounds.length;
    return sound;
  }

  private playSafely(audio: HTMLAudioElement, onFailure?: () => void): void {
    try {
      void audio.play().catch(() => {
        onFailure?.();
      });
    } catch {
      onFailure?.();
    }
  }

  private rewind(audio: HTMLAudioElement): void {
    try {
      audio.currentTime = 0;
    } catch {
      // Metadata may not be available yet; playback can still proceed safely.
    }
  }

  private applyVolumes(): void {
    const mutedVolume = this.muted ? 0 : 1;
    this.backgroundSound.volume =
      (this.backgroundDucked
        ? BACKGROUND_SOUND_DUCKED_VOLUME
        : BACKGROUND_SOUND_VOLUME) * mutedVolume;
    this.barSounds.forEach((sound) => {
      sound.volume = BAR_SOUND_VOLUME * mutedVolume;
    });
    this.tigerSound.volume = TIGER_SOUND_VOLUME * mutedVolume;
  }
}

export const STAGE_WIDTH = 1280;
export const STAGE_HEIGHT = 720;

export const ASSET_URLS = {
  background: new URL('../../assets/background.jpg', import.meta.url).href,
  cage: new URL('../../assets/cage.png', import.meta.url).href,
  tiger: new URL('../../assets/tiger.png', import.meta.url).href,
  plate: new URL('../../assets/plate.png', import.meta.url).href,
  bar: new URL('../../assets/bar.png', import.meta.url).href,
  barShadow: new URL('../../assets/barShadow.png', import.meta.url).href,
  winText: new URL('../../assets/txt.png', import.meta.url).href,
} as const;

export const AUDIO_URLS = {
  background: new URL('../../assets/background_sound.mp3', import.meta.url).href,
  barOpen: new URL('../../assets/bar_open_sound.mp3', import.meta.url).href,
  tigerWin: new URL('../../assets/tiger_win_sound.mp3', import.meta.url).href,
} as const;

export type GameAsset = keyof typeof ASSET_URLS;

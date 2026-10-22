import type { BarDirection } from './CageBar';

export interface BarConfig {
  id: number;
  direction: BarDirection;
  row: number;
}

export const BAR_CONFIGS: readonly BarConfig[] = [
  { id: 1, direction: 'left', row: 0 },
  { id: 2, direction: 'left', row: 1 },
  { id: 3, direction: 'left', row: 2 },
  { id: 4, direction: 'right', row: 0 },
  { id: 5, direction: 'right', row: 1 },
  { id: 6, direction: 'right', row: 2 },
];

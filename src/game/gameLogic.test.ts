import { describe, expect, it } from 'vitest';
import { BAR_CONFIGS } from './barLayout';
import { createRandomCode } from './random';

describe('round code generation', () => {
  it('always returns each bar number exactly once', () => {
    for (let round = 0; round < 1_000; round += 1) {
      expect([...createRandomCode()].sort()).toEqual([1, 2, 3, 4, 5, 6]);
    }
  });
});

describe('bar layout', () => {
  it('maps 1–3 left and 4–6 right across three rows', () => {
    expect(BAR_CONFIGS).toEqual([
      { id: 1, direction: 'left', row: 0 },
      { id: 2, direction: 'left', row: 1 },
      { id: 3, direction: 'left', row: 2 },
      { id: 4, direction: 'right', row: 0 },
      { id: 5, direction: 'right', row: 1 },
      { id: 6, direction: 'right', row: 2 },
    ]);
  });
});

import { describe, it, expect } from 'vitest';
import { createBoard, findMatches, resolveAll, swapMakesMatch, areAdjacent } from '@/game/battle/grid';
import { GRID } from '@/data/balance';

// Deterministic RNG (mulberry32)
function rngFrom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('grid', () => {
  it('createBoard has no immediate matches', () => {
    const board = createBoard(rngFrom(42));
    expect(board).toHaveLength(GRID.rows * GRID.cols);
    expect(findMatches(board).size).toBe(0);
  });

  it('detects a horizontal match', () => {
    const board = createBoard(rngFrom(7));
    // Force a 3-in-a-row on the top row.
    board[0] = 'FIRE';
    board[1] = 'FIRE';
    board[2] = 'FIRE';
    const m = findMatches(board);
    expect(m.has(0)).toBe(true);
    expect(m.has(1)).toBe(true);
    expect(m.has(2)).toBe(true);
  });

  it('resolveAll stabilizes to a matchless board', () => {
    const board = createBoard(rngFrom(99));
    board[0] = 'SPIKE';
    board[1] = 'SPIKE';
    board[2] = 'SPIKE';
    const { grid } = resolveAll(board, rngFrom(123));
    expect(findMatches(grid).size).toBe(0);
  });

  it('areAdjacent / swapMakesMatch behave', () => {
    expect(areAdjacent(0, 1)).toBe(true);
    expect(areAdjacent(0, GRID.cols)).toBe(true);
    expect(areAdjacent(0, 2)).toBe(false);
    const board = createBoard(rngFrom(5));
    // a non-adjacent swap can never make a match
    expect(swapMakesMatch(board, 0, 2)).toBe(false);
  });
});

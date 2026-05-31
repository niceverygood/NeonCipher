// ============================================================================
// Match-3 grid — pure logic. Grid is a flat array, index = row * cols + col.
// Row 0 is the TOP; gravity pulls tiles toward the bottom (higher rows).
// ============================================================================

import type { Attribute } from '@/types';
import { ATTR_ORDER, GRID } from '@/data/balance';

export type Cell = Attribute;
export type Rng = () => number;

export interface MatchStep {
  clearedCount: number;
  byAttribute: Partial<Record<Attribute, number>>;
  maxRun: number; // longest single run in this step (for 4/5 bonus)
}

export function idx(row: number, col: number): number {
  return row * GRID.cols + col;
}

export function rowOf(i: number): number {
  return Math.floor(i / GRID.cols);
}
export function colOf(i: number): number {
  return i % GRID.cols;
}

export function randomTile(rng: Rng): Attribute {
  return ATTR_ORDER[Math.floor(rng() * ATTR_ORDER.length)];
}

export function areAdjacent(a: number, b: number): boolean {
  const ra = rowOf(a),
    ca = colOf(a),
    rb = rowOf(b),
    cb = colOf(b);
  return Math.abs(ra - rb) + Math.abs(ca - cb) === 1;
}

/** Create a fresh board with no pre-existing matches. */
export function createBoard(rng: Rng): Cell[] {
  const size = GRID.rows * GRID.cols;
  const grid: Cell[] = new Array(size);
  for (let i = 0; i < size; i++) {
    let tile = randomTile(rng);
    // Avoid creating an immediate match while generating.
    let guard = 0;
    while (guard++ < 20 && createsImmediate(grid, i, tile)) {
      tile = randomTile(rng);
    }
    grid[i] = tile;
  }
  return grid;
}

function createsImmediate(grid: Cell[], i: number, tile: Attribute): boolean {
  const r = rowOf(i),
    c = colOf(i);
  // horizontal: two to the left already equal
  if (c >= 2 && grid[idx(r, c - 1)] === tile && grid[idx(r, c - 2)] === tile) return true;
  // vertical: two above already equal
  if (r >= 2 && grid[idx(r - 1, c)] === tile && grid[idx(r - 2, c)] === tile) return true;
  return false;
}

/** Find all matched cell indices (runs of 3+). */
export function findMatches(grid: Cell[]): Set<number> {
  const matched = new Set<number>();
  // Horizontal
  for (let r = 0; r < GRID.rows; r++) {
    let runStart = 0;
    for (let c = 1; c <= GRID.cols; c++) {
      const same = c < GRID.cols && grid[idx(r, c)] === grid[idx(r, runStart)];
      if (!same) {
        const len = c - runStart;
        if (len >= 3) for (let k = runStart; k < c; k++) matched.add(idx(r, k));
        runStart = c;
      }
    }
  }
  // Vertical
  for (let c = 0; c < GRID.cols; c++) {
    let runStart = 0;
    for (let r = 1; r <= GRID.rows; r++) {
      const same = r < GRID.rows && grid[idx(r, c)] === grid[idx(runStart, c)];
      if (!same) {
        const len = r - runStart;
        if (len >= 3) for (let k = runStart; k < r; k++) matched.add(idx(k, c));
        runStart = r;
      }
    }
  }
  return matched;
}

/** Longest contiguous run length present among matched cells (for bonus). */
function longestRun(matched: Set<number>): number {
  let max = 0;
  // horizontal runs
  for (let r = 0; r < GRID.rows; r++) {
    let len = 0;
    for (let c = 0; c < GRID.cols; c++) {
      if (matched.has(idx(r, c))) {
        len++;
        max = Math.max(max, len);
      } else len = 0;
    }
  }
  for (let c = 0; c < GRID.cols; c++) {
    let len = 0;
    for (let r = 0; r < GRID.rows; r++) {
      if (matched.has(idx(r, c))) {
        len++;
        max = Math.max(max, len);
      } else len = 0;
    }
  }
  return max;
}

/** Whether swapping a,b yields at least one match. Does not mutate. */
export function swapMakesMatch(grid: Cell[], a: number, b: number): boolean {
  if (!areAdjacent(a, b)) return false;
  const next = grid.slice();
  const tmp = next[a];
  next[a] = next[b];
  next[b] = tmp;
  return findMatches(next).size > 0;
}

export function swapped(grid: Cell[], a: number, b: number): Cell[] {
  const next = grid.slice();
  const tmp = next[a];
  next[a] = next[b];
  next[b] = tmp;
  return next;
}

/**
 * Resolve a single match step: clear matches, apply gravity, refill.
 * Returns the new grid and a MatchStep summary, or null if no matches.
 */
export function resolveStep(grid: Cell[], rng: Rng): { grid: Cell[]; step: MatchStep } | null {
  const matched = findMatches(grid);
  if (matched.size === 0) return null;

  const byAttribute: Partial<Record<Attribute, number>> = {};
  matched.forEach((i) => {
    const attr = grid[i];
    byAttribute[attr] = (byAttribute[attr] ?? 0) + 1;
  });
  const maxRun = longestRun(matched);

  // Clear matched, then gravity per column.
  const next = grid.slice();
  matched.forEach((i) => {
    // mark cleared with a sentinel by collapsing later
    (next as (Cell | null)[])[i] = null;
  });

  for (let c = 0; c < GRID.cols; c++) {
    const column: Cell[] = [];
    for (let r = GRID.rows - 1; r >= 0; r--) {
      const v = (next as (Cell | null)[])[idx(r, c)];
      if (v !== null) column.push(v as Cell);
    }
    // column now holds surviving tiles bottom-up. Refill the rest with new tiles.
    let writeRow = GRID.rows - 1;
    for (const tile of column) {
      next[idx(writeRow, c)] = tile;
      writeRow--;
    }
    while (writeRow >= 0) {
      next[idx(writeRow, c)] = randomTile(rng);
      writeRow--;
    }
  }

  return { grid: next, step: { clearedCount: matched.size, byAttribute, maxRun } };
}

/** Resolve all cascades from the current board. Returns final grid + steps. */
export function resolveAll(grid: Cell[], rng: Rng): { grid: Cell[]; steps: MatchStep[] } {
  let current = grid;
  const steps: MatchStep[] = [];
  let guard = 0;
  while (guard++ < 50) {
    const res = resolveStep(current, rng);
    if (!res) break;
    current = res.grid;
    steps.push(res.step);
  }
  return { grid: current, steps };
}

/** Energy gained from a single match step (before combo scaling). */
export function energyFromStep(step: MatchStep, cascadeDepth: number): Partial<Record<Attribute, number>> {
  let runBonus = 1;
  if (step.maxRun >= 5) runBonus = GRID.match5Bonus;
  else if (step.maxRun === 4) runBonus = GRID.match4Bonus;
  const cascadeMult = 1 + cascadeDepth * GRID.cascadeBonus;
  const out: Partial<Record<Attribute, number>> = {};
  for (const attr of Object.keys(step.byAttribute) as Attribute[]) {
    const tiles = step.byAttribute[attr] ?? 0;
    out[attr] = tiles * GRID.energyPerTile * runBonus * cascadeMult;
  }
  return out;
}

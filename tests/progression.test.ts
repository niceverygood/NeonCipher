import { describe, it, expect } from 'vitest';
import { addExp, computeStars, deriveStats, starsForDupes } from '@/game/progression/stats';
import { GHOST_BY_ID } from '@/data/ghosts';
import { LEVEL, STAR } from '@/data/balance';
import type { OwnedGhost } from '@/types';

describe('deriveStats', () => {
  it('scales with rarity, level, and stars', () => {
    const def = GHOST_BY_ID['g_revenant'];
    const lvl1: OwnedGhost = { id: def.id, level: 1, stars: 1, dupes: 0 };
    const lvl10: OwnedGhost = { id: def.id, level: 10, stars: 3, dupes: 2 };
    const a = deriveStats(def, lvl1);
    const b = deriveStats(def, lvl10);
    expect(b.hp).toBeGreaterThan(a.hp);
    expect(b.atk).toBeGreaterThan(a.atk);
    expect(b.power).toBeGreaterThan(a.power);
  });
});

describe('computeStars', () => {
  it('awards 3 stars for >=80% core hp', () => {
    expect(computeStars(80, 100)).toBe(3);
  });
  it('awards 2 stars for >=40% core hp', () => {
    expect(computeStars(40, 100)).toBe(2);
  });
  it('awards 1 star for surviving with low hp', () => {
    expect(computeStars(5, 100)).toBe(1);
  });
  it('awards 0 stars when the core is destroyed', () => {
    expect(computeStars(0, 100)).toBe(0);
  });
});

describe('starsForDupes', () => {
  it('starts at 1 star and caps at the max', () => {
    expect(starsForDupes(0)).toBe(1);
    expect(starsForDupes(2)).toBe(1 + 2 / STAR.dupesPerStar);
    expect(starsForDupes(999)).toBe(STAR.maxStars);
  });
});

describe('addExp', () => {
  it('levels up when enough exp is supplied and never exceeds max', () => {
    const o: OwnedGhost = { id: 'g_jolt', level: 1, stars: 1, dupes: 0 };
    const leveled = addExp(o, LEVEL.expPerLevel * 1); // exactly one level (1->2 needs 1*100)
    expect(leveled.level).toBe(2);

    const huge = addExp(o, 10_000_000);
    expect(huge.level).toBe(LEVEL.maxLevel);
  });
});

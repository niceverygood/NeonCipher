import { describe, it, expect } from 'vitest';
import { pullOnce, pullTen, ssrRateAt } from '@/game/gacha/gacha';
import type { GachaState } from '@/types';
import { GACHA } from '@/data/balance';

function freshState(over: Partial<GachaState> = {}): GachaState {
  return { pity: 0, guaranteed: false, totalPulls: 0, ...over };
}

// Deterministic RNGs
const lowRng = () => 0.0; // always "hits" (SSR / first pool item)
const highRng = () => 0.99; // never SSR, picks R

describe('ssrRateAt', () => {
  it('uses base rate before soft pity', () => {
    expect(ssrRateAt(0)).toBeCloseTo(GACHA.baseSSR, 5);
    expect(ssrRateAt(10)).toBeCloseTo(GACHA.baseSSR, 5);
  });

  it('ramps after soft pity starts (pull 75)', () => {
    // pity 74 => pull number 75 => base + 1*ramp
    expect(ssrRateAt(74)).toBeCloseTo(GACHA.baseSSR + GACHA.softPityRamp, 5);
  });

  it('is capped at 1', () => {
    expect(ssrRateAt(200)).toBe(1);
  });
});

describe('pullOnce — hard pity', () => {
  it('guarantees an SSR on the 90th pull even with bad rolls', () => {
    const state = freshState({ pity: 89 });
    const r = pullOnce(state, highRng);
    expect(['SSR', 'UR']).toContain(r.rarity);
    expect(state.pity).toBe(0); // counter resets
  });
});

describe('pullOnce — 50:50 pickup', () => {
  it('losing the 50:50 sets the guaranteed flag, winning clears it', () => {
    // Force SSR via low rng on the isSSR check, then control the featured coin.
    const lose: number[] = [0.0 /*isSSR hit*/, 0.99 /*featured coin -> lose*/, 0.0 /*pick*/];
    let i = 0;
    const loseRng = () => lose[i++ % lose.length];
    const state = freshState();
    const r1 = pullOnce(state, loseRng);
    expect(['SSR', 'UR']).toContain(r1.rarity);
    expect(r1.featured).toBe(false);
    expect(state.guaranteed).toBe(true);

    // Next SSR must be featured because guaranteed is set.
    const win: number[] = [0.0 /*isSSR hit*/, 0.99 /*coin irrelevant when guaranteed*/, 0.0];
    let j = 0;
    const winRng = () => win[j++ % win.length];
    const r2 = pullOnce(state, winRng);
    expect(r2.featured).toBe(true);
    expect(state.guaranteed).toBe(false);
  });
});

describe('pullTen — SR guarantee', () => {
  it('always yields at least one SR-or-above', () => {
    const state = freshState();
    const results = pullTen(state, highRng); // highRng -> all R without the guard
    const hasSROrAbove = results.some((r) => r.rarity === 'SR' || r.rarity === 'SSR' || r.rarity === 'UR');
    expect(results).toHaveLength(10);
    expect(hasSROrAbove).toBe(true);
  });

  it('SSR-heavy pulls also resolve cleanly', () => {
    const state = freshState();
    const results = pullTen(state, lowRng);
    expect(results).toHaveLength(10);
    results.forEach((r) => expect(['R', 'SR', 'SSR', 'UR']).toContain(r.rarity));
  });
});

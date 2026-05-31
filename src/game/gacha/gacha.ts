// ============================================================================
// Gacha — pure, deterministic logic. No React, no store, no globals.
// Probabilities, soft/hard pity, 10-pull guarantee, 50:50 pickup.
// ============================================================================

import type { GachaState, Rarity } from '@/types';
import { GACHA } from '@/data/balance';
import {
  SSR_POOL,
  SR_POOL,
  R_POOL,
  FEATURED_POOL,
} from '@/data/ghosts';

export type Rng = () => number; // returns [0, 1)

export interface PullResult {
  ghostId: string;
  rarity: Rarity;
  featured: boolean;
  isNew?: boolean; // filled in by the store when applied
}

/** SSR probability for the current pity counter (before this pull). */
export function ssrRateAt(pity: number): number {
  // pity here is the count of pulls since last SSR (i.e. about to make pull #pity+1)
  const pullNumber = pity + 1;
  let rate = GACHA.baseSSR;
  if (pullNumber >= GACHA.softPityStart) {
    rate += (pullNumber - (GACHA.softPityStart - 1)) * GACHA.softPityRamp;
  }
  return Math.min(1, rate);
}

function pickFrom(pool: string[], rng: Rng): string {
  return pool[Math.floor(rng() * pool.length)] ?? pool[0];
}

/** Pick an SSR-or-above unit, honoring the 50:50 featured rule. Mutates state. */
function pickSSR(state: GachaState, rng: Rng): PullResult {
  const wonFeatured = state.guaranteed || rng() < 0.5;
  if (wonFeatured) {
    state.guaranteed = false;
    const id = pickFrom(FEATURED_POOL, rng);
    // Featured pool may contain UR units; report their true rarity.
    const rarity: Rarity = FEATURED_POOL.length ? rarityOfFeatured(id) : 'SSR';
    return { ghostId: id, rarity, featured: true };
  }
  // Lost the 50:50 → next SSR guaranteed featured.
  state.guaranteed = true;
  const id = pickFrom(SSR_POOL, rng);
  return { ghostId: id, rarity: 'SSR', featured: false };
}

function rarityOfFeatured(id: string): Rarity {
  // Featured units are UR in the seed roster; fall back to SSR otherwise.
  return id.startsWith('g_') && (id === 'g_revenant' || id === 'g_aegis') ? 'UR' : 'SSR';
}

/**
 * Perform a single pull. Mutates `state` (pity / guaranteed / totalPulls).
 */
export function pullOnce(state: GachaState, rng: Rng): PullResult {
  state.totalPulls++;
  const rate = ssrRateAt(state.pity);
  const isSSR = state.pity + 1 >= GACHA.hardPity || rng() < rate;
  if (isSSR) {
    state.pity = 0;
    return pickSSR(state, rng);
  }
  state.pity++;
  // SR vs R among the non-SSR space.
  const srShare = GACHA.baseSR / (1 - GACHA.baseSSR);
  if (rng() < srShare) {
    return { ghostId: pickFrom(SR_POOL, rng), rarity: 'SR', featured: false };
  }
  return { ghostId: pickFrom(R_POOL, rng), rarity: 'R', featured: false };
}

const RARITY_RANK: Record<Rarity, number> = { R: 0, SR: 1, SSR: 2, UR: 3 };

/**
 * Ten-pull: 10 single pulls, then guarantee at least one SR-or-above by
 * upgrading the lowest-rarity result to an SR if none qualified.
 */
export function pullTen(state: GachaState, rng: Rng): PullResult[] {
  const results: PullResult[] = [];
  for (let i = 0; i < 10; i++) {
    results.push(pullOnce(state, rng));
  }
  const hasSROrAbove = results.some((r) => RARITY_RANK[r.rarity] >= 1);
  if (!hasSROrAbove) {
    // Upgrade the first R to an SR (deterministic given rng order).
    const idx = results.findIndex((r) => r.rarity === 'R');
    if (idx >= 0) {
      results[idx] = { ghostId: pickFrom(SR_POOL, rng), rarity: 'SR', featured: false };
    }
  }
  return results;
}

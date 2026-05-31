// ============================================================================
// Progression — pure stat derivation, leveling, awakening, star rating.
// ============================================================================

import type { BattleResult, GhostDef, OwnedGhost } from '@/types';
import { LEVEL, RARITY_MULT, STAR } from '@/data/balance';

export interface DerivedStats {
  hp: number;
  atk: number;
  atkInterval: number;
  cost: number;
  cooldown: number;
  power: number;
}

/** Final stats for an owned ghost = base × rarity × level × star. */
export function deriveStats(def: GhostDef, owned: OwnedGhost): DerivedStats {
  const rm = RARITY_MULT[def.rarity];
  const levelMult = 1 + (owned.level - 1) * LEVEL.hpPerLevel;
  const levelAtkMult = 1 + (owned.level - 1) * LEVEL.atkPerLevel;
  const starMult = 1 + (owned.stars - 1) * STAR.statPerStar;

  const hp = Math.round(def.baseHp * rm.hp * levelMult * starMult);
  const atk = Math.round(def.baseAtk * rm.atk * levelAtkMult * starMult);
  return {
    hp,
    atk,
    atkInterval: def.atkInterval,
    cost: def.cost,
    cooldown: def.cooldown,
    power: Math.round(hp * 0.4 + atk * 6 + owned.level * 8 + owned.stars * 40),
  };
}

export function expToNext(level: number): number {
  return level * LEVEL.expPerLevel;
}

/** Apply exp to an owned ghost, leveling up as needed. Returns a new object. */
export function addExp(owned: OwnedGhost, exp: number): OwnedGhost {
  let level = owned.level;
  let pool = exp;
  while (level < LEVEL.maxLevel) {
    const need = expToNext(level);
    if (pool >= need) {
      pool -= need;
      level++;
    } else break;
  }
  return { ...owned, level };
}

/** Stars derived from total dupes collected (capped). */
export function starsForDupes(dupes: number): number {
  return Math.min(STAR.maxStars, 1 + Math.floor(dupes / STAR.dupesPerStar));
}

/** Compute 1..3 star rating for a finished battle. */
export function computeStars(
  coreHpRemaining: number,
  coreHpMax: number,
): number {
  const ratio = coreHpRemaining / coreHpMax;
  if (ratio >= 0.8) return 3;
  if (ratio >= 0.4) return 2;
  if (coreHpRemaining > 0) return 1;
  return 0;
}

/** Reward crystals from a battle result, scaled by stars + base reward. */
export function battleReward(base: number, result: BattleResult): number {
  if (!result.victory) return Math.round(base * 0.2);
  const starBonus = 1 + result.stars * 0.25;
  return Math.round(base * starBonus);
}

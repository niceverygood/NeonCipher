// ============================================================================
// Tuning constants — single source of truth for balance. Tweak freely.
// ============================================================================

import type { Attribute, EnemyKind, Rarity } from '@/types';

export const GRID = {
  cols: 6,
  rows: 6,
  energyPerTile: 8, // base energy per matched tile
  match4Bonus: 1.4, // multiplier for 4-matches
  match5Bonus: 1.8, // multiplier for 5+-matches
  cascadeBonus: 0.35, // additive multiplier per cascade depth
  energyCap: 100,
} as const;

export const COMBO = {
  windowSec: 1.5, // time window to keep combo alive
  overclockPerCombo: 7, // overclock gauge gained per combo step
  overclockMax: 100,
} as const;

export const OVERCLOCK = {
  durationSec: 6,
  enemySlow: 0.5, // enemies move/attack at 50% speed
  allyDamageMult: 1.5,
} as const;

export const FIELD = {
  lanes: 3,
  laneLengthSec: 12, // baseline seconds for an enemy to cross a lane
} as const;

export const ENEMY: Record<EnemyKind, { hp: number; speed: number; damage: number; reward: number }> = {
  // speed = fraction of lane traversed per second (higher = faster)
  NORMAL: { hp: 60, speed: 1 / 14, damage: 8, reward: 4 },
  RUSH: { hp: 38, speed: 1 / 8, damage: 6, reward: 5 },
  HEAVY: { hp: 220, speed: 1 / 22, damage: 18, reward: 10 },
  BOSS: { hp: 1400, speed: 1 / 34, damage: 40, reward: 60 },
};

// Status-effect tuning applied to enemies by ghost skills.
export const STATUS = {
  burnDps: 0.6, // fraction of caster ATK applied per second
  burnDuration: 4,
  vulnerableMult: 1.5, // incoming damage multiplier
  vulnerableDuration: 5,
} as const;

// Per-rarity multipliers applied to ghost base stats.
export const RARITY_MULT: Record<Rarity, { hp: number; atk: number }> = {
  R: { hp: 1.0, atk: 1.0 },
  SR: { hp: 1.25, atk: 1.2 },
  SSR: { hp: 1.55, atk: 1.45 },
  UR: { hp: 1.9, atk: 1.75 },
};

// Per-level growth (multiplicative on base, additive per level).
export const LEVEL = {
  hpPerLevel: 0.08, // +8% base hp per level above 1
  atkPerLevel: 0.08,
  maxLevel: 30,
  expPerLevel: 100, // exp to go from level N to N+1 = N * this
};

// Awakening (stars) flat multiplier per star above 1.
export const STAR = {
  statPerStar: 0.06,
  maxStars: 6,
  dupesPerStar: 1, // dupes needed to gain a star
};

// Attribute → tile glyph (Korean single char used in mockups).
export const ATTR_GLYPH: Record<Attribute, string> = {
  FIRE: '화',
  BLOCK: '차',
  SPIKE: '침',
  SURGE: '과',
  REPAIR: '복',
};

export const ATTR_LABEL: Record<Attribute, string> = {
  FIRE: '화력',
  BLOCK: '차단',
  SPIKE: '침투',
  SURGE: '과부하',
  REPAIR: '복원',
};

export const ATTR_VAR: Record<Attribute, string> = {
  FIRE: 'var(--fire)',
  BLOCK: 'var(--block)',
  SPIKE: 'var(--spike)',
  SURGE: 'var(--surge)',
  REPAIR: 'var(--repair)',
};

export const ATTR_ORDER: Attribute[] = ['FIRE', 'BLOCK', 'SPIKE', 'SURGE', 'REPAIR'];

export const ROLE_LABEL: Record<string, string> = {
  DEALER: '딜러',
  TANK: '탱커',
  DEBUFFER: '디버퍼',
  SUPPORT: '서포터',
  HEALER: '힐러',
  SUMMONER: '소환사',
};

export const RARITY_STARS: Record<Rarity, number> = {
  R: 3,
  SR: 4,
  SSR: 5,
  UR: 6,
};

// ---------------------------------------------------------------------------
// Gacha config
// ---------------------------------------------------------------------------
export const GACHA = {
  baseSSR: 0.02,
  baseSR: 0.18,
  // R is the remainder.
  softPityStart: 75, // SSR rate ramps from here
  softPityRamp: 0.06, // +6% per pull past (start-1)
  hardPity: 90, // guaranteed SSR
  costSingleCube: 160,
  costTenCube: 1600,
  costSingleCrystal: 1600,
  costTenCrystal: 16000,
} as const;

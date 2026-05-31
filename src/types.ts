// ============================================================================
// NEON CIPHER — Shared domain types (the contract between all workstreams)
// ============================================================================

export type Rarity = 'R' | 'SR' | 'SSR' | 'UR';

// 5 attributes — also the 5 puzzle tile types.
export type Attribute = 'FIRE' | 'BLOCK' | 'SPIKE' | 'SURGE' | 'REPAIR';

export type Role = 'DEALER' | 'TANK' | 'DEBUFFER' | 'SUPPORT' | 'HEALER' | 'SUMMONER';

// Instant effect fired the moment a ghost is summoned to the field.
export type SummonEffect =
  | 'nuke_all' // burst damage to every enemy on the field
  | 'nuke_lane' // heavy burst to enemies in the deployed lane
  | 'burn_lane' // apply burn DoT to the lane
  | 'vulnerable_lane' // mark lane enemies as vulnerable
  | 'chain' // chained damage to several enemies
  | 'heal_core_big'
  | 'heal_core_small'
  | 'heal_allies'
  | 'shield_all' // grant a damage-absorbing shield to all allies
  | 'none';

// ---------------------------------------------------------------------------
// Ghost definitions (static content) + owned instances (save state)
// ---------------------------------------------------------------------------

export interface GhostDef {
  id: string;
  name: string;
  codename: string; // e.g. "UNIT_09 · 레버넌트"
  rarity: Rarity;
  attribute: Attribute;
  role: Role;
  baseHp: number;
  baseAtk: number;
  atkInterval: number; // seconds between attacks
  cost: number; // attribute energy cost to summon
  cooldown: number; // seconds before re-summon
  skillName: string;
  skill: string; // skill summary
  passive: string;
  lore: string;
  summonEffect: SummonEffect; // instant effect on summon
  featured?: boolean; // pickup banner unit (UR / designated SSR)
}

export interface OwnedGhost {
  id: string;
  level: number;
  stars: number; // awakening level (1..6)
  dupes: number; // total copies collected
}

// ---------------------------------------------------------------------------
// Currencies / gacha save state
// ---------------------------------------------------------------------------

export interface Currencies {
  crystal: number; // free (battle rewards)
  cube: number; // premium (test top-up button)
  ticketSingle: number;
  ticketTen: number;
}

export interface GachaState {
  pity: number; // pulls since last SSR
  guaranteed: boolean; // next SSR is guaranteed featured (lost 50:50)
  totalPulls: number;
}

// ---------------------------------------------------------------------------
// Battle types
// ---------------------------------------------------------------------------

export type EnemyKind = 'NORMAL' | 'RUSH' | 'HEAVY' | 'BOSS';

export interface EnemySpawn {
  kind: EnemyKind;
  lane: number; // 0..2
  at: number; // seconds into the wave when it spawns
}

export interface WaveDef {
  enemies: EnemySpawn[];
}

export interface StageDef {
  id: string;
  index: number;
  name: string;
  subtitle: string;
  coreHp: number;
  waves: WaveDef[];
  rewardCrystal: number;
  rewardExp: number;
  recommendedPower: number;
}

export type BattleResult = {
  victory: boolean;
  coreHpRemaining: number;
  coreHpMax: number;
  timeSec: number;
  maxCombo: number;
  stars: number; // 0..3
};

// ---------------------------------------------------------------------------
// Settings + full persisted save
// ---------------------------------------------------------------------------

export interface Settings {
  muted: boolean;
  reducedFx: boolean;
}

export interface SaveState {
  version: number;
  ownedGhosts: Record<string, OwnedGhost>;
  currencies: Currencies;
  gacha: GachaState;
  clearedStages: string[];
  deck: (string | null)[]; // up to 5 ghost ids
  settings: Settings;
  endlessBest: number; // best wave reached in DEEP DIVE
  lastDailyClaim: string; // date string of last claimed daily reward
  loginStreak: number; // consecutive days claimed (1..7)
  claimedAchievements: string[]; // ids of claimed achievement rewards
}

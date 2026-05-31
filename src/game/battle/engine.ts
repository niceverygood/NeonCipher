// ============================================================================
// Battle engine — framework-agnostic simulation. React reads state each frame
// and renders; all mutation happens here via step(dt) and input methods.
// ============================================================================

import type { Attribute, EnemyKind, Role, StageDef } from '@/types';
import { ATTR_ORDER, COMBO, ENEMY, FIELD, GRID, OVERCLOCK } from '@/data/balance';
import {
  type Cell,
  type Rng,
  createBoard,
  energyFromStep,
  resolveAll,
  swapMakesMatch,
  swapped,
} from './grid';

export interface DeckUnitDef {
  slot: number;
  ghostId: string;
  name: string;
  attribute: Attribute;
  role: Role;
  rarity: string;
  hp: number;
  atk: number;
  atkInterval: number;
  cost: number;
  cooldown: number;
  color: string; // render color (attribute neon)
}

export interface Enemy {
  id: number;
  kind: EnemyKind;
  lane: number;
  pos: number; // 0 (top) .. 1 (core)
  hp: number;
  maxHp: number;
  atkTimer: number;
}

export interface Unit {
  id: number;
  slot: number;
  ghostId: string;
  lane: number;
  pos: number; // fixed defensive line position
  hp: number;
  maxHp: number;
  atk: number;
  atkInterval: number;
  atkTimer: number;
  mode: 'attack' | 'healCore' | 'healAlly';
  color: string;
  attribute: Attribute;
}

export interface FxEvent {
  type: 'hit' | 'core' | 'summon' | 'death' | 'heal';
  lane: number;
  pos: number;
  color: string;
  ttl: number;
  maxTtl: number;
  text?: string;
}

export type BattleStatus = 'playing' | 'won' | 'lost';

const BLOCK_LINE = 0.8; // where units hold the line
const UNIT_POS = 0.86;
const ENEMY_ATK_INTERVAL = 1.0;

function roleMode(role: Role): Unit['mode'] {
  if (role === 'HEALER') return 'healAlly';
  if (role === 'SUPPORT') return 'healCore';
  return 'attack';
}

export class BattleEngine {
  readonly stage: StageDef;
  private deck: DeckUnitDef[];
  private rng: Rng;

  grid: Cell[];
  gridVersion = 0;
  energy: Record<Attribute, number>;
  enemies: Enemy[] = [];
  units: Unit[] = [];
  fx: FxEvent[] = [];

  coreHp: number;
  coreHpMax: number;

  combo = 0;
  comboTimer = 0;
  maxCombo = 0;
  overclock = 0; // 0..100 gauge
  overclockActive = 0; // seconds remaining

  waveIndex = 0;
  waveClock = 0;
  private spawnCursor = 0;
  private enemyIdSeq = 1;
  private unitIdSeq = 1;
  cooldowns: number[]; // per deck slot, seconds remaining

  status: BattleStatus = 'playing';
  timeSec = 0;

  constructor(stage: StageDef, deck: DeckUnitDef[], rng: Rng = Math.random) {
    this.stage = stage;
    this.deck = deck;
    this.rng = rng;
    this.coreHp = stage.coreHp;
    this.coreHpMax = stage.coreHp;
    this.grid = createBoard(rng);
    this.cooldowns = deck.map(() => 0);
    this.energy = ATTR_ORDER.reduce(
      (acc, a) => {
        acc[a] = 30; // small starting energy so the player can act immediately
        return acc;
      },
      {} as Record<Attribute, number>,
    );
  }

  getDeck(): DeckUnitDef[] {
    return this.deck;
  }

  // ---- Player input ------------------------------------------------------

  /** Attempt a swap. Returns true if a match resolved. */
  trySwap(a: number, b: number): boolean {
    if (this.status !== 'playing') return false;
    if (!swapMakesMatch(this.grid, a, b)) return false;
    const board = swapped(this.grid, a, b);
    const { grid: finalGrid, steps } = resolveAll(board, this.rng);
    this.grid = finalGrid;
    this.gridVersion++;

    steps.forEach((step, depth) => {
      const gained = energyFromStep(step, depth);
      for (const attr of Object.keys(gained) as Attribute[]) {
        this.energy[attr] = Math.min(GRID.energyCap, this.energy[attr] + (gained[attr] ?? 0));
      }
      this.combo++;
      this.comboTimer = COMBO.windowSec;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.overclock = Math.min(COMBO.overclockMax, this.overclock + COMBO.overclockPerCombo);
    });

    if (this.overclock >= COMBO.overclockMax && this.overclockActive <= 0) {
      this.activateOverclock();
    }
    return true;
  }

  private activateOverclock(): void {
    this.overclockActive = OVERCLOCK.durationSec;
    this.overclock = 0;
    this.fx.push({
      type: 'summon',
      lane: 1,
      pos: 0.5,
      color: 'var(--cyan)',
      ttl: 0.8,
      maxTtl: 0.8,
      text: 'OVERCLOCK',
    });
  }

  /** Deploy the ghost in deck slot to a lane (auto-picks the worst lane if omitted). */
  deploy(slot: number, lane?: number): boolean {
    if (this.status !== 'playing') return false;
    const def = this.deck[slot];
    if (!def) return false;
    if (this.cooldowns[slot] > 0) return false;
    if (this.energy[def.attribute] < def.cost) return false;

    const targetLane = lane ?? this.mostThreatenedLane();
    this.energy[def.attribute] -= def.cost;
    this.cooldowns[slot] = def.cooldown;
    this.units.push({
      id: this.unitIdSeq++,
      slot,
      ghostId: def.ghostId,
      lane: targetLane,
      pos: UNIT_POS,
      hp: def.hp,
      maxHp: def.hp,
      atk: def.atk,
      atkInterval: def.atkInterval,
      atkTimer: def.atkInterval * 0.5,
      mode: roleMode(def.role),
      color: def.color,
      attribute: def.attribute,
    });
    this.fx.push({
      type: 'summon',
      lane: targetLane,
      pos: UNIT_POS,
      color: def.color,
      ttl: 0.6,
      maxTtl: 0.6,
    });
    return true;
  }

  private mostThreatenedLane(): number {
    const worst = [0, 0, 0];
    for (const e of this.enemies) worst[e.lane] = Math.max(worst[e.lane], e.pos);
    let best = 0;
    for (let l = 1; l < FIELD.lanes; l++) if (worst[l] > worst[best]) best = l;
    return best;
  }

  // ---- Simulation --------------------------------------------------------

  step(dt: number): void {
    if (this.status !== 'playing') return;
    this.timeSec += dt;

    if (this.overclockActive > 0) {
      this.overclockActive = Math.max(0, this.overclockActive - dt);
    }
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
    for (let i = 0; i < this.cooldowns.length; i++) {
      if (this.cooldowns[i] > 0) this.cooldowns[i] = Math.max(0, this.cooldowns[i] - dt);
    }

    this.spawnEnemies(dt);
    this.moveAndFight(dt);
    this.ageFx(dt);
    this.checkEndState();
  }

  private spawnEnemies(dt: number): void {
    const wave = this.stage.waves[this.waveIndex];
    if (!wave) return;
    this.waveClock += dt;
    while (this.spawnCursor < wave.enemies.length && wave.enemies[this.spawnCursor].at <= this.waveClock) {
      const s = wave.enemies[this.spawnCursor];
      const base = ENEMY[s.kind];
      this.enemies.push({
        id: this.enemyIdSeq++,
        kind: s.kind,
        lane: s.lane,
        pos: 0,
        hp: base.hp,
        maxHp: base.hp,
        atkTimer: ENEMY_ATK_INTERVAL,
      });
      this.spawnCursor++;
    }
    // Advance wave when fully spawned and cleared.
    if (this.spawnCursor >= wave.enemies.length && this.enemies.length === 0) {
      if (this.waveIndex < this.stage.waves.length - 1) {
        this.waveIndex++;
        this.waveClock = 0;
        this.spawnCursor = 0;
      }
    }
  }

  private slowFactor(): number {
    return this.overclockActive > 0 ? OVERCLOCK.enemySlow : 1;
  }
  private dmgMult(): number {
    return this.overclockActive > 0 ? OVERCLOCK.allyDamageMult : 1;
  }

  private moveAndFight(dt: number): void {
    const slow = this.slowFactor();

    // Move enemies; block at the unit line where a living unit holds.
    for (const e of this.enemies) {
      const laneHasUnit = this.units.some((u) => u.lane === e.lane && u.hp > 0);
      const speed = ENEMY[e.kind].speed * slow;
      const nextPos = e.pos + speed * dt;
      if (laneHasUnit && nextPos >= BLOCK_LINE) {
        e.pos = BLOCK_LINE;
        // engage: attack the front unit
        e.atkTimer -= dt;
        if (e.atkTimer <= 0) {
          e.atkTimer = ENEMY_ATK_INTERVAL;
          const front = this.frontUnit(e.lane);
          if (front) {
            front.hp -= ENEMY[e.kind].damage;
            this.fx.push({ type: 'hit', lane: e.lane, pos: UNIT_POS, color: 'var(--mag)', ttl: 0.3, maxTtl: 0.3 });
          }
        }
      } else {
        e.pos = nextPos;
        if (e.pos >= 1) {
          this.coreHp = Math.max(0, this.coreHp - ENEMY[e.kind].damage);
          this.fx.push({ type: 'core', lane: e.lane, pos: 1, color: 'var(--mag)', ttl: 0.5, maxTtl: 0.5, text: `-${ENEMY[e.kind].damage}` });
          e.hp = 0; // mark removed
        }
      }
    }

    // Units act.
    for (const u of this.units) {
      if (u.hp <= 0) continue;
      u.atkTimer -= dt;
      if (u.atkTimer > 0) continue;
      u.atkTimer = u.atkInterval;
      if (u.mode === 'attack') {
        const target = this.frontEnemy(u.lane);
        if (target) {
          const dmg = u.atk * this.dmgMult();
          target.hp -= dmg;
          this.fx.push({ type: 'hit', lane: u.lane, pos: target.pos, color: u.color, ttl: 0.3, maxTtl: 0.3, text: `${Math.round(dmg)}` });
        }
      } else if (u.mode === 'healCore') {
        const heal = Math.round(u.atk * 2.5);
        this.coreHp = Math.min(this.coreHpMax, this.coreHp + heal);
        this.fx.push({ type: 'heal', lane: u.lane, pos: 1, color: u.color, ttl: 0.5, maxTtl: 0.5, text: `+${heal}` });
      } else {
        // healAlly: heal lowest-hp wounded ally
        let lowest: Unit | null = null;
        for (const a of this.units) {
          if (a.hp > 0 && a.hp < a.maxHp && (!lowest || a.hp / a.maxHp < lowest.hp / lowest.maxHp)) lowest = a;
        }
        if (lowest) {
          const heal = Math.round(u.atk * 3);
          lowest.hp = Math.min(lowest.maxHp, lowest.hp + heal);
          this.fx.push({ type: 'heal', lane: lowest.lane, pos: UNIT_POS, color: u.color, ttl: 0.5, maxTtl: 0.5, text: `+${heal}` });
        }
      }
    }

    // Remove dead enemies (award nothing here; rewards computed at end) and dead units.
    this.enemies = this.enemies.filter((e) => {
      if (e.hp <= 0) {
        if (e.pos < 1) this.fx.push({ type: 'death', lane: e.lane, pos: e.pos, color: 'var(--spike)', ttl: 0.4, maxTtl: 0.4 });
        return false;
      }
      return true;
    });
    this.units = this.units.filter((u) => u.hp > 0);
  }

  private frontEnemy(lane: number): Enemy | null {
    let best: Enemy | null = null;
    for (const e of this.enemies) {
      if (e.lane === lane && e.hp > 0 && (!best || e.pos > best.pos)) best = e;
    }
    return best;
  }
  private frontUnit(lane: number): Unit | null {
    for (const u of this.units) if (u.lane === lane && u.hp > 0) return u;
    return null;
  }

  private ageFx(dt: number): void {
    if (this.fx.length === 0) return;
    for (const f of this.fx) f.ttl -= dt;
    this.fx = this.fx.filter((f) => f.ttl > 0);
  }

  private checkEndState(): void {
    if (this.coreHp <= 0) {
      this.status = 'lost';
      return;
    }
    const lastWave = this.waveIndex >= this.stage.waves.length - 1;
    const wave = this.stage.waves[this.waveIndex];
    const fullySpawned = wave && this.spawnCursor >= wave.enemies.length;
    if (lastWave && fullySpawned && this.enemies.length === 0) {
      this.status = 'won';
    }
  }

  totalWaves(): number {
    return this.stage.waves.length;
  }
}

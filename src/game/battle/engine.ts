// ============================================================================
// Battle engine — framework-agnostic simulation. React reads state each frame
// and renders; all mutation happens here via step(dt) and input methods.
// ============================================================================

import type { Attribute, EnemyKind, Role, StageDef, SummonEffect, WaveDef } from '@/types';
import { ATTR_ORDER, COMBO, ENEMY, FIELD, GRID, OVERCLOCK, STATUS } from '@/data/balance';
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
  summonEffect: SummonEffect;
}

export interface Enemy {
  id: number;
  kind: EnemyKind;
  lane: number;
  pos: number; // 0 (top) .. 1 (core)
  hp: number;
  maxHp: number;
  atkTimer: number;
  burn?: { dps: number; ttl: number };
  vulnerableTtl: number; // >0 means taking extra damage
}

export interface Unit {
  id: number;
  slot: number;
  ghostId: string;
  lane: number;
  pos: number; // fixed defensive line position
  hp: number;
  maxHp: number;
  shield: number;
  atk: number;
  atkInterval: number;
  atkTimer: number;
  mode: 'attack' | 'healCore' | 'healAlly';
  color: string;
  attribute: Attribute;
}

export interface FxEvent {
  type: 'hit' | 'core' | 'summon' | 'death' | 'heal' | 'skill';
  lane: number;
  pos: number;
  color: string;
  ttl: number;
  maxTtl: number;
  text?: string;
}

export interface Particle {
  x: number; // normalized 0..1 across field width
  y: number; // normalized 0..1 down field height
  vx: number;
  vy: number;
  ttl: number;
  maxTtl: number;
  color: string;
  size: number;
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

export interface SynergyMods {
  atkMult: number;
  hpMult: number;
  coreMult: number;
  energyBonus: number;
}

export interface EngineOptions {
  endless?: boolean;
  endlessGen?: (waveIndex: number) => WaveDef;
  synergy?: SynergyMods;
}

const NO_SYNERGY: SynergyMods = { atkMult: 1, hpMult: 1, coreMult: 1, energyBonus: 0 };

export class BattleEngine {
  readonly stage: StageDef;
  private deck: DeckUnitDef[];
  private rng: Rng;
  private endless: boolean;
  private endlessGen?: (waveIndex: number) => WaveDef;
  private waves: WaveDef[];
  private synergy: SynergyMods;

  grid: Cell[];
  gridVersion = 0;
  energy: Record<Attribute, number>;
  enemies: Enemy[] = [];
  units: Unit[] = [];
  fx: FxEvent[] = [];
  particles: Particle[] = [];

  coreHp: number;
  coreHpMax: number;

  combo = 0;
  comboTimer = 0;
  maxCombo = 0;
  overclock = 0; // 0..100 gauge
  overclockActive = 0; // seconds remaining
  shake = 0; // 0..1, decays — read by renderer for screen shake

  waveIndex = 0;
  waveClock = 0;
  private spawnCursor = 0;
  private enemyIdSeq = 1;
  private unitIdSeq = 1;
  cooldowns: number[]; // per deck slot, seconds remaining
  lastSkill: { name: string; color: string; ttl: number } | null = null;

  status: BattleStatus = 'playing';
  timeSec = 0;
  enemiesKilled = 0;

  constructor(stage: StageDef, deck: DeckUnitDef[], rng: Rng = Math.random, opts: EngineOptions = {}) {
    this.stage = stage;
    this.deck = deck;
    this.rng = rng;
    this.endless = opts.endless ?? false;
    this.endlessGen = opts.endlessGen;
    this.synergy = opts.synergy ?? NO_SYNERGY;
    this.waves = stage.waves.slice();
    // Synergy: support roles raise the core's max HP.
    this.coreHpMax = Math.round(stage.coreHp * this.synergy.coreMult);
    this.coreHp = this.coreHpMax;
    this.grid = createBoard(rng);
    this.cooldowns = deck.map(() => 0);
    const startEnergy = 30 + this.synergy.energyBonus;
    this.energy = ATTR_ORDER.reduce(
      (acc, a) => {
        acc[a] = Math.min(GRID.energyCap, startEnergy); // start energy so the player can act immediately
        return acc;
      },
      {} as Record<Attribute, number>,
    );
  }

  getDeck(): DeckUnitDef[] {
    return this.deck;
  }

  // ---- Player input ------------------------------------------------------

  /** Attempt a swap. Returns the cascade depth (>0) if a match resolved, else 0. */
  trySwap(a: number, b: number): number {
    if (this.status !== 'playing') return 0;
    if (!swapMakesMatch(this.grid, a, b)) return 0;
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

    if (this.combo >= 4) this.shake = Math.min(1, this.shake + 0.12);

    if (this.overclock >= COMBO.overclockMax && this.overclockActive <= 0) {
      this.activateOverclock();
    }
    return steps.length;
  }

  private activateOverclock(): void {
    this.overclockActive = OVERCLOCK.durationSec;
    this.overclock = 0;
    this.shake = 1;
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
    const synHp = Math.round(def.hp * this.synergy.hpMult);
    const synAtk = Math.round(def.atk * this.synergy.atkMult);
    const unit: Unit = {
      id: this.unitIdSeq++,
      slot,
      ghostId: def.ghostId,
      lane: targetLane,
      pos: UNIT_POS,
      hp: synHp,
      maxHp: synHp,
      shield: 0,
      atk: synAtk,
      atkInterval: def.atkInterval,
      atkTimer: def.atkInterval * 0.5,
      mode: roleMode(def.role),
      color: def.color,
      attribute: def.attribute,
    };
    this.units.push(unit);
    this.fx.push({ type: 'summon', lane: targetLane, pos: UNIT_POS, color: def.color, ttl: 0.6, maxTtl: 0.6 });
    this.spawnParticles((targetLane + 0.5) / FIELD.lanes, UNIT_POS, def.color, 10);
    this.applySummonSkill(def, targetLane, unit);
    return true;
  }

  // ---- Summon skills -----------------------------------------------------

  private applySummonSkill(def: DeckUnitDef, lane: number, self: Unit): void {
    const dmgMult = this.dmgMult();
    const flash = (name: string) => {
      this.lastSkill = { name, color: def.color, ttl: 1.2 };
      this.fx.push({ type: 'skill', lane, pos: 0.4, color: def.color, ttl: 0.7, maxTtl: 0.7, text: name });
    };
    switch (def.summonEffect) {
      case 'nuke_all': {
        flash(def.name);
        const dmg = self.atk * 2.4 * dmgMult;
        for (const e of this.enemies) this.damageEnemy(e, dmg);
        this.shake = 1;
        for (let l = 0; l < FIELD.lanes; l++) this.spawnParticles((l + 0.5) / FIELD.lanes, 0.4, def.color, 8);
        break;
      }
      case 'nuke_lane': {
        flash(def.name);
        const dmg = self.atk * 3.4 * dmgMult;
        for (const e of this.enemies) if (e.lane === lane) this.damageEnemy(e, dmg);
        this.shake = Math.min(1, this.shake + 0.6);
        this.spawnParticles((lane + 0.5) / FIELD.lanes, 0.5, def.color, 14);
        break;
      }
      case 'chain': {
        flash(def.name);
        // hit up to 4 enemies (any lane), front-first
        const targets = [...this.enemies].sort((x, y) => y.pos - x.pos).slice(0, 4);
        targets.forEach((e, i) => this.damageEnemy(e, self.atk * (2 - i * 0.3) * dmgMult));
        break;
      }
      case 'burn_lane': {
        flash(def.name);
        for (const e of this.enemies)
          if (e.lane === lane) e.burn = { dps: self.atk * STATUS.burnDps, ttl: STATUS.burnDuration };
        break;
      }
      case 'vulnerable_lane': {
        flash(def.name);
        for (const e of this.enemies) if (e.lane === lane) e.vulnerableTtl = STATUS.vulnerableDuration;
        break;
      }
      case 'heal_core_big': {
        flash(def.name);
        const heal = Math.round(self.maxHp * 0.6 + self.atk * 6);
        this.coreHp = Math.min(this.coreHpMax, this.coreHp + heal);
        this.fx.push({ type: 'heal', lane: 1, pos: 1, color: def.color, ttl: 0.7, maxTtl: 0.7, text: `+${heal}` });
        break;
      }
      case 'heal_core_small': {
        const heal = Math.round(self.atk * 8 + 30);
        this.coreHp = Math.min(this.coreHpMax, this.coreHp + heal);
        this.fx.push({ type: 'heal', lane: 1, pos: 1, color: def.color, ttl: 0.6, maxTtl: 0.6, text: `+${heal}` });
        break;
      }
      case 'heal_allies': {
        flash(def.name);
        for (const u of this.units) u.hp = Math.min(u.maxHp, u.hp + Math.round(u.maxHp * 0.4));
        break;
      }
      case 'shield_all': {
        flash(def.name);
        for (const u of this.units) u.shield += Math.round(self.atk * 6 + self.maxHp * 0.3);
        break;
      }
      case 'none':
      default:
        break;
    }
  }

  private mostThreatenedLane(): number {
    const worst = [0, 0, 0];
    for (const e of this.enemies) worst[e.lane] = Math.max(worst[e.lane], e.pos);
    let best = 0;
    for (let l = 1; l < FIELD.lanes; l++) if (worst[l] > worst[best]) best = l;
    return best;
  }

  private damageEnemy(e: Enemy, dmg: number): void {
    const mult = e.vulnerableTtl > 0 ? STATUS.vulnerableMult : 1;
    e.hp -= dmg * mult;
  }

  // ---- Simulation --------------------------------------------------------

  step(dt: number): void {
    if (this.status !== 'playing') return;
    this.timeSec += dt;

    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 2.6);
    if (this.lastSkill) {
      this.lastSkill.ttl -= dt;
      if (this.lastSkill.ttl <= 0) this.lastSkill = null;
    }
    if (this.overclockActive > 0) this.overclockActive = Math.max(0, this.overclockActive - dt);
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
    for (let i = 0; i < this.cooldowns.length; i++) {
      if (this.cooldowns[i] > 0) this.cooldowns[i] = Math.max(0, this.cooldowns[i] - dt);
    }

    this.spawnEnemies(dt);
    this.applyStatuses(dt);
    this.moveAndFight(dt);
    this.ageFx(dt);
    this.stepParticles(dt);
    this.checkEndState();
  }

  private spawnEnemies(dt: number): void {
    let wave = this.waves[this.waveIndex];
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
        vulnerableTtl: 0,
      });
      if (s.kind === 'BOSS') this.shake = 1;
      this.spawnCursor++;
    }
    // Advance wave when fully spawned and cleared.
    if (this.spawnCursor >= wave.enemies.length && this.enemies.length === 0) {
      if (this.waveIndex < this.waves.length - 1) {
        this.waveIndex++;
        this.waveClock = 0;
        this.spawnCursor = 0;
      } else if (this.endless && this.endlessGen) {
        // Endless: append a fresh, tougher wave and keep going.
        this.waves.push(this.endlessGen(this.waves.length));
        this.waveIndex++;
        this.waveClock = 0;
        this.spawnCursor = 0;
      }
    }
    wave = this.waves[this.waveIndex];
  }

  private slowFactor(): number {
    return this.overclockActive > 0 ? OVERCLOCK.enemySlow : 1;
  }
  private dmgMult(): number {
    return this.overclockActive > 0 ? OVERCLOCK.allyDamageMult : 1;
  }

  private applyStatuses(dt: number): void {
    for (const e of this.enemies) {
      if (e.vulnerableTtl > 0) e.vulnerableTtl = Math.max(0, e.vulnerableTtl - dt);
      if (e.burn) {
        e.hp -= e.burn.dps * dt;
        e.burn.ttl -= dt;
        if (e.burn.ttl <= 0) e.burn = undefined;
      }
    }
  }

  private moveAndFight(dt: number): void {
    const slow = this.slowFactor();

    for (const e of this.enemies) {
      const laneHasUnit = this.units.some((u) => u.lane === e.lane && u.hp > 0);
      const speed = ENEMY[e.kind].speed * slow;
      const nextPos = e.pos + speed * dt;
      if (laneHasUnit && nextPos >= BLOCK_LINE) {
        e.pos = BLOCK_LINE;
        e.atkTimer -= dt;
        if (e.atkTimer <= 0) {
          e.atkTimer = ENEMY_ATK_INTERVAL;
          const front = this.frontUnit(e.lane);
          if (front) {
            this.damageUnit(front, ENEMY[e.kind].damage);
            this.fx.push({ type: 'hit', lane: e.lane, pos: UNIT_POS, color: 'var(--mag)', ttl: 0.3, maxTtl: 0.3 });
          }
        }
      } else {
        e.pos = nextPos;
        if (e.pos >= 1) {
          this.coreHp = Math.max(0, this.coreHp - ENEMY[e.kind].damage);
          this.shake = Math.min(1, this.shake + (e.kind === 'BOSS' ? 1 : 0.5));
          this.fx.push({ type: 'core', lane: e.lane, pos: 1, color: 'var(--mag)', ttl: 0.5, maxTtl: 0.5, text: `-${ENEMY[e.kind].damage}` });
          e.hp = 0;
        }
      }
    }

    for (const u of this.units) {
      if (u.hp <= 0) continue;
      u.atkTimer -= dt;
      if (u.atkTimer > 0) continue;
      u.atkTimer = u.atkInterval;
      if (u.mode === 'attack') {
        const target = this.frontEnemy(u.lane);
        if (target) {
          const dmg = u.atk * this.dmgMult();
          this.damageEnemy(target, dmg);
          this.fx.push({ type: 'hit', lane: u.lane, pos: target.pos, color: u.color, ttl: 0.3, maxTtl: 0.3, text: `${Math.round(dmg)}` });
        }
      } else if (u.mode === 'healCore') {
        const heal = Math.round(u.atk * 2.5);
        this.coreHp = Math.min(this.coreHpMax, this.coreHp + heal);
        this.fx.push({ type: 'heal', lane: u.lane, pos: 1, color: u.color, ttl: 0.5, maxTtl: 0.5, text: `+${heal}` });
      } else {
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

    this.enemies = this.enemies.filter((e) => {
      if (e.hp <= 0) {
        if (e.pos < 1) {
          this.enemiesKilled++;
          this.fx.push({ type: 'death', lane: e.lane, pos: e.pos, color: 'var(--spike)', ttl: 0.4, maxTtl: 0.4 });
          this.spawnParticles((e.lane + 0.5) / FIELD.lanes, e.pos, e.kind === 'BOSS' ? 'var(--surge)' : 'var(--spike)', e.kind === 'BOSS' ? 24 : 7);
        }
        return false;
      }
      return true;
    });
    this.units = this.units.filter((u) => u.hp > 0);
  }

  private damageUnit(u: Unit, dmg: number): void {
    if (u.shield > 0) {
      const absorbed = Math.min(u.shield, dmg);
      u.shield -= absorbed;
      dmg -= absorbed;
    }
    u.hp -= dmg;
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

  // ---- particles ---------------------------------------------------------
  private spawnParticles(nx: number, ny: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const ang = this.rng() * Math.PI * 2;
      const spd = 0.15 + this.rng() * 0.5;
      this.particles.push({
        x: nx,
        y: ny,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 0.1,
        ttl: 0.4 + this.rng() * 0.4,
        maxTtl: 0.8,
        color,
        size: 1.5 + this.rng() * 2.5,
      });
    }
    if (this.particles.length > 240) this.particles.splice(0, this.particles.length - 240);
  }

  private stepParticles(dt: number): void {
    if (this.particles.length === 0) return;
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.6 * dt; // gravity
      p.ttl -= dt;
    }
    this.particles = this.particles.filter((p) => p.ttl > 0);
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
    if (this.endless) return; // endless only ends on defeat
    const lastWave = this.waveIndex >= this.waves.length - 1;
    const wave = this.waves[this.waveIndex];
    const fullySpawned = wave && this.spawnCursor >= wave.enemies.length;
    if (lastWave && fullySpawned && this.enemies.length === 0) {
      this.status = 'won';
    }
  }

  totalWaves(): number {
    return this.endless ? Infinity : this.waves.length;
  }

  /** Boss HP for the HUD bar, if a boss is currently alive. */
  activeBoss(): Enemy | null {
    return this.enemies.find((e) => e.kind === 'BOSS' && e.hp > 0) ?? null;
  }
}

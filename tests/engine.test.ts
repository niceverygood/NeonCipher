import { describe, it, expect } from 'vitest';
import { BattleEngine, type DeckUnitDef } from '@/game/battle/engine';
import { GHOST_BY_ID } from '@/data/ghosts';
import { STAGES } from '@/data/waves';
import { ATTR_VAR, GRID } from '@/data/balance';
import { areAdjacent } from '@/game/battle/grid';
import { deriveStats } from '@/game/progression/stats';

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

function buildDeck(ids: string[]): DeckUnitDef[] {
  return ids.map((id, slot) => {
    const def = GHOST_BY_ID[id];
    const stats = deriveStats(def, { id, level: 5, stars: 1, dupes: 0 });
    return {
      slot,
      ghostId: id,
      name: def.name,
      attribute: def.attribute,
      role: def.role,
      rarity: def.rarity,
      hp: stats.hp,
      atk: stats.atk,
      atkInterval: def.atkInterval,
      cost: def.cost,
      cooldown: def.cooldown,
      color: ATTR_VAR[def.attribute],
    };
  });
}

/** Find any adjacent swap that produces a match. */
function findValidSwap(engine: BattleEngine): [number, number] | null {
  const size = GRID.rows * GRID.cols;
  for (let i = 0; i < size; i++) {
    for (const j of [i + 1, i + GRID.cols]) {
      if (j < size && areAdjacent(i, j)) {
        // Use the public trySwap dry-run via swapMakesMatch through engine grid
        // (replicated check to avoid mutating).
        const a = engine.grid.slice();
        const t = a[i];
        a[i] = a[j];
        a[j] = t;
        // local match check
        if (hasMatch(a)) return [i, j];
      }
    }
  }
  return null;
}

function hasMatch(g: string[]): boolean {
  for (let r = 0; r < GRID.rows; r++) {
    for (let c = 0; c < GRID.cols - 2; c++) {
      const k = r * GRID.cols + c;
      if (g[k] === g[k + 1] && g[k] === g[k + 2]) return true;
    }
  }
  for (let c = 0; c < GRID.cols; c++) {
    for (let r = 0; r < GRID.rows - 2; r++) {
      const k = r * GRID.cols + c;
      if (g[k] === g[k + GRID.cols] && g[k] === g[k + 2 * GRID.cols]) return true;
    }
  }
  return false;
}

describe('BattleEngine integration', () => {
  it('auto-plays stage 1 to a terminal state without crashing', () => {
    const engine = new BattleEngine(STAGES[0], buildDeck(['g_warden', 'g_ember', 'g_jolt', 'g_medic', 'g_patch']), rngFrom(2024));
    const FIXED = 1 / 60;
    let iterations = 0;
    const maxIter = 60 * 60 * 5; // 5 simulated minutes ceiling

    while (engine.status === 'playing' && iterations < maxIter) {
      // Periodically act: deploy affordable units + perform a matching swap.
      if (iterations % 30 === 0) {
        for (let s = 0; s < engine.getDeck().length; s++) engine.deploy(s);
        const swap = findValidSwap(engine);
        if (swap) engine.trySwap(swap[0], swap[1]);
      }
      engine.step(FIXED);
      iterations++;
    }

    expect(engine.status).not.toBe('playing');
    expect(iterations).toBeLessThan(maxIter);
    expect(engine.coreHp).toBeLessThanOrEqual(engine.coreHpMax);
    expect(engine.maxCombo).toBeGreaterThanOrEqual(0);
  });

  it('a strong over-leveled squad clears stage 1 (victory reachable)', () => {
    const deck = buildDeck(['g_revenant', 'g_nova', 'g_bulwark', 'g_glitch', 'g_halo']).map((d) => ({
      ...d,
      hp: d.hp * 4,
      atk: d.atk * 4,
    }));
    const engine = new BattleEngine(STAGES[0], deck, rngFrom(7));
    const FIXED = 1 / 60;
    let it = 0;
    while (engine.status === 'playing' && it < 60 * 60 * 5) {
      if (it % 20 === 0) {
        for (let s = 0; s < engine.getDeck().length; s++) engine.deploy(s);
        const swap = findValidSwap(engine);
        if (swap) engine.trySwap(swap[0], swap[1]);
      }
      engine.step(FIXED);
      it++;
    }
    expect(engine.status).toBe('won');
  });
});

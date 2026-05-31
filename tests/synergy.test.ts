import { describe, it, expect } from 'vitest';
import { computeSynergy } from '@/game/progression/synergy';
import { GHOSTS } from '@/data/ghosts';
import type { Attribute, Role } from '@/types';

// Pick ghost ids matching a predicate, for building synthetic decks.
function idsWhere(pred: (g: { attribute: Attribute; role: Role }) => boolean, n: number): string[] {
  return GHOSTS.filter(pred).slice(0, n).map((g) => g.id);
}

describe('computeSynergy', () => {
  it('empty deck has no effects and neutral multipliers', () => {
    const s = computeSynergy([null, null, null, null, null]);
    expect(s.effects).toHaveLength(0);
    expect(s.atkMult).toBe(1);
    expect(s.hpMult).toBe(1);
    expect(s.coreMult).toBe(1);
    expect(s.energyBonus).toBe(0);
  });

  it('two of one attribute grants resonance I (+10% atk)', () => {
    const fire = idsWhere((g) => g.attribute === 'FIRE', 2);
    expect(fire.length).toBe(2);
    const s = computeSynergy([...fire, null, null, null]);
    expect(s.atkMult).toBeGreaterThanOrEqual(1.1);
    expect(s.effects.some((e) => e.id.startsWith('res_FIRE'))).toBe(true);
  });

  it('a tank raises team HP', () => {
    const tank = idsWhere((g) => g.role === 'TANK', 1);
    const s = computeSynergy([...tank, null, null, null, null]);
    expect(s.hpMult).toBeGreaterThan(1);
    expect(s.effects.some((e) => e.id === 'role_tank')).toBe(true);
  });

  it('five distinct attributes grants the full-spectrum bonus', () => {
    const oneEach: string[] = [];
    const seen = new Set<Attribute>();
    for (const g of GHOSTS) {
      if (!seen.has(g.attribute)) {
        seen.add(g.attribute);
        oneEach.push(g.id);
      }
      if (oneEach.length === 5) break;
    }
    expect(oneEach.length).toBe(5);
    const s = computeSynergy(oneEach);
    expect(s.effects.some((e) => e.id === 'rainbow')).toBe(true);
    expect(s.atkMult).toBeGreaterThan(1);
    expect(s.hpMult).toBeGreaterThan(1);
  });

  it('ignores unknown ids safely', () => {
    const s = computeSynergy(['nope', 'also_nope', null]);
    expect(s.effects).toHaveLength(0);
  });
});

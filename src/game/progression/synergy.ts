// ============================================================================
// Deck synergies — pure logic shared by the Team screen (display) and the
// battle engine (actual combat buffs). Build choices now matter mechanically.
// ============================================================================

import type { Attribute, Role } from '@/types';
import { GHOST_BY_ID } from '@/data/ghosts';
import { ATTR_ORDER, ATTR_LABEL } from '@/data/balance';

export interface SynergyEffect {
  id: string;
  label: string; // short name, e.g. "화력 공명 II"
  desc: string; // what it does
  color: string;
}

export interface SynergyResult {
  effects: SynergyEffect[];
  atkMult: number; // multiplier applied to every deployed unit's ATK
  hpMult: number; // multiplier applied to every deployed unit's HP
  coreMult: number; // multiplier applied to starting/max core HP
  energyBonus: number; // flat extra starting energy per attribute
}

const ATTR_COLOR: Record<Attribute, string> = {
  FIRE: 'var(--fire)',
  BLOCK: 'var(--block)',
  SPIKE: 'var(--spike)',
  SURGE: 'var(--surge)',
  REPAIR: 'var(--repair)',
};

/**
 * Compute the active synergies for a deck (list of ghost ids, may contain
 * nulls / unknowns which are ignored). Deterministic and side-effect free.
 */
export function computeSynergy(deck: (string | null)[]): SynergyResult {
  const attrCount: Partial<Record<Attribute, number>> = {};
  const roleCount: Partial<Record<Role, number>> = {};
  const attrs = new Set<Attribute>();
  let members = 0;

  for (const id of deck) {
    if (!id) continue;
    const g = GHOST_BY_ID[id];
    if (!g) continue;
    members++;
    attrCount[g.attribute] = (attrCount[g.attribute] ?? 0) + 1;
    roleCount[g.role] = (roleCount[g.role] ?? 0) + 1;
    attrs.add(g.attribute);
  }

  const effects: SynergyEffect[] = [];
  let atkMult = 1;
  let hpMult = 1;
  let coreMult = 1;
  let energyBonus = 0;

  // --- Attribute resonance: 2 of a kind = tier I, 3+ = tier II ---
  for (const a of ATTR_ORDER) {
    const c = attrCount[a] ?? 0;
    if (c >= 3) {
      atkMult += 0.2;
      effects.push({
        id: `res_${a}_2`,
        label: `${ATTR_LABEL[a]} 공명 II`,
        desc: `${ATTR_LABEL[a]} 3기 — 전 아군 공격력 +20%`,
        color: ATTR_COLOR[a],
      });
    } else if (c === 2) {
      atkMult += 0.1;
      effects.push({
        id: `res_${a}_1`,
        label: `${ATTR_LABEL[a]} 공명 I`,
        desc: `${ATTR_LABEL[a]} 2기 — 전 아군 공격력 +10%`,
        color: ATTR_COLOR[a],
      });
    }
  }

  // --- Role synergies ---
  if ((roleCount.TANK ?? 0) >= 1) {
    hpMult += 0.12;
    effects.push({ id: 'role_tank', label: '전열 구축', desc: '탱커 보유 — 전 아군 체력 +12%', color: 'var(--block)' });
  }
  if ((roleCount.DEALER ?? 0) >= 2) {
    atkMult += 0.1;
    effects.push({ id: 'role_dealer', label: '화망 집중', desc: '딜러 2기+ — 전 아군 공격력 +10%', color: 'var(--fire)' });
  }
  if ((roleCount.HEALER ?? 0) + (roleCount.SUPPORT ?? 0) >= 1) {
    coreMult += 0.12;
    effects.push({ id: 'role_support', label: '복원 프로토콜', desc: '힐러/서포터 보유 — 코어 최대 HP +12%', color: 'var(--repair)' });
  }
  if ((roleCount.DEBUFFER ?? 0) >= 1) {
    atkMult += 0.06;
    effects.push({ id: 'role_debuff', label: '시스템 침투', desc: '디버퍼 보유 — 전 아군 공격력 +6%', color: 'var(--spike)' });
  }

  // --- Composition synergies ---
  if (attrs.size === 5) {
    atkMult += 0.15;
    hpMult += 0.15;
    effects.push({ id: 'rainbow', label: '풀 스펙트럼', desc: '5속성 완비 — 공격력·체력 +15%', color: 'var(--cyan)' });
  } else if (attrs.size === 1 && members >= 3) {
    energyBonus += 20;
    effects.push({ id: 'mono', label: '단일 채널', desc: '단일 속성 특화 — 시작 에너지 +20', color: ATTR_COLOR[[...attrs][0]] });
  }

  return {
    effects,
    atkMult: Math.round(atkMult * 100) / 100,
    hpMult: Math.round(hpMult * 100) / 100,
    coreMult: Math.round(coreMult * 100) / 100,
    energyBonus,
  };
}

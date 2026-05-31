// ============================================================================
// Stage + wave definitions. Each stage has 8 waves of increasing difficulty.
// Waves are generated deterministically from a difficulty curve so they are
// easy to tune, but the output is plain data consumed by the battle engine.
// ============================================================================

import type { EnemyKind, EnemySpawn, StageDef, WaveDef } from '@/types';

// Simple seeded RNG (mulberry32) so wave layouts are stable across reloads.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildWave(rng: () => number, difficulty: number, waveIndex: number): WaveDef {
  const enemies: EnemySpawn[] = [];
  // Enemy count scales with stage difficulty and wave index.
  const count = 3 + Math.floor(difficulty * 1.2) + Math.floor(waveIndex * 0.8);
  let t = 0.5;
  for (let i = 0; i < count; i++) {
    const roll = rng();
    let kind: EnemyKind = 'NORMAL';
    // Heavier waves get more rush + heavy units.
    const heavyChance = 0.08 + difficulty * 0.02 + waveIndex * 0.015;
    const rushChance = 0.18 + waveIndex * 0.02;
    if (roll < heavyChance) kind = 'HEAVY';
    else if (roll < heavyChance + rushChance) kind = 'RUSH';
    const lane = Math.floor(rng() * 3);
    enemies.push({ kind, lane, at: parseFloat(t.toFixed(2)) });
    // Spacing tightens as difficulty rises.
    t += 1.4 - Math.min(0.8, difficulty * 0.07) + rng() * 0.8;
  }
  return { enemies };
}

function buildStage(
  index: number,
  name: string,
  subtitle: string,
  coreHp: number,
  rewardCrystal: number,
  rewardExp: number,
  recommendedPower: number,
): StageDef {
  const rng = mulberry32(1000 + index * 97);
  const waves: WaveDef[] = [];
  for (let w = 0; w < 8; w++) {
    waves.push(buildWave(rng, index + 1, w));
  }
  // Final wave gets a BOSS that arrives after the regular spawns.
  const finalWave = waves[waves.length - 1];
  const lastAt = finalWave.enemies.reduce((m, e) => Math.max(m, e.at), 0);
  finalWave.enemies.push({ kind: 'BOSS', lane: 1, at: parseFloat((lastAt + 2).toFixed(2)) });
  return {
    id: `stage_${index + 1}`,
    index,
    name,
    subtitle,
    coreHp,
    waves,
    rewardCrystal,
    rewardExp,
    recommendedPower,
  };
}

export const STAGES: StageDef[] = [
  buildStage(0, 'SECTOR 01 // 슬럼 게이트', '버려진 변두리 네트워크의 첫 침입', 120, 600, 80, 0),
  buildStage(1, 'SECTOR 02 // 데이터 시장', '브로커들의 암거래 노드를 방어하라', 130, 800, 110, 200),
  buildStage(2, 'SECTOR 03 // 냉각 탑', 'ICE 데몬이 끓어오르는 서버팜', 140, 1000, 150, 420),
  buildStage(3, 'SECTOR 04 // 기업 방화벽', '거대 기업 코어로 향하는 관문', 150, 1300, 200, 700),
  buildStage(4, 'SECTOR 05 // 심층 코어', '도시의 의식이 잠든 최심부', 160, 1700, 260, 1050),
  buildStage(5, 'SECTOR 06 // 블랙 ICE', '군용 방어 데몬이 진을 친 사지', 175, 2200, 340, 1500),
  buildStage(6, 'SECTOR 07 // 제로 노드', '도시의 진짜 의식이 깨어나는 곳', 190, 2900, 440, 2100),
];

export const STAGE_BY_ID: Record<string, StageDef> = Object.fromEntries(
  STAGES.map((s) => [s.id, s]),
);

// Total enemies in a stage (used for progress display / star calc).
export function stageEnemyCount(stage: StageDef): number {
  return stage.waves.reduce((sum, w) => sum + w.enemies.length, 0);
}

// ---------------------------------------------------------------------------
// Endless "DEEP DIVE": one synthetic stage whose waves are generated on the
// fly by the engine. Difficulty climbs forever; score = waves survived.
// ---------------------------------------------------------------------------
const endlessRng = mulberry32(999983);

export function endlessWave(waveIndex: number): WaveDef {
  // Reuse the difficulty curve but keep ramping past the normal cap.
  const difficulty = 2 + waveIndex * 0.6;
  const wave = buildWave(endlessRng, difficulty, waveIndex);
  // Boss every 5th wave.
  if (waveIndex > 0 && waveIndex % 5 === 0) {
    const lastAt = wave.enemies.reduce((m, e) => Math.max(m, e.at), 0);
    wave.enemies.push({ kind: 'BOSS', lane: 1, at: parseFloat((lastAt + 1.5).toFixed(2)) });
  }
  return wave;
}

export const ENDLESS_STAGE: StageDef = {
  id: 'endless',
  index: 999,
  name: 'DEEP DIVE // 무한 침투',
  subtitle: '코어가 버티는 한 끝없이 밀려오는 ICE. 최고 도달 웨이브에 도전.',
  coreHp: 200,
  waves: [endlessWave(0)],
  rewardCrystal: 0,
  rewardExp: 0,
  recommendedPower: 600,
};

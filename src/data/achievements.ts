// ============================================================================
// Achievements — completion goals computed purely from existing save data
// (no extra event counters needed). Each grants a one-time reward.
// ============================================================================

import { GHOSTS } from '@/data/ghosts';

export interface AchvCtx {
  ownedCount: number; // distinct ghosts owned
  ssrOwned: number; // SSR or UR ghosts owned
  cleared: number; // sectors cleared
  endlessBest: number; // best DEEP DIVE wave
  totalPulls: number; // lifetime recruit pulls
}

export interface Reward {
  crystal: number;
  cube: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  icon: string;
  metric: keyof AchvCtx;
  goal: number;
  reward: Reward;
  accent: string;
}

const TOTAL_GHOSTS = GHOSTS.length;

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'col_5', title: '신참 넷러너', desc: '고스트 5종 수집', icon: '◈', metric: 'ownedCount', goal: 5, reward: { crystal: 600, cube: 150 }, accent: 'var(--cyan)' },
  { id: 'col_10', title: '수집가', desc: '고스트 10종 수집', icon: '◈', metric: 'ownedCount', goal: 10, reward: { crystal: 1200, cube: 300 }, accent: 'var(--cyan)' },
  { id: 'col_all', title: '완전한 도감', desc: `전 고스트 ${TOTAL_GHOSTS}종 수집`, icon: '★', metric: 'ownedCount', goal: TOTAL_GHOSTS, reward: { crystal: 3000, cube: 800 }, accent: 'var(--surge)' },
  { id: 'ssr_3', title: '오버클럭된 부대', desc: 'SSR 이상 3종 보유', icon: '✦', metric: 'ssrOwned', goal: 3, reward: { crystal: 1500, cube: 400 }, accent: 'var(--mag)' },
  { id: 'clear_1', title: '첫 침입', desc: '섹터 1개 클리어', icon: '▶', metric: 'cleared', goal: 1, reward: { crystal: 400, cube: 100 }, accent: 'var(--spike)' },
  { id: 'clear_3', title: '심층 진입', desc: '섹터 3개 클리어', icon: '▶', metric: 'cleared', goal: 3, reward: { crystal: 1000, cube: 250 }, accent: 'var(--spike)' },
  { id: 'clear_5', title: '코어 정복자', desc: '섹터 5개 클리어', icon: '⬢', metric: 'cleared', goal: 5, reward: { crystal: 2500, cube: 600 }, accent: 'var(--spike)' },
  { id: 'pull_10', title: '접속 시작', desc: '누적 10회 모집', icon: '❖', metric: 'totalPulls', goal: 10, reward: { crystal: 500, cube: 120 }, accent: 'var(--mag)' },
  { id: 'pull_50', title: '단골 의뢰인', desc: '누적 50회 모집', icon: '❖', metric: 'totalPulls', goal: 50, reward: { crystal: 1600, cube: 400 }, accent: 'var(--mag)' },
  { id: 'pull_100', title: '천장의 증인', desc: '누적 100회 모집', icon: '❖', metric: 'totalPulls', goal: 100, reward: { crystal: 3200, cube: 900 }, accent: 'var(--mag)' },
  { id: 'dive_10', title: '심해 잠수부', desc: '심층 침투 웨이브 10 도달', icon: '⌁', metric: 'endlessBest', goal: 10, reward: { crystal: 1400, cube: 350 }, accent: 'var(--repair)' },
  { id: 'dive_20', title: '코어의 심연', desc: '심층 침투 웨이브 20 도달', icon: '⌁', metric: 'endlessBest', goal: 20, reward: { crystal: 3000, cube: 800 }, accent: 'var(--repair)' },
];

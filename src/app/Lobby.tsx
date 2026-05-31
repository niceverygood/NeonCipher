import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen } from '@/ui/Screen';
import { CurrencyBar } from '@/ui/CurrencyBar';
import { GhostFigure, RARITY_COLOR, Modal } from '@/ui/primitives';
import { useGame, todayKey, achievementContext, type DailyReward } from '@/state/store';
import { GHOST_BY_ID } from '@/data/ghosts';
import { ATTR_VAR } from '@/data/balance';
import { deriveStats } from '@/game/progression/stats';
import { STAGES } from '@/data/waves';
import { ACHIEVEMENTS } from '@/data/achievements';
import { sfx } from '@/audio/sfx';
import { CityBackground } from '@/ui/CityBackground';
import type { SaveState } from '@/types';

const MENU = [
  { to: '/gacha', label: '가챠', en: 'RECRUIT', accent: 'var(--mag)' },
  { to: '/team', label: '편성', en: 'SQUAD', accent: 'var(--spike)' },
  { to: '/codex', label: '도감', en: 'CODEX', accent: 'var(--surge)' },
  { to: '/settings', label: '설정', en: 'CONFIG', accent: 'var(--repair)' },
];

export default function Lobby() {
  const nav = useNavigate();
  const deck = useGame((s) => s.deck);
  const owned = useGame((s) => s.ownedGhosts);
  const cleared = useGame((s) => s.clearedStages);
  const endlessBest = useGame((s) => s.endlessBest);
  const lastDailyClaim = useGame((s) => s.lastDailyClaim);
  const loginStreak = useGame((s) => s.loginStreak);
  const claimDaily = useGame((s) => s.claimDaily);
  const reducedFx = useGame((s) => s.settings.reducedFx);
  const totalPulls = useGame((s) => s.gacha.totalPulls);
  const claimedAchv = useGame((s) => s.claimedAchievements);

  const [reward, setReward] = useState<DailyReward | null>(null);
  const canClaimDaily = lastDailyClaim !== todayKey();

  const achvCtx = achievementContext({
    ownedGhosts: owned,
    clearedStages: cleared,
    endlessBest,
    gacha: { pity: 0, guaranteed: false, totalPulls },
  } as SaveState);
  const claimableMissions = ACHIEVEMENTS.filter(
    (a) => achvCtx[a.metric] >= a.goal && !claimedAchv.includes(a.id),
  ).length;

  const deckPower = deck.reduce((sum, id) => {
    if (!id || !owned[id]) return sum;
    return sum + deriveStats(GHOST_BY_ID[id], owned[id]).power;
  }, 0);

  const clearedCount = cleared.length;
  const nextStage = STAGES.find((s) => !cleared.includes(s.id)) ?? STAGES[STAGES.length - 1];

  const onClaim = () => {
    const r = claimDaily();
    if (r) {
      sfx.reveal('SR');
      setReward(r);
    }
  };

  return (
    <Screen>
      <CityBackground reducedFx={reducedFx} />

      {/* top bar */}
      <div style={{ flex: 'none', padding: '18px 18px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        <div className="font-disp" style={{ fontSize: 22, fontWeight: 700 }}>
          <span className="logo-n">NEON</span> <span className="logo-c">CIPHER</span>
        </div>
        <CurrencyBar />
      </div>

      <div className="scroll" style={{ flex: 1, padding: '4px 18px 14px', position: 'relative' }}>
        {/* daily reward */}
        <AnimatePresence>
          {canClaimDaily && (
            <motion.button
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              onClick={onClaim}
              className="panel"
              style={{
                width: '100%',
                padding: 14,
                marginBottom: 12,
                cursor: 'pointer',
                textAlign: 'left',
                borderColor: 'var(--surge)',
                background: 'radial-gradient(120% 80% at 0% 0%,rgba(255,212,0,.12),transparent 60%),var(--panel)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 0 18px rgba(255,212,0,.12)',
              }}
            >
              <div>
                <div className="font-mono" style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--surge)' }}>DAILY UPLINK · DAY {Math.min(7, loginStreak + 1)}/7</div>
                <div className="font-disp" style={{ fontSize: 15, fontWeight: 700, color: '#f3f6ff', marginTop: 2 }}>일일 접속 보상</div>
                <div className="font-mono" style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>연속 접속할수록 보상 증가 · 7일차 10연 티켓</div>
              </div>
              <span className="btn btn-primary" style={{ padding: '9px 16px', fontSize: 11 }}>수령</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* squad preview */}
        <div className="panel" style={{ padding: 16, position: 'relative', overflow: 'hidden', background: 'radial-gradient(120% 80% at 50% 0%,rgba(0,234,255,.07),transparent 60%),var(--panel)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div className="font-mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--cyan)' }}>ACTIVE SQUAD</div>
            <div className="font-mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
              전투력 <span style={{ color: '#eef2ff', fontWeight: 700 }}>{deckPower.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'space-between' }}>
            {deck.map((id, i) => {
              const def = id ? GHOST_BY_ID[id] : null;
              return (
                <div
                  key={i}
                  onClick={() => nav('/team')}
                  style={{
                    flex: 1,
                    aspectRatio: '0.72',
                    borderRadius: 8,
                    border: `1px solid ${def ? 'var(--line2)' : 'var(--line)'}`,
                    background: def
                      ? `radial-gradient(80% 60% at 50% 20%,${ATTR_VAR[def.attribute]}22,transparent 70%),var(--panel2)`
                      : 'var(--panel2)',
                    display: 'flex',
                    alignItems: def ? 'flex-end' : 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                >
                  {def ? (
                    <>
                      <div style={{ transform: 'translateY(8px)' }}>
                        <GhostFigure color={ATTR_VAR[def.attribute]} width={34} glow={false} />
                      </div>
                      <span className="font-mono" style={{ position: 'absolute', top: 4, left: 5, fontSize: 8, color: RARITY_COLOR[def.rarity] }}>
                        {def.rarity}
                      </span>
                    </>
                  ) : (
                    <span className="font-mono" style={{ color: 'var(--dim)', fontSize: 18 }}>+</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* progress line */}
        <div className="panel" style={{ marginTop: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="font-mono" style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--muted)' }}>CLEARED SECTORS</div>
            <div className="font-disp" style={{ fontSize: 18, color: '#eef2ff', fontWeight: 700 }}>{clearedCount} / {STAGES.length}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="font-mono" style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--muted)' }}>NEXT</div>
            <div className="font-disp" style={{ fontSize: 13, color: 'var(--cyan)' }}>{nextStage.name.split('//')[0].trim()}</div>
          </div>
        </div>

        {/* missions */}
        <button
          onClick={() => nav('/missions')}
          className="panel"
          style={{ width: '100%', marginTop: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left', borderColor: claimableMissions > 0 ? 'var(--surge)' : 'var(--line2)', background: 'radial-gradient(120% 80% at 0% 0%,rgba(255,212,0,.08),transparent 60%),var(--panel)' }}
        >
          <div>
            <div className="font-mono" style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--surge)' }}>OBJECTIVES // 미션</div>
            <div className="font-disp" style={{ fontSize: 15, fontWeight: 700, color: '#f3f6ff', marginTop: 2 }}>업적 · 도전 과제</div>
          </div>
          {claimableMissions > 0 ? (
            <span className="font-mono" style={{ fontSize: 11, color: '#05060a', background: 'var(--surge)', borderRadius: 12, padding: '4px 10px', fontWeight: 700, boxShadow: '0 0 12px var(--surge)' }}>
              {claimableMissions} 수령
            </span>
          ) : (
            <span className="font-mono" style={{ fontSize: 16, color: 'var(--muted)' }}>›</span>
          )}
        </button>

        {/* deep dive */}
        <button
          onClick={() => nav('/battle/endless')}
          className="panel"
          style={{ width: '100%', marginTop: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left', borderColor: 'var(--line2)', background: 'radial-gradient(120% 80% at 100% 0%,rgba(177,78,255,.12),transparent 60%),var(--panel)' }}
        >
          <div>
            <div className="font-mono" style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--repair)' }}>ENDLESS // DEEP DIVE</div>
            <div className="font-disp" style={{ fontSize: 15, fontWeight: 700, color: '#f3f6ff', marginTop: 2 }}>심층 침투</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="font-mono" style={{ fontSize: 8, color: 'var(--muted)' }}>BEST</div>
            <div className="font-disp" style={{ fontSize: 18, fontWeight: 700, color: 'var(--surge)' }}>{endlessBest > 0 ? `W${endlessBest}` : '—'}</div>
          </div>
        </button>
      </div>

      {/* menu */}
      <div style={{ flex: 'none', padding: '6px 18px 22px', position: 'relative' }}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          className="btn btn-primary"
          onClick={() => nav('/stages')}
          style={{ width: '100%', padding: '16px', fontSize: 15, fontFamily: 'var(--disp)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 10 }}
        >
          ▶ 출격 · SORTIE
        </motion.button>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {MENU.map((m) => (
            <motion.button
              key={m.to}
              whileTap={{ scale: 0.96 }}
              className="btn"
              onClick={() => nav(m.to)}
              style={{ padding: '12px 4px', display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', borderColor: 'var(--line2)' }}
            >
              <span className="font-disp" style={{ fontSize: 14, fontWeight: 700, color: m.accent }}>{m.label}</span>
              <span className="font-mono" style={{ fontSize: 7.5, color: 'var(--muted)', letterSpacing: '0.1em' }}>{m.en}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {reward && (
        <Modal onClose={() => setReward(null)}>
          <div className="font-mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--surge)', textAlign: 'center' }}>
            DAILY UPLINK · DAY {reward.streak ?? 1}/7
          </div>
          <div className="font-disp glitch" data-t="REWARD" style={{ fontSize: 26, fontWeight: 700, color: '#f3f6ff', textAlign: 'center', marginTop: 6 }}>REWARD</div>

          {/* 7-day streak track */}
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 12 }}>
            {Array.from({ length: 7 }, (_, i) => {
              const day = i + 1;
              const done = day <= (reward.streak ?? 1);
              const isToday = day === (reward.streak ?? 1);
              return (
                <div
                  key={day}
                  className="font-mono"
                  style={{
                    width: 26, height: 26, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700,
                    border: `1px solid ${isToday ? 'var(--surge)' : done ? 'var(--line2)' : 'var(--line)'}`,
                    background: done ? 'rgba(255,212,0,.12)' : 'var(--panel2)',
                    color: isToday ? 'var(--surge)' : done ? 'var(--txt)' : 'var(--dim)',
                    boxShadow: isToday ? '0 0 10px rgba(255,212,0,.4)' : 'none',
                  }}
                >
                  {day === 7 ? '★' : day}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
            <RewardChip icon="◈" label="크리스탈" value={reward.crystal} color="var(--cyan)" />
            <RewardChip icon="❖" label="큐브" value={reward.cube} color="var(--mag)" />
            {reward.ticketSingle > 0 && <RewardChip icon="🎫" label="단챠" value={reward.ticketSingle} color="var(--surge)" />}
            {(reward.ticketTen ?? 0) > 0 && <RewardChip icon="🎟" label="10연" value={reward.ticketTen ?? 0} color="var(--mag)" />}
          </div>
          <button className="btn btn-primary" onClick={() => setReward(null)} style={{ width: '100%', marginTop: 20, padding: 12, fontSize: 13 }}>확인</button>
        </Modal>
      )}
    </Screen>
  );
}

function RewardChip({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 26, color }}>{icon}</div>
      <div className="font-disp" style={{ fontSize: 16, fontWeight: 700, color: '#eef2ff', marginTop: 2 }}>+{value.toLocaleString()}</div>
      <div className="font-mono" style={{ fontSize: 8, color: 'var(--muted)' }}>{label}</div>
    </div>
  );
}

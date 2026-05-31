import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Screen } from '@/ui/Screen';
import { ScreenHeader, Modal } from '@/ui/primitives';
import { CurrencyBar } from '@/ui/CurrencyBar';
import { useGame, achievementContext } from '@/state/store';
import { ACHIEVEMENTS, type Reward } from '@/data/achievements';
import { sfx } from '@/audio/sfx';
import type { SaveState } from '@/types';

export default function Missions() {
  const nav = useNavigate();
  const claimAchievement = useGame((s) => s.claimAchievement);
  const claimed = useGame((s) => s.claimedAchievements);
  // Select primitives (stable refs) then derive — avoids new-object selectors.
  const ownedGhosts = useGame((s) => s.ownedGhosts);
  const clearedStages = useGame((s) => s.clearedStages);
  const endlessBest = useGame((s) => s.endlessBest);
  const totalPulls = useGame((s) => s.gacha.totalPulls);
  const ctx = achievementContext({
    ownedGhosts,
    clearedStages,
    endlessBest,
    gacha: { pity: 0, guaranteed: false, totalPulls },
  } as SaveState);
  const [reward, setReward] = useState<Reward | null>(null);

  const onClaim = (id: string) => {
    const r = claimAchievement(id);
    if (r) {
      sfx.coin();
      setReward(r);
    }
  };

  const claimableCount = ACHIEVEMENTS.filter(
    (a) => ctx[a.metric] >= a.goal && !claimed.includes(a.id),
  ).length;
  const doneCount = ACHIEVEMENTS.filter((a) => claimed.includes(a.id)).length;

  return (
    <Screen>
      <ScreenHeader kicker="Objectives // Achievements" title="미션" accent="var(--surge)" onBack={() => nav('/lobby')} />
      <div style={{ flex: 'none', padding: '0 18px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="font-mono" style={{ fontSize: 10, color: 'var(--muted)' }}>
          달성 <span style={{ color: 'var(--surge)', fontWeight: 700 }}>{doneCount}</span> / {ACHIEVEMENTS.length}
          {claimableCount > 0 && <span style={{ color: 'var(--mag)' }}> · 수령 가능 {claimableCount}</span>}
        </span>
        <CurrencyBar />
      </div>

      <div className="scroll" style={{ flex: 1, padding: '4px 18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ACHIEVEMENTS.map((a, i) => {
          const prog = Math.min(ctx[a.metric], a.goal);
          const done = ctx[a.metric] >= a.goal;
          const isClaimed = claimed.includes(a.id);
          const pct = (prog / a.goal) * 100;
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="panel"
              style={{
                padding: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                position: 'relative',
                overflow: 'hidden',
                opacity: isClaimed ? 0.6 : 1,
                borderColor: done && !isClaimed ? a.accent : 'var(--line)',
                boxShadow: done && !isClaimed ? `0 0 16px ${a.accent}22` : 'none',
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 8,
                  flex: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: a.accent,
                  background: `radial-gradient(circle at 40% 35%,${a.accent}22,transparent 70%),var(--panel2)`,
                  border: `1px solid ${a.accent}55`,
                }}
              >
                {a.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-disp" style={{ fontSize: 14, fontWeight: 700, color: '#eef2ff' }}>{a.title}</div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 1 }}>{a.desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#0c0f18', overflow: 'hidden', border: '1px solid var(--line2)' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: a.accent, boxShadow: `0 0 6px ${a.accent}` }} />
                  </div>
                  <span className="font-mono" style={{ fontSize: 8, color: 'var(--muted)' }}>{prog}/{a.goal}</span>
                </div>
                <div className="font-mono" style={{ fontSize: 8, color: 'var(--dim)', marginTop: 3 }}>
                  보상 ◈{a.reward.crystal} · ❖{a.reward.cube}
                </div>
              </div>
              {isClaimed ? (
                <span className="font-mono" style={{ fontSize: 9, color: 'var(--spike)', flex: 'none' }}>완료</span>
              ) : (
                <button
                  className={done ? 'btn btn-primary' : 'btn'}
                  disabled={!done}
                  onClick={() => onClaim(a.id)}
                  style={{ flex: 'none', padding: '8px 12px', fontSize: 10 }}
                >
                  {done ? '수령' : '진행중'}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {reward && (
        <Modal onClose={() => setReward(null)}>
          <div className="font-mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--surge)', textAlign: 'center' }}>ACHIEVEMENT UNLOCKED</div>
          <div className="font-disp glitch" data-t="REWARD" style={{ fontSize: 26, fontWeight: 700, color: '#f3f6ff', textAlign: 'center', marginTop: 6 }}>REWARD</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 18 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, color: 'var(--cyan)' }}>◈</div>
              <div className="font-disp" style={{ fontSize: 16, fontWeight: 700, color: '#eef2ff' }}>+{reward.crystal.toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, color: 'var(--mag)' }}>❖</div>
              <div className="font-disp" style={{ fontSize: 16, fontWeight: 700, color: '#eef2ff' }}>+{reward.cube.toLocaleString()}</div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setReward(null)} style={{ width: '100%', marginTop: 20, padding: 12, fontSize: 13 }}>확인</button>
        </Modal>
      )}
    </Screen>
  );
}

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Screen } from '@/ui/Screen';
import type { BattleResult } from '@/types';
import { STAGES, STAGE_BY_ID } from '@/data/waves';

interface ResultState {
  stageId: string;
  result?: BattleResult;
  crystalGained: number;
  endless?: boolean;
  wave?: number;
  isBest?: boolean;
}

export default function Result() {
  const nav = useNavigate();
  const loc = useLocation();
  const state = loc.state as ResultState | null;

  useEffect(() => {
    if (!state) nav('/lobby', { replace: true });
  }, [state, nav]);
  if (!state) return null;

  if (state.endless) return <EndlessResult state={state} />;

  const { stageId, result, crystalGained } = state;
  if (!result) {
    nav('/lobby', { replace: true });
    return null;
  }
  const stage = STAGE_BY_ID[stageId];
  const victory = result.victory;
  const nextStage = STAGES.find((s) => s.index === (stage?.index ?? -1) + 1);

  return (
    <Screen>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 26, gap: 18, background: victory ? 'radial-gradient(120% 70% at 50% 0%,rgba(0,234,255,.12),transparent 60%)' : 'radial-gradient(120% 70% at 50% 0%,rgba(255,42,109,.12),transparent 60%)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 16 }} className="font-disp glitch" data-t={victory ? 'CLEAR' : 'FAILED'} style={{ fontSize: 52, fontWeight: 700, color: victory ? '#f3f6ff' : 'var(--mag)', textShadow: victory ? '0 0 28px rgba(0,234,255,.5)' : '0 0 28px rgba(255,42,109,.5)' }}>
          {victory ? 'CLEAR' : 'FAILED'}
        </motion.div>

        <div style={{ display: 'flex', gap: 10 }}>
          {[0, 1, 2].map((i) => (
            <motion.span key={i} initial={{ scale: 0, rotate: -40 }} animate={{ scale: i < result.stars ? 1.1 : 0.8, rotate: 0 }} transition={{ delay: 0.3 + i * 0.18, type: 'spring', stiffness: 260 }} style={{ fontSize: 40, color: i < result.stars ? 'var(--surge)' : 'var(--dim)', textShadow: i < result.stars ? '0 0 16px var(--surge)' : 'none' }}>
              ★
            </motion.span>
          ))}
        </div>

        <div className="panel" style={{ width: '100%', maxWidth: 320, padding: 18 }}>
          <Row label="잔여 코어 HP" value={`${result.coreHpRemaining} / ${result.coreHpMax}`} />
          <Row label="클리어 시간" value={`${result.timeSec.toFixed(1)}s`} />
          <Row label="최대 콤보" value={`${result.maxCombo}`} />
          <div style={{ height: 1, background: 'var(--line)', margin: '12px 0' }} />
          <Row label="◈ 크리스탈 획득" value={`+${crystalGained.toLocaleString()}`} accent="var(--cyan)" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320, marginTop: 6 }}>
          {victory && nextStage ? (
            <button className="btn btn-primary" onClick={() => nav(`/battle/${nextStage.id}`)} style={{ padding: 14, fontSize: 13 }}>
              ▶ 다음 섹터 · {nextStage.name.split('//')[0].trim()}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => nav(`/battle/${stageId}`)} style={{ padding: 14, fontSize: 13 }}>
              ↻ 다시 시도
            </button>
          )}
          {victory && (
            <button className="btn" onClick={() => nav('/gacha')} style={{ padding: 12, fontSize: 12 }}>
              ❖ 가챠 모집
            </button>
          )}
          <button className="btn" onClick={() => nav('/lobby')} style={{ padding: 12, fontSize: 12 }}>
            로비로
          </button>
        </div>
      </div>
    </Screen>
  );
}

function EndlessResult({ state }: { state: ResultState }) {
  const nav = useNavigate();
  const wave = state.wave ?? 0;
  return (
    <Screen>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 26, gap: 18, background: 'radial-gradient(120% 70% at 50% 0%,rgba(255,212,0,.12),transparent 60%)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 16 }} className="font-disp glitch" data-t="DIVE END" style={{ fontSize: 44, fontWeight: 700, color: 'var(--surge)', textShadow: '0 0 28px rgba(255,212,0,.5)' }}>
          DIVE END
        </motion.div>
        {state.isBest && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="font-mono" style={{ fontSize: 12, letterSpacing: '0.2em', color: 'var(--mag)', textShadow: '0 0 12px var(--mag)' }}>
            ★ NEW RECORD ★
          </motion.div>
        )}
        <div className="panel" style={{ width: '100%', maxWidth: 320, padding: 22, textAlign: 'center' }}>
          <div className="font-mono" style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.2em' }}>도달 웨이브</div>
          <div className="font-disp" style={{ fontSize: 48, fontWeight: 700, color: 'var(--surge)' }}>{wave + 1}</div>
          <div style={{ height: 1, background: 'var(--line)', margin: '14px 0' }} />
          <Row label="◈ 크리스탈 획득" value={`+${(state.crystalGained ?? 0).toLocaleString()}`} accent="var(--cyan)" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320, marginTop: 6 }}>
          <button className="btn btn-primary" onClick={() => nav('/battle/endless')} style={{ padding: 14, fontSize: 13 }}>↻ 다시 침투</button>
          <button className="btn" onClick={() => nav('/lobby')} style={{ padding: 12, fontSize: 12 }}>로비로</button>
        </div>
      </div>
    </Screen>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
      <span className="font-mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{label}</span>
      <span className="font-disp" style={{ fontSize: 15, fontWeight: 700, color: accent ?? '#eef2ff' }}>{value}</span>
    </div>
  );
}

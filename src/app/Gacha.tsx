import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen } from '@/ui/Screen';
import { ScreenHeader, GhostFigure, RARITY_COLOR } from '@/ui/primitives';
import { CurrencyBar } from '@/ui/CurrencyBar';
import { useGame, type PullCurrency } from '@/state/store';
import { GACHA, ATTR_VAR, ATTR_GLYPH } from '@/data/balance';
import { GHOST_BY_ID, FEATURED_POOL } from '@/data/ghosts';
import { ssrRateAt } from '@/game/gacha/gacha';
import type { PullResult } from '@/game/gacha/gacha';

export default function Gacha() {
  const nav = useNavigate();
  const pull = useGame((s) => s.pull);
  const grantCubes = useGame((s) => s.grantCubes);
  const gacha = useGame((s) => s.gacha);
  const currencies = useGame((s) => s.currencies);

  const [reveal, setReveal] = useState<PullResult[] | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const ssrRate = ssrRateAt(gacha.pity);

  const doPull = (count: 1 | 10, currency: PullCurrency) => {
    const results = pull(count, currency);
    if (results.length === 0) {
      setToast('재화가 부족합니다');
      setTimeout(() => setToast(null), 1500);
      return;
    }
    setReveal(results);
  };

  return (
    <Screen>
      <ScreenHeader kicker="Recruitment // Singularity" title="고스트 모집" accent="var(--mag)" onBack={() => nav('/lobby')} />
      <div style={{ flex: 'none', padding: '0 18px 8px', display: 'flex', justifyContent: 'flex-end' }}>
        <CurrencyBar />
      </div>

      <div className="scroll" style={{ flex: 1, padding: '4px 18px 18px' }}>
        {/* BANNER */}
        <div
          className="panel"
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: 18,
            minHeight: 220,
            background:
              'radial-gradient(90% 70% at 30% 10%,rgba(255,42,109,.18),transparent 60%),radial-gradient(90% 70% at 90% 30%,rgba(255,212,0,.12),transparent 60%),var(--panel)',
            borderColor: 'var(--line2)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'conic-gradient(from 0deg,transparent,rgba(255,212,0,.06),transparent 30%)',
              animation: 'spin 10s linear infinite',
              pointerEvents: 'none',
            }}
          />
          <div className="font-mono" style={{ fontSize: 9, letterSpacing: '0.25em', color: 'var(--surge)', position: 'relative' }}>
            LIMITED · SINGULARITY PICKUP
          </div>
          <div className="font-disp glitch" data-t="GHOST PROTOCOL" style={{ fontSize: 24, fontWeight: 700, color: '#f3f6ff', marginTop: 4, position: 'relative' }}>
            GHOST PROTOCOL
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 14, justifyContent: 'center', position: 'relative' }}>
            {FEATURED_POOL.map((id) => {
              const def = GHOST_BY_ID[id];
              return (
                <div key={id} style={{ textAlign: 'center' }}>
                  <GhostFigure color={ATTR_VAR[def.attribute]} width={64} />
                  <div className="font-disp" style={{ fontSize: 12, fontWeight: 700, color: RARITY_COLOR[def.rarity], marginTop: 4 }}>
                    {def.name}
                  </div>
                  <div className="font-mono" style={{ fontSize: 8, color: 'var(--muted)' }}>{def.rarity} · {ATTR_GLYPH[def.attribute]}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PITY */}
        <div className="panel" style={{ padding: 14, marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: '0.15em', color: 'var(--cyan)' }}>PITY COUNTER</span>
            <span className="font-disp" style={{ fontSize: 14, fontWeight: 700, color: '#eef2ff' }}>
              {gacha.pity} / {GACHA.hardPity}
            </span>
          </div>
          <div style={{ height: 7, border: '1px solid var(--line2)', borderRadius: 5, overflow: 'hidden', background: '#060810', marginTop: 8 }}>
            <div style={{ height: '100%', width: `${(gacha.pity / GACHA.hardPity) * 100}%`, background: 'linear-gradient(90deg,var(--cyan),var(--mag))', boxShadow: '0 0 10px var(--cyan)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span className="font-mono" style={{ fontSize: 9, color: 'var(--muted)' }}>
              SSR 확률 <span style={{ color: 'var(--mag)' }}>{(ssrRate * 100).toFixed(1)}%</span>
            </span>
            <span className="font-mono" style={{ fontSize: 9, color: gacha.guaranteed ? 'var(--surge)' : 'var(--muted)' }}>
              {gacha.guaranteed ? '★ 다음 SSR 픽업 확정' : '픽업 50:50'}
            </span>
          </div>
          <div className="font-mono" style={{ fontSize: 8, color: 'var(--dim)', marginTop: 6, lineHeight: 1.5 }}>
            기본 SSR {(GACHA.baseSSR * 100).toFixed(0)}% / SR {(GACHA.baseSR * 100).toFixed(0)}% · 75연부터 확률 증가 · 90연 SSR 확정 · 10연 SR이상 보장
          </div>
        </div>

        {/* PULL BUTTONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={() => doPull(1, 'cube')} style={{ flex: 1, padding: '14px 6px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="font-disp" style={{ fontSize: 14, fontWeight: 700 }}>1회 모집</span>
              <span style={{ fontSize: 10, color: 'var(--mag)' }}>❖ {GACHA.costSingleCube}</span>
            </button>
            <button className="btn btn-mag" onClick={() => doPull(10, 'cube')} style={{ flex: 1, padding: '14px 6px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="font-disp" style={{ fontSize: 14, fontWeight: 700 }}>10연 모집</span>
              <span style={{ fontSize: 10, color: 'var(--mag)' }}>❖ {GACHA.costTenCube}</span>
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" onClick={() => doPull(1, 'ticketSingle')} disabled={currencies.ticketSingle < 1} style={{ flex: 1, padding: '10px 6px', fontSize: 10 }}>
              단챠 티켓 ×{currencies.ticketSingle}
            </button>
            <button className="btn" onClick={() => doPull(10, 'ticketTen')} disabled={currencies.ticketTen < 1} style={{ flex: 1, padding: '10px 6px', fontSize: 10 }}>
              10연 티켓 ×{currencies.ticketTen}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" onClick={() => doPull(1, 'crystal')} style={{ flex: 1, padding: '10px 6px', fontSize: 10 }}>
              ◈ {GACHA.costSingleCrystal} · 1회
            </button>
            <button className="btn" onClick={() => doPull(10, 'crystal')} style={{ flex: 1, padding: '10px 6px', fontSize: 10 }}>
              ◈ {GACHA.costTenCrystal} · 10연
            </button>
          </div>
          <button className="btn" onClick={() => { grantCubes(1600); setToast('❖ 1600 큐브 지급 (테스트)'); setTimeout(() => setToast(null), 1500); }} style={{ padding: '9px', fontSize: 10, borderStyle: 'dashed' }}>
            ❖ 큐브 충전 (테스트 지급)
          </button>
        </div>
      </div>

      <AnimatePresence>{reveal && <PullReveal results={reveal} onClose={() => setReveal(null)} />}</AnimatePresence>

      {toast && (
        <div className="font-mono" style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', background: 'rgba(5,6,10,.9)', border: '1px solid var(--line2)', borderRadius: 6, padding: '10px 18px', fontSize: 11, color: 'var(--txt)', zIndex: 300 }}>
          {toast}
        </div>
      )}
    </Screen>
  );
}

function PullReveal({ results, onClose }: { results: PullResult[]; onClose: () => void }) {
  const [phase, setPhase] = useState<'scan' | 'cards'>('scan');
  const top = results.reduce((acc, r) => (rank(r.rarity) > rank(acc.rarity) ? r : acc), results[0]);
  const topColor = RARITY_COLOR[top.rarity];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => (phase === 'scan' ? setPhase('cards') : null)}
      style={{ position: 'absolute', inset: 0, zIndex: 400, background: 'rgba(3,4,8,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 22 }}
    >
      {phase === 'scan' ? (
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onAnimationComplete={() => setTimeout(() => setPhase('cards'), top.rarity === 'UR' ? 1100 : 700)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}
        >
          <div
            className="font-disp glitch"
            data-t="DECRYPTING"
            style={{ fontSize: 26, fontWeight: 700, color: topColor, textShadow: `0 0 24px ${topColor}` }}
          >
            DECRYPTING
          </div>
          <div style={{ width: 180, height: 4, background: '#0c0f18', borderRadius: 4, overflow: 'hidden' }}>
            <motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 0.9 }} style={{ height: '100%', background: topColor, boxShadow: `0 0 12px ${topColor}` }} />
          </div>
          <div className="font-mono" style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.2em' }}>TAP TO REVEAL</div>
        </motion.div>
      ) : (
        <>
          <div className="font-mono" style={{ fontSize: 10, letterSpacing: '0.25em', color: 'var(--cyan)', marginBottom: 14 }}>
            DECRYPTED · {results.length} UNIT{results.length > 1 ? 'S' : ''}
          </div>
          <div
            className="scroll"
            style={{
              display: 'grid',
              gridTemplateColumns: results.length > 1 ? 'repeat(5,1fr)' : '1fr',
              gap: 8,
              width: '100%',
              maxWidth: 360,
              maxHeight: '60%',
            }}
          >
            {results.map((r, i) => {
              const def = GHOST_BY_ID[r.ghostId];
              const col = RARITY_COLOR[r.rarity];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ delay: i * 0.07 }}
                  style={{
                    border: `1px solid ${col}`,
                    borderRadius: 7,
                    padding: results.length > 1 ? '8px 3px' : 16,
                    background: `radial-gradient(80% 60% at 50% 20%,${col}22,transparent 70%),var(--panel2)`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    boxShadow: rank(r.rarity) >= 2 ? `0 0 16px ${col}66` : 'none',
                    position: 'relative',
                  }}
                >
                  <GhostFigure color={ATTR_VAR[def.attribute]} width={results.length > 1 ? 30 : 90} />
                  <div className="font-disp" style={{ fontSize: results.length > 1 ? 9 : 16, fontWeight: 700, color: col, marginTop: 4, textAlign: 'center' }}>
                    {def.name}
                  </div>
                  <div className="font-mono" style={{ fontSize: 7.5, color: 'var(--muted)' }}>{r.rarity}</div>
                  {r.isNew && (
                    <span className="font-mono" style={{ position: 'absolute', top: 2, right: 2, fontSize: 6.5, color: 'var(--surge)', border: '1px solid var(--surge)', borderRadius: 2, padding: '0 2px' }}>
                      NEW
                    </span>
                  )}
                  {r.featured && (
                    <span className="font-mono" style={{ position: 'absolute', top: 2, left: 2, fontSize: 6.5, color: 'var(--mag)' }}>★</span>
                  )}
                </motion.div>
              );
            })}
          </div>
          <button className="btn btn-primary" onClick={onClose} style={{ marginTop: 18, padding: '12px 40px', fontSize: 13 }}>
            확인
          </button>
        </>
      )}
    </motion.div>
  );
}

function rank(r: string): number {
  return { R: 0, SR: 1, SSR: 2, UR: 3 }[r] ?? 0;
}

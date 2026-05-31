import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen } from '@/ui/Screen';
import { ScreenHeader, Modal } from '@/ui/primitives';
import { CityBackground } from '@/ui/CityBackground';
import { useGame } from '@/state/store';
import { STAGES, stageEnemyCount } from '@/data/waves';
import { STAGE_BRIEFINGS, DEFAULT_BRIEFING } from '@/data/lore';
import { GHOST_BY_ID } from '@/data/ghosts';
import { deriveStats } from '@/game/progression/stats';
import { sfx } from '@/audio/sfx';
import type { StageDef } from '@/types';

export default function StageSelect() {
  const nav = useNavigate();
  const cleared = useGame((s) => s.clearedStages);
  const deck = useGame((s) => s.deck);
  const owned = useGame((s) => s.ownedGhosts);
  const reducedFx = useGame((s) => s.settings.reducedFx);
  const [briefing, setBriefing] = useState<StageDef | null>(null);

  const deckPower = deck.reduce((sum, id) => {
    if (!id || !owned[id]) return sum;
    return sum + deriveStats(GHOST_BY_ID[id], owned[id]).power;
  }, 0);

  const hasDeck = deck.some((id) => id && owned[id]);

  return (
    <Screen>
      <CityBackground reducedFx={reducedFx} />
      <ScreenHeader kicker="Mission Select" title="출격 섹터" onBack={() => nav('/lobby')} />

      <div style={{ flex: 'none', padding: '0 18px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        <span className="font-mono" style={{ fontSize: 10, color: 'var(--muted)' }}>내 전투력</span>
        <span className="font-disp" style={{ fontSize: 16, fontWeight: 700, color: 'var(--cyan)' }}>{deckPower.toLocaleString()}</span>
      </div>

      <div className="scroll" style={{ flex: 1, padding: '4px 18px 20px', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
        {STAGES.map((stage, i) => {
          const isCleared = cleared.includes(stage.id);
          const locked = i > 0 && !cleared.includes(STAGES[i - 1].id);
          const underpowered = deckPower < stage.recommendedPower;
          const [code, title] = stage.name.split('//').map((s) => s.trim());

          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="panel"
              style={{
                padding: 16,
                position: 'relative',
                overflow: 'hidden',
                opacity: locked ? 0.5 : 1,
                borderColor: isCleared ? 'var(--line2)' : 'var(--line)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `radial-gradient(80% 60% at 100% 0%,${isCleared ? 'rgba(43,255,136,.08)' : 'rgba(0,234,255,.06)'},transparent 60%)`,
                  pointerEvents: 'none',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                <div>
                  <div className="font-mono" style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--cyan)' }}>{code}</div>
                  <div className="font-disp" style={{ fontSize: 17, fontWeight: 700, color: '#f3f6ff', marginTop: 2 }}>{title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{stage.subtitle}</div>
                </div>
                {isCleared && (
                  <span className="font-mono" style={{ fontSize: 9, color: 'var(--spike)', border: '1px solid var(--spike)', borderRadius: 3, padding: '2px 6px' }}>CLEARED</span>
                )}
                {locked && <span className="font-mono" style={{ fontSize: 14, color: 'var(--dim)' }}>🔒</span>}
              </div>

              <div style={{ display: 'flex', gap: 14, marginTop: 12, position: 'relative' }}>
                <Info label="웨이브" value={`${stage.waves.length}`} />
                <Info label="적 수" value={`${stageEnemyCount(stage)}`} />
                <Info label="권장" value={stage.recommendedPower.toLocaleString()} warn={underpowered && !locked} />
                <Info label="보상 ◈" value={stage.rewardCrystal.toLocaleString()} accent="var(--cyan)" />
              </div>

              {!locked && (
                <button
                  className={`btn ${underpowered ? 'btn-mag' : 'btn-primary'}`}
                  disabled={!hasDeck}
                  onClick={() => { sfx.ui(); setBriefing(stage); }}
                  style={{ width: '100%', marginTop: 14, padding: '11px', fontSize: 12, position: 'relative' }}
                >
                  {hasDeck ? (underpowered ? '⚠ 전력 부족 · 출격' : '▶ 출격') : '편성 필요'}
                </button>
              )}
            </motion.div>
          );
        })}
        {!hasDeck && (
          <button className="btn" onClick={() => nav('/team')} style={{ padding: 12, fontSize: 12 }}>
            편성 화면으로 이동
          </button>
        )}

        {/* endless shortcut */}
        <button
          className="btn"
          disabled={!hasDeck}
          onClick={() => nav('/battle/endless')}
          style={{ padding: 13, fontSize: 12, borderColor: 'var(--repair)', color: '#e9d6ff', marginTop: 2 }}
        >
          ⌁ 심층 침투 · DEEP DIVE (무한)
        </button>
      </div>

      <AnimatePresence>
        {briefing && (
          <BriefingModal stage={briefing} onClose={() => setBriefing(null)} onLaunch={() => nav(`/battle/${briefing.id}`)} />
        )}
      </AnimatePresence>
    </Screen>
  );
}

function BriefingModal({ stage, onClose, onLaunch }: { stage: StageDef; onClose: () => void; onLaunch: () => void }) {
  const brief = STAGE_BRIEFINGS[stage.id] ?? DEFAULT_BRIEFING;
  const [code, title] = stage.name.split('//').map((s) => s.trim());
  return (
    <Modal onClose={onClose} style={{ maxWidth: 360 }}>
      <div className="font-mono" style={{ fontSize: 9, letterSpacing: '0.22em', color: 'var(--cyan)' }}>
        INCOMING TRANSMISSION // {code}
      </div>
      <div className="font-disp glitch" data-t={title} style={{ fontSize: 22, fontWeight: 700, color: '#f3f6ff', marginTop: 4 }}>
        {title}
      </div>

      <div className="font-mono" style={{ fontSize: 10, color: 'var(--mag)', marginTop: 14 }}>{brief.from}</div>
      <div
        style={{
          fontSize: 12.5,
          color: 'var(--txt)',
          lineHeight: 1.7,
          marginTop: 8,
          padding: '12px 14px',
          border: '1px solid var(--line2)',
          borderLeft: '2px solid var(--cyan)',
          borderRadius: '0 6px 6px 0',
          background: 'rgba(0,234,255,.04)',
        }}
      >
        {brief.transmission}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'flex-start' }}>
        <span className="font-mono" style={{ fontSize: 9, color: 'var(--surge)', flex: 'none', marginTop: 2 }}>OBJECTIVE</span>
        <span style={{ fontSize: 12, color: '#eef2ff', lineHeight: 1.5 }}>{brief.objective}</span>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button className="btn btn-primary" onClick={onLaunch} style={{ flex: 1, padding: 13, fontSize: 13, letterSpacing: '0.1em' }}>
          ▶ 접속 · 출격
        </button>
        <button className="btn" onClick={onClose} style={{ flex: 0.5, padding: 13, fontSize: 12 }}>
          취소
        </button>
      </div>
    </Modal>
  );
}

function Info({ label, value, accent, warn }: { label: string; value: string; accent?: string; warn?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span className="font-mono" style={{ fontSize: 8.5, color: 'var(--muted)', letterSpacing: '0.1em' }}>{label}</span>
      <span className="font-disp" style={{ fontSize: 13, fontWeight: 700, color: warn ? 'var(--mag)' : accent ?? '#eef2ff' }}>{value}</span>
    </div>
  );
}

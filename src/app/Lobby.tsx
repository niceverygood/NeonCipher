import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Screen } from '@/ui/Screen';
import { CurrencyBar } from '@/ui/CurrencyBar';
import { GhostFigure, RARITY_COLOR } from '@/ui/primitives';
import { useGame } from '@/state/store';
import { GHOST_BY_ID } from '@/data/ghosts';
import { ATTR_VAR } from '@/data/balance';
import { deriveStats } from '@/game/progression/stats';
import { STAGES } from '@/data/waves';

const MENU = [
  { to: '/stages', label: '출격', en: 'SORTIE', accent: 'var(--cyan)', big: true },
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

  const deckPower = deck.reduce((sum, id) => {
    if (!id || !owned[id]) return sum;
    return sum + deriveStats(GHOST_BY_ID[id], owned[id]).power;
  }, 0);

  const clearedCount = cleared.length;
  const nextStage = STAGES.find((s) => !cleared.includes(s.id)) ?? STAGES[STAGES.length - 1];

  return (
    <Screen>
      {/* top bar */}
      <div style={{ flex: 'none', padding: '18px 18px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="font-disp" style={{ fontSize: 22, fontWeight: 700 }}>
          <span className="logo-n">NEON</span> <span className="logo-c">CIPHER</span>
        </div>
        <CurrencyBar />
      </div>

      {/* squad preview */}
      <div className="scroll" style={{ flex: 1, padding: '4px 18px 14px' }}>
        <div
          className="panel"
          style={{
            padding: 16,
            position: 'relative',
            overflow: 'hidden',
            background: 'radial-gradient(120% 80% at 50% 0%,rgba(0,234,255,.07),transparent 60%),var(--panel)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div className="font-mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--cyan)' }}>
              ACTIVE SQUAD
            </div>
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
                      <span
                        className="font-mono"
                        style={{
                          position: 'absolute',
                          top: 4,
                          left: 5,
                          fontSize: 8,
                          color: RARITY_COLOR[def.rarity],
                        }}
                      >
                        {def.rarity}
                      </span>
                    </>
                  ) : (
                    <span className="font-mono" style={{ color: 'var(--dim)', fontSize: 18 }}>
                      +
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* progress line */}
        <div
          className="panel"
          style={{ marginTop: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div>
            <div className="font-mono" style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--muted)' }}>
              CLEARED SECTORS
            </div>
            <div className="font-disp" style={{ fontSize: 18, color: '#eef2ff', fontWeight: 700 }}>
              {clearedCount} / {STAGES.length}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="font-mono" style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--muted)' }}>
              NEXT
            </div>
            <div className="font-disp" style={{ fontSize: 13, color: 'var(--cyan)' }}>
              {nextStage.name.split('//')[0].trim()}
            </div>
          </div>
        </div>
      </div>

      {/* menu */}
      <div style={{ flex: 'none', padding: '6px 18px 22px' }}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          className="btn btn-primary"
          onClick={() => nav('/stages')}
          style={{ width: '100%', padding: '16px', fontSize: 15, fontFamily: 'var(--disp)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 10 }}
        >
          ▶ 출격 · SORTIE
        </motion.button>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {MENU.slice(1).map((m) => (
            <motion.button
              key={m.to}
              whileTap={{ scale: 0.96 }}
              className="btn"
              onClick={() => nav(m.to)}
              style={{ padding: '12px 4px', display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', borderColor: 'var(--line2)' }}
            >
              <span className="font-disp" style={{ fontSize: 14, fontWeight: 700, color: m.accent }}>
                {m.label}
              </span>
              <span className="font-mono" style={{ fontSize: 7.5, color: 'var(--muted)', letterSpacing: '0.1em' }}>
                {m.en}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </Screen>
  );
}

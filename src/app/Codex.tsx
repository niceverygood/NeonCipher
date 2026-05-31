import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen } from '@/ui/Screen';
import { ScreenHeader, GhostFigure, StarRow, RARITY_COLOR } from '@/ui/primitives';
import { GhostDetail } from '@/ui/GhostDetail';
import { useGame } from '@/state/store';
import { GHOSTS } from '@/data/ghosts';
import { ATTR_VAR, ATTR_GLYPH } from '@/data/balance';

const RARITY_SORT = { UR: 0, SSR: 1, SR: 2, R: 3 } as const;

export default function Codex() {
  const nav = useNavigate();
  const owned = useGame((s) => s.ownedGhosts);
  const [detail, setDetail] = useState<string | null>(null);

  const sorted = [...GHOSTS].sort((a, b) => RARITY_SORT[a.rarity] - RARITY_SORT[b.rarity]);
  const ownedCount = GHOSTS.filter((g) => owned[g.id]).length;

  return (
    <Screen>
      <ScreenHeader kicker="Archive // Ghost Dossier" title="고스트 도감" accent="var(--surge)" onBack={() => nav('/lobby')} />
      <div style={{ flex: 'none', padding: '0 18px 10px' }}>
        <span className="font-mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
          수집률 <span style={{ color: 'var(--surge)', fontWeight: 700 }}>{ownedCount}</span> / {GHOSTS.length}
        </span>
      </div>

      <div className="scroll" style={{ flex: 1, padding: '0 18px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {sorted.map((g) => {
            const own = owned[g.id];
            const col = RARITY_COLOR[g.rarity];
            return (
              <button
                key={g.id}
                onClick={() => setDetail(g.id)}
                className="panel"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  borderColor: own ? col : 'var(--line)',
                  cursor: 'pointer',
                  position: 'relative',
                  background: 'var(--panel2)',
                }}
              >
                <div
                  style={{
                    height: 96,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    background: own
                      ? `radial-gradient(80% 70% at 50% 25%,${ATTR_VAR[g.attribute]}22,transparent 65%)`
                      : 'linear-gradient(180deg,#0a0d15,#070910)',
                    position: 'relative',
                  }}
                >
                  <GhostFigure color={ATTR_VAR[g.attribute]} width={42} silhouette={!own} glow={!!own} />
                  <span className="font-mono" style={{ position: 'absolute', top: 5, left: 6, fontSize: 8, color: own ? col : 'var(--dim)' }}>{g.rarity}</span>
                  {own && (
                    <span style={{ position: 'absolute', top: 5, right: 6, width: 16, height: 16, borderRadius: '50%', background: ATTR_VAR[g.attribute], color: '#05060a', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontWeight: 700 }}>
                      {ATTR_GLYPH[g.attribute]}
                    </span>
                  )}
                </div>
                <div style={{ padding: '6px 6px 8px', borderTop: '1px solid var(--line)' }}>
                  <div className="font-disp" style={{ fontSize: 11, fontWeight: 700, color: own ? '#f3f6ff' : 'var(--dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {own ? g.name : '???'}
                  </div>
                  <StarRow count={own ? own.stars : 0} color={own ? col : 'var(--dim)'} size={9} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {detail && <GhostDetail ghostId={detail} onClose={() => setDetail(null)} />}
    </Screen>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen } from '@/ui/Screen';
import { ScreenHeader, GhostFigure, StarRow, RARITY_COLOR } from '@/ui/primitives';
import { useGame } from '@/state/store';
import { GHOSTS, GHOST_BY_ID } from '@/data/ghosts';
import { ATTR_VAR, ROLE_LABEL } from '@/data/balance';
import { deriveStats } from '@/game/progression/stats';
import { computeSynergy } from '@/game/progression/synergy';

export default function Team() {
  const nav = useNavigate();
  const deck = useGame((s) => s.deck);
  const owned = useGame((s) => s.ownedGhosts);
  const setDeckSlot = useGame((s) => s.setDeckSlot);
  const [activeSlot, setActiveSlot] = useState(0);

  const ownedDefs = GHOSTS.filter((g) => owned[g.id]);

  const power = deck.reduce((sum, id) => (id && owned[id] ? sum + deriveStats(GHOST_BY_ID[id], owned[id]).power : sum), 0);

  const synergy = computeSynergy(deck);

  const assign = (id: string) => {
    setDeckSlot(activeSlot, id);
    setActiveSlot((s) => (s + 1) % 5);
  };

  return (
    <Screen>
      <ScreenHeader kicker="Squad // Deck Builder" title="편성" accent="var(--spike)" onBack={() => nav('/lobby')} />

      {/* deck slots */}
      <div style={{ flex: 'none', padding: '0 18px 8px' }}>
        <div style={{ display: 'flex', gap: 7, justifyContent: 'space-between' }}>
          {deck.map((id, i) => {
            const def = id ? GHOST_BY_ID[id] : null;
            const active = activeSlot === i;
            return (
              <div
                key={i}
                onClick={() => setActiveSlot(i)}
                style={{
                  flex: 1,
                  aspectRatio: '0.74',
                  borderRadius: 8,
                  border: `1px solid ${active ? 'var(--cyan)' : def ? RARITY_COLOR[def.rarity] : 'var(--line)'}`,
                  boxShadow: active ? '0 0 12px rgba(0,234,255,.3)' : 'none',
                  background: def ? `radial-gradient(80% 60% at 50% 20%,${ATTR_VAR[def.attribute]}22,transparent 70%),var(--panel2)` : 'var(--panel2)',
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
                    <GhostFigure color={ATTR_VAR[def.attribute]} width={32} glow={false} />
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeckSlot(i, null); }}
                      className="font-mono"
                      style={{ position: 'absolute', top: 2, right: 2, width: 14, height: 14, borderRadius: 3, border: '1px solid var(--line2)', background: 'rgba(5,6,10,.8)', color: 'var(--mag)', fontSize: 9, cursor: 'pointer', padding: 0 }}
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <span className="font-mono" style={{ color: active ? 'var(--cyan)' : 'var(--dim)', fontSize: 18 }}>+</span>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <span className="font-mono" style={{ fontSize: 10, color: 'var(--muted)' }}>
            전투력 <span style={{ color: 'var(--cyan)', fontWeight: 700, fontFamily: 'var(--disp)' }}>{power.toLocaleString()}</span>
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            {synergy.atkMult > 1 && <MiniStat label="ATK" value={`+${Math.round((synergy.atkMult - 1) * 100)}%`} color="var(--fire)" />}
            {synergy.hpMult > 1 && <MiniStat label="HP" value={`+${Math.round((synergy.hpMult - 1) * 100)}%`} color="var(--spike)" />}
            {synergy.coreMult > 1 && <MiniStat label="CORE" value={`+${Math.round((synergy.coreMult - 1) * 100)}%`} color="var(--repair)" />}
            {synergy.energyBonus > 0 && <MiniStat label="EN" value={`+${synergy.energyBonus}`} color="var(--surge)" />}
          </div>
        </div>

        {/* active synergy effects */}
        <div className="panel" style={{ marginTop: 10, padding: '10px 12px', background: 'var(--panel2)' }}>
          <div className="font-mono" style={{ fontSize: 8.5, letterSpacing: '0.2em', color: 'var(--spike)', marginBottom: synergy.effects.length ? 8 : 0 }}>
            ACTIVE SYNERGY · 전투 적용
          </div>
          {synergy.effects.length === 0 ? (
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--dim)' }}>
              같은 속성·역할을 모아 시너지를 활성화하세요
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {synergy.effects.map((e) => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: e.color, boxShadow: `0 0 6px ${e.color}`, flex: 'none' }} />
                  <span className="font-disp" style={{ fontSize: 11, fontWeight: 700, color: e.color, flex: 'none' }}>{e.label}</span>
                  <span style={{ fontSize: 10, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.desc}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* owned roster */}
      <div className="font-mono" style={{ flex: 'none', padding: '6px 18px 4px', fontSize: 9, letterSpacing: '0.2em', color: 'var(--muted)' }}>
        보유 고스트 — 슬롯 {activeSlot + 1}에 배치
      </div>
      <div className="scroll" style={{ flex: 1, padding: '0 18px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 9 }}>
          {ownedDefs.map((g) => {
            const own = owned[g.id]!;
            const col = RARITY_COLOR[g.rarity];
            const inDeck = deck.includes(g.id);
            const stats = deriveStats(g, own);
            return (
              <button
                key={g.id}
                onClick={() => assign(g.id)}
                className="panel"
                style={{ padding: 0, overflow: 'hidden', borderColor: inDeck ? 'var(--cyan)' : col, opacity: inDeck ? 0.55 : 1, cursor: 'pointer', position: 'relative', background: 'var(--panel2)' }}
              >
                <div style={{ height: 64, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: `radial-gradient(80% 70% at 50% 25%,${ATTR_VAR[g.attribute]}22,transparent 65%)`, position: 'relative' }}>
                  <GhostFigure color={ATTR_VAR[g.attribute]} width={30} />
                  <span className="font-mono" style={{ position: 'absolute', top: 3, left: 4, fontSize: 7, color: col }}>{g.rarity}</span>
                  {inDeck && <span className="font-mono" style={{ position: 'absolute', top: 3, right: 4, fontSize: 7, color: 'var(--cyan)' }}>편성</span>}
                </div>
                <div style={{ padding: '4px 5px 6px', borderTop: '1px solid var(--line)' }}>
                  <div className="font-disp" style={{ fontSize: 9.5, fontWeight: 700, color: '#f3f6ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <StarRow count={own.stars} color={col} size={8} />
                    <span className="font-mono" style={{ fontSize: 7, color: 'var(--muted)' }}>Lv{own.level}</span>
                  </div>
                  <div className="font-mono" style={{ fontSize: 7, color: 'var(--muted)', marginTop: 1 }}>{ROLE_LABEL[g.role]} · {stats.power}</div>
                </div>
              </button>
            );
          })}
        </div>
        {ownedDefs.length === 0 && (
          <div className="font-mono" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 11, marginTop: 30 }}>보유한 고스트가 없습니다</div>
        )}
      </div>
    </Screen>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span className="font-mono" style={{ fontSize: 8.5, color, display: 'inline-flex', gap: 3, alignItems: 'baseline' }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </span>
  );
}

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BattleEngine, type DeckUnitDef } from '@/game/battle/engine';
import { areAdjacent } from '@/game/battle/grid';
import { GridView } from '@/app/battle/GridView';
import { drawField } from '@/app/battle/drawField';
import { useGame } from '@/state/store';
import { STAGE_BY_ID } from '@/data/waves';
import { GHOST_BY_ID } from '@/data/ghosts';
import { ATTR_ORDER, ATTR_VAR, ATTR_GLYPH } from '@/data/balance';
import { deriveStats, computeStars } from '@/game/progression/stats';
import type { Attribute, BattleResult } from '@/types';

interface Hud {
  energy: Record<Attribute, number>;
  coreHp: number;
  coreHpMax: number;
  wave: number;
  totalWaves: number;
  combo: number;
  overclock: number;
  overclockActive: number;
  cooldowns: number[];
  status: 'playing' | 'won' | 'lost';
  gridVersion: number;
}

export default function Battle() {
  const { stageId = '' } = useParams();
  const nav = useNavigate();
  const stage = STAGE_BY_ID[stageId];

  const deckIds = useGame((s) => s.deck);
  const owned = useGame((s) => s.ownedGhosts);
  const reducedFx = useGame((s) => s.settings.reducedFx);
  const finishBattle = useGame((s) => s.finishBattle);

  const engineRef = useRef<BattleEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  const accRef = useRef<number>(0);
  const finishedRef = useRef(false);

  const [selected, setSelected] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const pausedRef = useRef(paused);
  const speedRef = useRef(speed);
  pausedRef.current = paused;
  speedRef.current = speed;

  const [hud, setHud] = useState<Hud | null>(null);

  // Build the engine once.
  useEffect(() => {
    if (!stage) {
      nav('/stages');
      return;
    }
    const deck: DeckUnitDef[] = [];
    deckIds.forEach((id) => {
      if (!id || !owned[id]) return;
      const def = GHOST_BY_ID[id];
      const stats = deriveStats(def, owned[id]);
      deck.push({
        slot: deck.length,
        ghostId: id,
        name: def.name,
        attribute: def.attribute,
        role: def.role,
        rarity: def.rarity,
        hp: stats.hp,
        atk: stats.atk,
        atkInterval: def.atkInterval,
        cost: def.cost,
        cooldown: def.cooldown,
        color: ATTR_VAR[def.attribute],
      });
    });
    if (deck.length === 0) {
      nav('/team');
      return;
    }
    engineRef.current = new BattleEngine(stage, deck);
    setHud(snapshot(engineRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageId]);

  // Game loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const FIXED = 1 / 60;
    lastRef.current = performance.now();
    accRef.current = 0;

    const frame = (now: number) => {
      const eng = engineRef.current!;
      let dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      if (dt > 0.25) dt = 0.25; // clamp tab-switch spikes
      if (!pausedRef.current && eng.status === 'playing') {
        accRef.current += dt * speedRef.current;
        let steps = 0;
        while (accRef.current >= FIXED && steps < 8) {
          eng.step(FIXED);
          accRef.current -= FIXED;
          steps++;
        }
      }
      const rect = canvas.getBoundingClientRect();
      drawField(ctx, eng, rect.width, rect.height, reducedFx);
      setHud(snapshot(eng));

      if (eng.status !== 'playing' && !finishedRef.current) {
        finishedRef.current = true;
        handleEnd(eng);
        return;
      }
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hud === null ? 'init' : 'ready']);

  const handleEnd = useCallback(
    (eng: BattleEngine) => {
      const stars = eng.status === 'won' ? computeStars(eng.coreHp, eng.coreHpMax) : 0;
      const result: BattleResult = {
        victory: eng.status === 'won',
        coreHpRemaining: Math.round(eng.coreHp),
        coreHpMax: eng.coreHpMax,
        timeSec: eng.timeSec,
        maxCombo: eng.maxCombo,
        stars,
      };
      const { crystalGained } = finishBattle(stageId, result);
      setTimeout(() => {
        nav('/result', { state: { stageId, result, crystalGained } });
      }, 700);
    },
    [finishBattle, nav, stageId],
  );

  const onCell = useCallback((i: number) => {
    const eng = engineRef.current;
    if (!eng || eng.status !== 'playing' || pausedRef.current) return;
    setSelected((prev) => {
      if (prev === null) return i;
      if (prev === i) return null;
      if (areAdjacent(prev, i)) {
        eng.trySwap(prev, i);
        return null;
      }
      return i;
    });
  }, []);

  const onDeploy = useCallback((slot: number) => {
    const eng = engineRef.current;
    if (!eng) return;
    eng.deploy(slot);
  }, []);

  if (!stage || !hud || !engineRef.current) {
    return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }} className="font-mono">LOADING…</div>;
  }
  const engine = engineRef.current;
  const deck = engine.getDeck();

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg,#070b16,#060810 48%,#080a12)' }}>
      {/* TOP HUD */}
      <div style={{ flex: 'none', padding: '20px 14px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="btn" onClick={() => setPaused((p) => !p)} style={{ width: 28, height: 28, fontSize: 12 }}>
          {paused ? '▶' : '⏸'}
        </button>
        <div className="font-disp" style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.05em' }}>
          WAVE <span style={{ color: 'var(--cyan)' }}>{hud.wave + 1}</span>/{hud.totalWaves}
        </div>
        <button
          className="btn"
          onClick={() => setSpeed((s) => (s === 1 ? 2 : 1))}
          style={{ minWidth: 28, height: 28, fontSize: 10, padding: '0 6px' }}
        >
          {speed}×
        </button>
      </div>

      {/* CORE HP */}
      <div style={{ flex: 'none', margin: '2px 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="font-mono" style={{ fontSize: 9, color: 'var(--muted)' }}>CORE</span>
        <div style={{ flex: 1, height: 7, border: '1px solid var(--line2)', borderRadius: 5, overflow: 'hidden', background: '#060810' }}>
          <div
            style={{
              height: '100%',
              width: `${(hud.coreHp / hud.coreHpMax) * 100}%`,
              background: hud.coreHp / hud.coreHpMax < 0.3 ? 'var(--mag)' : 'linear-gradient(90deg,var(--spike),var(--cyan))',
              boxShadow: '0 0 10px var(--cyan)',
              transition: 'width 0.15s linear',
            }}
          />
        </div>
        <span className="font-mono" style={{ fontSize: 9, color: 'var(--muted)' }}>{Math.round((hud.coreHp / hud.coreHpMax) * 100)}%</span>
      </div>

      {/* DEFENSE FIELD (canvas) */}
      <div style={{ flex: 'none', margin: '10px 12px 0', height: 230, border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', position: 'relative', background: 'radial-gradient(100% 60% at 50% 110%,rgba(0,234,255,.10),transparent 60%),#070a13' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        {hud.combo > 1 && (
          <div className="font-disp" style={{ position: 'absolute', top: 8, right: 10, fontSize: 16, fontWeight: 700, color: 'var(--mag)', textShadow: '0 0 12px var(--mag)' }}>
            {hud.combo} COMBO
          </div>
        )}
        {hud.overclockActive > 0 && (
          <div className="font-mono" style={{ position: 'absolute', top: 8, left: 10, fontSize: 10, letterSpacing: '0.2em', color: 'var(--cyan)', textShadow: '0 0 10px var(--cyan)' }}>
            ⚡ OVERCLOCK
          </div>
        )}
      </div>

      {/* ENERGY */}
      <div style={{ flex: 'none', margin: '10px 14px 0', display: 'flex', gap: 6 }}>
        {ATTR_ORDER.map((a) => (
          <div key={a} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ width: '100%', height: 5, borderRadius: 3, background: '#0c0f18', position: 'relative', overflow: 'hidden', border: '1px solid #1a2030' }}>
              <div style={{ position: 'absolute', inset: 0, width: `${hud.energy[a]}%`, background: ATTR_VAR[a], boxShadow: `0 0 8px ${ATTR_VAR[a]}`, borderRadius: 3, transition: 'width 0.15s' }} />
            </div>
            <span className="font-mono" style={{ fontSize: 8, color: 'var(--muted)' }}>{ATTR_GLYPH[a]}</span>
          </div>
        ))}
      </div>

      {/* OVERCLOCK */}
      <div style={{ flex: 'none', margin: '9px 14px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="font-mono" style={{ fontSize: 8, letterSpacing: '0.15em', color: 'var(--muted)' }}>OVERCLOCK</span>
          <span className="font-mono" style={{ fontSize: 8, color: 'var(--muted)' }}>{Math.round(hud.overclock)}%</span>
        </div>
        <div style={{ height: 9, border: '1px solid var(--line2)', borderRadius: 6, overflow: 'hidden', background: '#060810', marginTop: 4 }}>
          <div style={{ height: '100%', width: `${hud.overclock}%`, background: 'linear-gradient(90deg,var(--cyan),var(--mag))', boxShadow: '0 0 12px var(--cyan)', animation: hud.overclock > 90 ? 'pulseGlow 1s infinite' : 'none', transition: 'width 0.15s' }} />
        </div>
      </div>

      {/* DEPLOY BAR */}
      <div style={{ flex: 'none', margin: '10px 14px 0', display: 'flex', gap: 7 }}>
        {deck.map((d) => {
          const cd = hud.cooldowns[d.slot] ?? 0;
          const ready = cd <= 0 && hud.energy[d.attribute] >= d.cost;
          return (
            <button
              key={d.slot}
              onClick={() => onDeploy(d.slot)}
              disabled={!ready}
              style={{
                flex: 1,
                aspectRatio: '1',
                borderRadius: 9,
                border: '1px solid var(--line2)',
                background: 'linear-gradient(180deg,#10141f,#0a0d15)',
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                overflow: 'hidden',
                cursor: ready ? 'pointer' : 'not-allowed',
                opacity: cd > 0 ? 0.45 : 1,
                boxShadow: ready ? '0 0 14px rgba(0,234,255,.25)' : 'none',
                padding: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 40% 35%,${d.color},#070910)`,
                  boxShadow: `0 0 8px ${d.color}`,
                }}
              />
              <span className="font-mono" style={{ position: 'relative', fontSize: 8, color: '#dfe6f2', background: 'rgba(5,6,10,.7)', width: '100%', textAlign: 'center', padding: '2px 0', letterSpacing: '0.06em' }}>
                {cd > 0 ? `${cd.toFixed(0)}s` : `⚡${d.cost}`}
              </span>
            </button>
          );
        })}
      </div>

      {/* GRID */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', marginTop: 9 }}>
        <div style={{ width: '100%' }}>
          <GridView cells={engine.grid} version={hud.gridVersion} selected={selected} onCell={onCell} />
        </div>
      </div>

      {/* PAUSE OVERLAY */}
      {paused && hud.status === 'playing' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(3,4,8,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 100 }}>
          <div className="font-disp glitch" data-t="PAUSED" style={{ fontSize: 34, fontWeight: 700, color: '#f3f6ff' }}>PAUSED</div>
          <button className="btn btn-primary" onClick={() => setPaused(false)} style={{ padding: '12px 28px', fontSize: 13 }}>재개</button>
          <button className="btn btn-mag" onClick={() => nav('/stages')} style={{ padding: '10px 24px', fontSize: 12 }}>출격 포기</button>
        </div>
      )}
    </div>
  );
}

function snapshot(e: BattleEngine): Hud {
  return {
    energy: { ...e.energy },
    coreHp: e.coreHp,
    coreHpMax: e.coreHpMax,
    wave: e.waveIndex,
    totalWaves: e.totalWaves(),
    combo: e.combo,
    overclock: e.overclock,
    overclockActive: e.overclockActive,
    cooldowns: [...e.cooldowns],
    status: e.status,
    gridVersion: e.gridVersion,
  };
}

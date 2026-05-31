import { Modal, GhostFigure, StarRow, AttrBadge, RARITY_COLOR, RARITY_LABEL } from '@/ui/primitives';
import { useGame } from '@/state/store';
import { GHOST_BY_ID } from '@/data/ghosts';
import { ATTR_VAR, ATTR_LABEL, ROLE_LABEL, LEVEL } from '@/data/balance';
import { deriveStats } from '@/game/progression/stats';

export function GhostDetail({ ghostId, onClose }: { ghostId: string; onClose: () => void }) {
  const def = GHOST_BY_ID[ghostId];
  const owned = useGame((s) => s.ownedGhosts[ghostId]);
  const crystal = useGame((s) => s.currencies.crystal);
  const levelUp = useGame((s) => s.levelUpGhost);
  const col = RARITY_COLOR[def.rarity];
  const stats = owned ? deriveStats(def, owned) : null;
  const maxed = owned ? owned.level >= LEVEL.maxLevel : false;

  return (
    <Modal onClose={onClose} style={{ maxWidth: 320 }}>
      <div style={{ display: 'flex', gap: 14 }}>
        <div
          style={{
            width: 96,
            flex: 'none',
            borderRadius: 8,
            background: `radial-gradient(80% 60% at 50% 20%,${ATTR_VAR[def.attribute]}33,transparent 70%),var(--panel2)`,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <GhostFigure color={ATTR_VAR[def.attribute]} width={70} silhouette={!owned} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="font-mono" style={{ fontSize: 9, color: col, letterSpacing: '0.1em' }}>
            {def.rarity} · {RARITY_LABEL[def.rarity]}
          </div>
          <div className="font-disp" style={{ fontSize: 22, fontWeight: 700, color: '#f3f6ff' }}>{def.name}</div>
          <div className="font-mono" style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>{def.codename}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8 }}>
            <AttrBadge attribute={def.attribute} size={22} />
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>{ATTR_LABEL[def.attribute]} · {ROLE_LABEL[def.role]}</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <StarRow count={owned?.stars ?? 0} color={col} size={14} />
          </div>
        </div>
      </div>

      {owned && stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 14 }}>
          <Cell label="LV" value={`${owned.level}`} />
          <Cell label="HP" value={`${stats.hp}`} />
          <Cell label="ATK" value={`${stats.atk}`} />
          <Cell label="전투력" value={`${stats.power}`} accent="var(--cyan)" />
        </div>
      ) : (
        <div className="font-mono" style={{ marginTop: 14, fontSize: 11, color: 'var(--muted)', textAlign: 'center', padding: '10px 0', border: '1px dashed var(--line2)', borderRadius: 6 }}>
          미보유 — 모집에서 획득
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <div className="font-disp" style={{ fontSize: 12, fontWeight: 600, color: col }}>{def.skillName}</div>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.5, marginTop: 4 }}>{def.skill}</div>
        <div style={{ fontSize: 10.5, color: 'var(--dim)', lineHeight: 1.5, marginTop: 6 }}>패시브 · {def.passive}</div>
        <div style={{ fontSize: 10.5, color: 'var(--dim)', fontStyle: 'italic', lineHeight: 1.5, marginTop: 8, borderLeft: '2px solid var(--line2)', paddingLeft: 10 }}>
          {def.lore}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        {owned && (
          <button
            className="btn btn-primary"
            disabled={maxed || crystal < 200}
            onClick={() => levelUp(ghostId)}
            style={{ flex: 1, padding: 11, fontSize: 11 }}
          >
            {maxed ? 'MAX LV' : `레벨업 ◈200`}
          </button>
        )}
        <button className="btn" onClick={onClose} style={{ flex: owned ? 0.6 : 1, padding: 11, fontSize: 11 }}>닫기</button>
      </div>
    </Modal>
  );
}

function Cell({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="panel" style={{ padding: '6px 4px', textAlign: 'center', background: 'var(--panel2)' }}>
      <div className="font-mono" style={{ fontSize: 8, color: 'var(--muted)' }}>{label}</div>
      <div className="font-disp" style={{ fontSize: 14, fontWeight: 700, color: accent ?? '#eef2ff' }}>{value}</div>
    </div>
  );
}

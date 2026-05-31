import { memo } from 'react';
import type { Cell } from '@/game/battle/grid';
import { GRID } from '@/data/balance';
import type { Attribute } from '@/types';

const ATTR_CLASS: Record<Attribute, { from: string; base: string; glow: string }> = {
  FIRE: { from: '#ff7a6e', base: 'var(--fire)', glow: 'rgba(255,59,48,.5)' },
  BLOCK: { from: '#7cc6ff', base: 'var(--block)', glow: 'rgba(31,155,255,.5)' },
  SPIKE: { from: '#9bffc7', base: 'var(--spike)', glow: 'rgba(43,255,136,.5)' },
  SURGE: { from: '#ffe97a', base: 'var(--surge)', glow: 'rgba(255,212,0,.5)' },
  REPAIR: { from: '#d8a8ff', base: 'var(--repair)', glow: 'rgba(177,78,255,.5)' },
};

interface Props {
  cells: Cell[];
  version: number;
  selected: number | null;
  onCell: (index: number) => void;
}

function GridViewImpl({ cells, selected, onCell }: Props) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID.cols},1fr)`,
        gap: 5,
        padding: '0 12px 14px',
        flex: 'none',
      }}
    >
      {cells.map((attr, i) => {
        const c = ATTR_CLASS[attr];
        const isSel = selected === i;
        return (
          <button
            key={i}
            onClick={() => onCell(i)}
            style={{
              aspectRatio: '1',
              borderRadius: 5,
              position: 'relative',
              border: 'none',
              cursor: 'pointer',
              background: `radial-gradient(circle at 34% 28%,${c.from},${c.base})`,
              boxShadow: isSel
                ? `0 0 0 2px #fff, 0 0 14px ${c.glow}`
                : `inset 0 0 0 1px rgba(255,255,255,.06), 0 0 9px ${c.glow}`,
              transform: isSel ? 'scale(1.08)' : 'none',
              transition: 'transform 0.1s, box-shadow 0.1s',
            }}
            aria-label={attr}
          />
        );
      })}
    </div>
  );
}

// Re-render only when the board version, selection, or handler changes.
export const GridView = memo(
  GridViewImpl,
  (a, b) => a.version === b.version && a.selected === b.selected && a.onCell === b.onCell,
);

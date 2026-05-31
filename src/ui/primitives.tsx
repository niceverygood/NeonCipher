// Shared neon-noir UI primitives reused across every screen.
import type { CSSProperties, ReactNode } from 'react';
import type { Attribute, Rarity } from '@/types';
import { ATTR_GLYPH, ATTR_VAR } from '@/data/balance';

export const RARITY_COLOR: Record<Rarity, string> = {
  R: '#8a93a8',
  SR: 'var(--cyan)',
  SSR: 'var(--mag)',
  UR: 'var(--surge)',
};

export const RARITY_LABEL: Record<Rarity, string> = {
  R: 'STABLE',
  SR: 'OPTIMIZED',
  SSR: 'OVERCLOCKED',
  UR: 'SINGULARITY',
};

export function StarRow({ count, color, size = 13 }: { count: number; color: string; size?: number }) {
  return (
    <span style={{ color, letterSpacing: 2, fontSize: size, lineHeight: 1 }}>
      {'★'.repeat(count)}
    </span>
  );
}

export function AttrBadge({ attribute, size = 26 }: { attribute: Attribute; size?: number }) {
  return (
    <span
      className="font-mono"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.42,
        fontWeight: 700,
        color: '#05060a',
        background: ATTR_VAR[attribute],
        boxShadow: `0 0 10px ${ATTR_VAR[attribute]}`,
        flex: 'none',
      }}
    >
      {ATTR_GLYPH[attribute]}
    </span>
  );
}

/**
 * Pure-CSS ghost silhouette. Color follows the attribute neon (rim light).
 * `silhouette` renders the unowned/locked variant (dark + lock).
 */
export function GhostFigure({
  color,
  silhouette = false,
  width = 120,
  glow = true,
}: {
  color: string;
  silhouette?: boolean;
  width?: number;
  glow?: boolean;
}) {
  const h = width * 1.75;
  const figColor = silhouette ? '#1a2030' : color;
  return (
    <div
      style={{
        position: 'relative',
        width,
        height: h,
        color: figColor,
        filter: glow && !silhouette ? 'drop-shadow(0 0 18px currentColor)' : 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: width * 0.9,
          height: h * 0.7,
          borderRadius: '54px 54px 8px 8px',
          background: 'linear-gradient(170deg,currentColor,#070910 78%)',
          clipPath: 'polygon(18% 0,82% 0,100% 100%,0 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '54px 54px 8px 8px',
          mixBlendMode: 'screen',
          opacity: silhouette ? 0 : 0.7,
          background:
            'linear-gradient(110deg,transparent 40%,rgba(255,255,255,.35) 50%,transparent 60%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: h * 0.085,
          left: '50%',
          transform: 'translateX(-50%)',
          width: width * 0.38,
          height: width * 0.38,
          borderRadius: '50% 50% 48% 48%',
          background: 'linear-gradient(160deg,currentColor,#0b0e16)',
        }}
      />
      {silhouette && (
        <div
          style={{
            position: 'absolute',
            top: '42%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            fontFamily: 'var(--mono)',
            fontSize: width * 0.28,
            color: 'var(--dim)',
          }}
        >
          ?
        </div>
      )}
    </div>
  );
}

export function ScreenHeader({
  kicker,
  title,
  accent,
  onBack,
}: {
  kicker: string;
  title: ReactNode;
  accent?: string;
  onBack?: () => void;
}) {
  return (
    <div className="px-5 pt-5 pb-3" style={{ flex: 'none' }}>
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            className="btn"
            onClick={onBack}
            style={{ width: 34, height: 34, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="뒤로"
          >
            ‹
          </button>
        )}
        <div
          className="font-mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.35em',
            color: accent ?? 'var(--cyan)',
            textTransform: 'uppercase',
          }}
        >
          {kicker}
        </div>
      </div>
      <h2 className="font-disp" style={{ fontSize: 30, fontWeight: 700, color: '#f3f6ff', marginTop: 6 }}>
        {title}
      </h2>
    </div>
  );
}

export function Stat({ label, value, color }: { label: string; value: ReactNode; color?: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono" style={{ fontSize: 9, letterSpacing: '0.12em', color: 'var(--muted)' }}>
        {label}
      </span>
      <span className="font-disp" style={{ fontSize: 15, fontWeight: 700, color: color ?? '#eef2ff' }}>
        {value}
      </span>
    </div>
  );
}

export function Bar({ value, max, color, height = 7 }: { value: number; max: number; color: string; height?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      style={{
        flex: 1,
        height,
        border: '1px solid var(--line2)',
        borderRadius: 5,
        overflow: 'hidden',
        background: '#060810',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          boxShadow: `0 0 10px ${color}`,
          transition: 'width 0.2s linear',
        }}
      />
    </div>
  );
}

export function Modal({ children, onClose, style }: { children: ReactNode; onClose?: () => void; style?: CSSProperties }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 200,
        background: 'rgba(3,4,8,0.82)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div className="panel" onClick={(e) => e.stopPropagation()} style={{ padding: 22, width: '100%', maxWidth: 340, ...style }}>
        {children}
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { useMemo } from 'react';

/**
 * Animated neon-noir megacity backdrop. Sits at z-index 0 inside an absolutely
 * positioned layer so it paints behind in-flow screen content without affecting
 * layout. Pure CSS/motion, no assets. Pass `reducedFx` to drop animated layers.
 */
export function CityBackground({ reducedFx = false }: { reducedFx?: boolean }) {
  const buildings = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        x: (i / 14) * 100,
        w: 4 + ((i * 37) % 5),
        h: 30 + ((i * 53) % 45),
        c: i % 3 === 0 ? 'rgba(0,234,255,.5)' : i % 3 === 1 ? 'rgba(255,42,109,.45)' : 'rgba(177,78,255,.4)',
      })),
    [],
  );
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        x: (i * 67) % 100,
        delay: (i * 0.9) % 8,
        dur: 7 + ((i * 13) % 7),
        c: i % 2 === 0 ? 'var(--cyan)' : 'var(--mag)',
        size: 1 + (i % 3),
      })),
    [],
  );

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        background:
          'radial-gradient(120% 70% at 50% -10%,#0c1530,#05060a 55%),radial-gradient(80% 50% at 50% 120%,rgba(0,234,255,.10),transparent 60%)',
      }}
    >
      {/* circuit grid floor */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.1,
          backgroundImage:
            'linear-gradient(rgba(0,234,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(0,234,255,.5) 1px,transparent 1px)',
          backgroundSize: '30px 30px',
          WebkitMaskImage: 'radial-gradient(90% 70% at 50% 100%,#000,transparent)',
          maskImage: 'radial-gradient(90% 70% at 50% 100%,#000,transparent)',
        }}
      />

      {/* skyline silhouette */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' }}>
        {buildings.map((b, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: 0,
              left: `${b.x}%`,
              width: `${b.w}%`,
              height: `${b.h}%`,
              background: 'linear-gradient(180deg,#0a0e1a,#070910)',
              borderTop: `2px solid ${b.c}`,
              boxShadow: `0 0 14px ${b.c}`,
              opacity: 0.55,
            }}
          />
        ))}
      </div>

      {!reducedFx && (
        <>
          {/* drifting vertical ad streaks */}
          {[16, 38, 63, 84].map((x, i) => (
            <motion.div
              key={x}
              initial={{ opacity: 0.2 }}
              animate={{ opacity: [0.2, 0.7, 0.2] }}
              transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 }}
              style={{
                position: 'absolute',
                top: 0,
                bottom: '20%',
                left: `${x}%`,
                width: 2,
                background: i % 2 === 0 ? 'var(--cyan)' : 'var(--mag)',
                filter: 'blur(2px)',
                WebkitMaskImage: 'linear-gradient(0deg,#000,transparent 70%)',
                maskImage: 'linear-gradient(0deg,#000,transparent 70%)',
              }}
            />
          ))}

          {/* rising data particles */}
          {particles.map((p, i) => (
            <motion.div
              key={i}
              initial={{ y: '110%', opacity: 0 }}
              animate={{ y: '-10%', opacity: [0, 1, 0] }}
              transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'linear' }}
              style={{
                position: 'absolute',
                left: `${p.x}%`,
                width: p.size,
                height: p.size + 4,
                borderRadius: 2,
                background: p.c,
                boxShadow: `0 0 6px ${p.c}`,
              }}
            />
          ))}

          {/* slow horizontal scan beam */}
          <motion.div
            initial={{ top: '-10%' }}
            animate={{ top: '110%' }}
            transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 60,
              background: 'linear-gradient(180deg,transparent,rgba(0,234,255,.06),transparent)',
            }}
          />
        </>
      )}
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Screen } from '@/ui/Screen';

export default function Splash() {
  const nav = useNavigate();

  return (
    <Screen>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(120% 70% at 50% 8%,#0c1530,#05060a 60%)',
        }}
      />
      {/* city light streaks */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.8,
          background:
            'linear-gradient(90deg,transparent 14%,rgba(255,42,109,.5) 15% 15.6%,transparent 16%),linear-gradient(90deg,transparent 34%,rgba(0,234,255,.55) 35% 35.6%,transparent 36%),linear-gradient(90deg,transparent 62%,rgba(177,78,255,.5) 63% 63.6%,transparent 64%),linear-gradient(90deg,transparent 82%,rgba(0,234,255,.45) 83% 83.6%,transparent 84%)',
          filter: 'blur(3px)',
          WebkitMaskImage: 'linear-gradient(0deg,#000,transparent 55%)',
          maskImage: 'linear-gradient(0deg,#000,transparent 55%)',
        }}
      />
      {/* circuit grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.1,
          backgroundImage:
            'linear-gradient(rgba(0,234,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(0,234,255,.5) 1px,transparent 1px)',
          backgroundSize: '26px 26px',
          WebkitMaskImage: 'radial-gradient(90% 70% at 50% 100%,#000,transparent)',
          maskImage: 'radial-gradient(90% 70% at 50% 100%,#000,transparent)',
        }}
      />

      <div
        className="font-mono"
        style={{
          position: 'relative',
          padding: '30px 22px 0',
          fontSize: 9,
          letterSpacing: '0.2em',
          color: 'var(--muted)',
          textTransform: 'uppercase',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>NEXUS // ONLINE</span>
        <span>PING 12ms</span>
      </div>

      <div
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="font-disp"
          style={{ fontSize: 'clamp(46px,16vw,64px)', lineHeight: 0.84, textAlign: 'center', fontWeight: 700 }}
        >
          <span className="logo-n glitch" data-t="NEON">
            NEON
          </span>
          <br />
          <span className="logo-c glitch" data-t="CIPHER">
            CIPHER
          </span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="font-mono"
          style={{ fontSize: 9, letterSpacing: '0.4em', color: 'var(--cyan)', textTransform: 'uppercase', marginTop: 12 }}
        >
          Decrypt · Defend · Survive
        </motion.div>
      </div>

      <div
        style={{
          position: 'relative',
          padding: '0 26px 48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <button
          className="font-mono"
          onClick={() => nav('/lobby')}
          style={{
            fontSize: 12,
            letterSpacing: '0.35em',
            color: '#dfe6f2',
            textTransform: 'uppercase',
            border: '1px solid var(--cyan)',
            borderRadius: 4,
            padding: '14px 32px',
            background: 'transparent',
            cursor: 'pointer',
            boxShadow: '0 0 22px rgba(0,234,255,.25)',
            animation: 'blink 2.4s infinite',
          }}
        >
          TAP TO CONNECT
        </button>
        <div className="font-mono" style={{ fontSize: 8, letterSpacing: '0.2em', color: 'var(--dim)' }}>
          v1.0.0 · BUILD 2026 · BOTTLE INC.
        </div>
      </div>
    </Screen>
  );
}

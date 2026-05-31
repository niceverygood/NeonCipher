import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Splash from '@/app/Splash';
import Lobby from '@/app/Lobby';
import StageSelect from '@/app/StageSelect';
import Battle from '@/app/Battle';
import Result from '@/app/Result';
import Gacha from '@/app/Gacha';
import Codex from '@/app/Codex';
import Team from '@/app/Team';
import Settings from '@/app/Settings';
import Missions from '@/app/Missions';
import { useGame } from '@/state/store';
import { sfx } from '@/audio/sfx';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Splash />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/stages" element={<StageSelect />} />
        <Route path="/battle/:stageId" element={<Battle />} />
        <Route path="/result" element={<Result />} />
        <Route path="/gacha" element={<Gacha />} />
        <Route path="/codex" element={<Codex />} />
        <Route path="/team" element={<Team />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/missions" element={<Missions />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const muted = useGame((s) => s.settings.muted);

  // Keep the synth's mute state in sync with the store.
  useEffect(() => {
    sfx.setMuted(muted);
  }, [muted]);

  // Unlock/resume audio on the first user gesture (browser autoplay policy).
  useEffect(() => {
    const unlock = () => {
      sfx.ensure();
      sfx.setMuted(useGame.getState().settings.muted);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  return (
    <div className="app-shell">
      <div className="device">
        <div className="screen scanlines">
          <HashRouter>
            <AnimatedRoutes />
          </HashRouter>
        </div>
      </div>
    </div>
  );
}

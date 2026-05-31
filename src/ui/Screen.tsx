import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/** Full-screen page wrapper with a consistent enter/exit transition. */
export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
      style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

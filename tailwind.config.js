/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        panel: 'var(--panel)',
        panel2: 'var(--panel2)',
        line: 'var(--line)',
        line2: 'var(--line2)',
        cyan: 'var(--cyan)',
        mag: 'var(--mag)',
        txt: 'var(--txt)',
        muted: 'var(--muted)',
        dim: 'var(--dim)',
        fire: 'var(--fire)',
        block: 'var(--block)',
        spike: 'var(--spike)',
        surge: 'var(--surge)',
        repair: 'var(--repair)',
      },
      fontFamily: {
        disp: ['Chakra Petch', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
        kr: ['Noto Sans KR', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

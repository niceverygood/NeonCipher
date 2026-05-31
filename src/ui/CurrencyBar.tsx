import { useGame } from '@/state/store';

function Pill({ icon, value, color }: { icon: string; value: number; color: string }) {
  return (
    <div
      className="font-mono panel"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 10px',
        fontSize: 11,
        color: 'var(--txt)',
        borderColor: 'var(--line2)',
      }}
    >
      <span style={{ color, fontSize: 12 }}>{icon}</span>
      {value.toLocaleString()}
    </div>
  );
}

export function CurrencyBar() {
  const currencies = useGame((s) => s.currencies);
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Pill icon="◈" value={currencies.crystal} color="var(--cyan)" />
      <Pill icon="❖" value={currencies.cube} color="var(--mag)" />
    </div>
  );
}

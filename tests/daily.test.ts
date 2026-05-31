import { describe, it, expect } from 'vitest';
import { DAILY_CALENDAR } from '@/state/store';

describe('daily login calendar', () => {
  it('has 7 escalating days', () => {
    expect(DAILY_CALENDAR).toHaveLength(7);
    // crystal reward should be non-decreasing across the week
    for (let i = 1; i < DAILY_CALENDAR.length; i++) {
      expect(DAILY_CALENDAR[i].crystal).toBeGreaterThanOrEqual(DAILY_CALENDAR[i - 1].crystal);
    }
  });

  it('day 7 is the jackpot with a 10-pull ticket', () => {
    const day7 = DAILY_CALENDAR[6];
    expect(day7.ticketTen).toBeGreaterThanOrEqual(1);
    expect(day7.crystal).toBe(Math.max(...DAILY_CALENDAR.map((d) => d.crystal)));
  });
});

// ============================================================================
// Global persisted store (Zustand + persist). Single source of save state.
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BattleResult, OwnedGhost, SaveState } from '@/types';
import { GHOST_BY_ID, GHOSTS } from '@/data/ghosts';
import { GACHA, LEVEL } from '@/data/balance';
import { pullOnce, pullTen, type PullResult, type Rng } from '@/game/gacha/gacha';
import { addExp, starsForDupes } from '@/game/progression/stats';
import { STAGE_BY_ID } from '@/data/waves';

const SAVE_VERSION = 1;

export type PullCurrency = 'cube' | 'crystal' | 'ticketSingle' | 'ticketTen';

function starterSave(): Omit<SaveState, 'settings'> & { settings: SaveState['settings'] } {
  const owned: Record<string, OwnedGhost> = {};
  // Starter roster so the first battle is playable immediately.
  const starters = ['g_jolt', 'g_patch', 'g_warden', 'g_ember', 'g_medic'];
  for (const id of starters) {
    owned[id] = { id, level: 1, stars: 1, dupes: 0 };
  }
  return {
    version: SAVE_VERSION,
    ownedGhosts: owned,
    currencies: { crystal: 3200, cube: 1600, ticketSingle: 2, ticketTen: 1 },
    gacha: { pity: 0, guaranteed: false, totalPulls: 0 },
    clearedStages: [],
    deck: ['g_warden', 'g_ember', 'g_jolt', 'g_medic', 'g_patch'],
    settings: { muted: true, reducedFx: false },
  };
}

interface StoreState extends SaveState {
  // ---- gacha ----
  pull: (count: 1 | 10, currency: PullCurrency, rng?: Rng) => PullResult[];
  // ---- currency ----
  grantCubes: (n: number) => void;
  addCrystal: (n: number) => void;
  // ---- progression ----
  levelUpGhost: (ghostId: string) => boolean;
  // ---- deck ----
  setDeckSlot: (index: number, ghostId: string | null) => void;
  // ---- battle ----
  finishBattle: (stageId: string, result: BattleResult) => { crystalGained: number };
  // ---- settings / misc ----
  toggleMute: () => void;
  setReducedFx: (v: boolean) => void;
  resetData: () => void;
}

function applyResult(owned: Record<string, OwnedGhost>, r: PullResult): PullResult {
  const existing = owned[r.ghostId];
  if (!existing) {
    owned[r.ghostId] = { id: r.ghostId, level: 1, stars: 1, dupes: 0 };
    return { ...r, isNew: true };
  }
  const dupes = existing.dupes + 1;
  owned[r.ghostId] = { ...existing, dupes, stars: starsForDupes(dupes) };
  return { ...r, isNew: false };
}

const LEVELUP_COST = 200; // crystal per level

export const useGame = create<StoreState>()(
  persist(
    (set, get) => ({
      ...starterSave(),

      pull: (count, currency, rng = Math.random) => {
        const state = get();
        // Cost check / deduction.
        const cur = { ...state.currencies };
        if (currency === 'ticketSingle') {
          if (count !== 1 || cur.ticketSingle < 1) return [];
          cur.ticketSingle -= 1;
        } else if (currency === 'ticketTen') {
          if (count !== 10 || cur.ticketTen < 1) return [];
          cur.ticketTen -= 1;
        } else if (currency === 'cube') {
          const cost = count === 1 ? GACHA.costSingleCube : GACHA.costTenCube;
          if (cur.cube < cost) return [];
          cur.cube -= cost;
        } else {
          const cost = count === 1 ? GACHA.costSingleCrystal : GACHA.costTenCrystal;
          if (cur.crystal < cost) return [];
          cur.crystal -= cost;
        }

        const gachaState = { ...state.gacha };
        const owned = { ...state.ownedGhosts };
        const raw = count === 1 ? [pullOnce(gachaState, rng)] : pullTen(gachaState, rng);
        const applied = raw.map((r) => applyResult(owned, r));

        set({ currencies: cur, gacha: gachaState, ownedGhosts: owned });
        return applied;
      },

      grantCubes: (n) =>
        set((s) => ({ currencies: { ...s.currencies, cube: s.currencies.cube + n } })),

      addCrystal: (n) =>
        set((s) => ({ currencies: { ...s.currencies, crystal: s.currencies.crystal + n } })),

      levelUpGhost: (ghostId) => {
        const s = get();
        const owned = s.ownedGhosts[ghostId];
        if (!owned) return false;
        if (owned.level >= LEVEL.maxLevel) return false;
        if (s.currencies.crystal < LEVELUP_COST) return false;
        const next = addExp(owned, owned.level * LEVEL.expPerLevel); // exactly one level
        set({
          ownedGhosts: { ...s.ownedGhosts, [ghostId]: next },
          currencies: { ...s.currencies, crystal: s.currencies.crystal - LEVELUP_COST },
        });
        return true;
      },

      setDeckSlot: (index, ghostId) =>
        set((s) => {
          const deck = [...s.deck];
          // Prevent the same ghost in two slots.
          if (ghostId) {
            const dup = deck.indexOf(ghostId);
            if (dup >= 0 && dup !== index) deck[dup] = null;
          }
          deck[index] = ghostId;
          return { deck };
        }),

      finishBattle: (stageId, result) => {
        const s = get();
        const stage = STAGE_BY_ID[stageId];
        if (!stage) return { crystalGained: 0 };
        const crystalGained = result.victory
          ? Math.round(stage.rewardCrystal * (1 + result.stars * 0.25))
          : Math.round(stage.rewardCrystal * 0.2);

        const cleared = new Set(s.clearedStages);
        if (result.victory) cleared.add(stageId);

        // Distribute exp to deck members.
        const owned = { ...s.ownedGhosts };
        if (result.victory) {
          const members = s.deck.filter((id): id is string => !!id);
          const per = Math.round(stage.rewardExp / Math.max(1, members.length));
          for (const id of members) {
            if (owned[id]) owned[id] = addExp(owned[id], per);
          }
        }

        set({
          currencies: { ...s.currencies, crystal: s.currencies.crystal + crystalGained },
          clearedStages: [...cleared],
          ownedGhosts: owned,
        });
        return { crystalGained };
      },

      toggleMute: () => set((s) => ({ settings: { ...s.settings, muted: !s.settings.muted } })),
      setReducedFx: (v) => set((s) => ({ settings: { ...s.settings, reducedFx: v } })),
      resetData: () => set({ ...starterSave() }),
    }),
    {
      name: 'neon-cipher-save',
      version: SAVE_VERSION,
      // Persist only the SaveState slice (not the action functions).
      partialize: (s): SaveState => ({
        version: s.version,
        ownedGhosts: s.ownedGhosts,
        currencies: s.currencies,
        gacha: s.gacha,
        clearedStages: s.clearedStages,
        deck: s.deck,
        settings: s.settings,
      }),
      migrate: (persisted, version) => {
        // Defensive: if the shape is broken or from an older version, reset.
        if (!persisted || version !== SAVE_VERSION) {
          return { ...starterSave() } as unknown as StoreState;
        }
        return persisted as StoreState;
      },
      merge: (persisted, current) => {
        const p = persisted as Partial<SaveState> | undefined;
        if (!p || !p.ownedGhosts || !p.currencies) return current;
        // Drop unknown ghost ids that no longer exist in the roster.
        const owned: Record<string, OwnedGhost> = {};
        for (const [id, g] of Object.entries(p.ownedGhosts)) {
          if (GHOST_BY_ID[id]) owned[id] = g as OwnedGhost;
        }
        const deck = (p.deck ?? current.deck).map((id) => (id && GHOST_BY_ID[id] ? id : null));
        return {
          ...current,
          ...p,
          ownedGhosts: owned,
          deck,
        } as StoreState;
      },
    },
  ),
);

// Convenience selectors (used across screens).
export function ownedList(s: StoreState): OwnedGhost[] {
  return GHOSTS.filter((g) => s.ownedGhosts[g.id]).map((g) => s.ownedGhosts[g.id]);
}

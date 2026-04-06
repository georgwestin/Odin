"use client";

import { create } from "zustand";

export interface BetSelection {
  id: string;
  eventId: string;
  eventName: string;
  marketName: string;
  selectionName: string;
  odds: number;
}

type BetType = "single" | "accumulator";

interface BetSlipState {
  selections: BetSelection[];
  stakes: Record<string, number>;
  accumulatorStake: number;
  betType: BetType;
  isOpen: boolean;
  isPlacing: boolean;

  addSelection: (selection: BetSelection) => void;
  removeSelection: (selectionId: string) => void;
  clearSelections: () => void;
  setStake: (selectionId: string, stake: number) => void;
  setAccumulatorStake: (stake: number) => void;
  setBetType: (type: BetType) => void;
  toggleOpen: () => void;
  setIsPlacing: (placing: boolean) => void;
  updateOdds: (selectionId: string, newOdds: number) => void;

  getTotalStake: () => number;
  getAccumulatorOdds: () => number;
  getPotentialWinnings: () => number;
  getSelectionCount: () => number;
}

export const useBetSlip = create<BetSlipState>((set, get) => ({
  selections: [],
  stakes: {},
  accumulatorStake: 0,
  betType: "single",
  isOpen: false,
  isPlacing: false,

  addSelection: (selection: BetSelection) => {
    const { selections } = get();
    const exists = selections.find((s) => s.id === selection.id);
    if (exists) return;

    const sameEvent = selections.find((s) => s.eventId === selection.eventId);
    let updated: BetSelection[];
    if (sameEvent) {
      updated = selections.map((s) =>
        s.eventId === selection.eventId ? selection : s
      );
    } else {
      updated = [...selections, selection];
    }

    set({ selections: updated, isOpen: true });
  },

  removeSelection: (selectionId: string) => {
    const { selections, stakes } = get();
    const updated = selections.filter((s) => s.id !== selectionId);
    const newStakes = { ...stakes };
    delete newStakes[selectionId];
    set({
      selections: updated,
      stakes: newStakes,
      isOpen: updated.length > 0,
    });
  },

  clearSelections: () => {
    set({ selections: [], stakes: {}, accumulatorStake: 0 });
  },

  setStake: (selectionId: string, stake: number) => {
    set((state) => ({
      stakes: { ...state.stakes, [selectionId]: stake },
    }));
  },

  setAccumulatorStake: (stake: number) => {
    set({ accumulatorStake: stake });
  },

  setBetType: (type: BetType) => {
    set({ betType: type });
  },

  toggleOpen: () => {
    set((state) => ({ isOpen: !state.isOpen }));
  },

  setIsPlacing: (placing: boolean) => {
    set({ isPlacing: placing });
  },

  updateOdds: (selectionId: string, newOdds: number) => {
    set((state) => ({
      selections: state.selections.map((s) =>
        s.id === selectionId ? { ...s, odds: newOdds } : s
      ),
    }));
  },

  getTotalStake: () => {
    const { betType, stakes, accumulatorStake, selections } = get();
    if (betType === "accumulator") return accumulatorStake;
    return selections.reduce((sum, s) => sum + (stakes[s.id] || 0), 0);
  },

  getAccumulatorOdds: () => {
    const { selections } = get();
    if (selections.length === 0) return 0;
    return selections.reduce((acc, s) => acc * s.odds, 1);
  },

  getPotentialWinnings: () => {
    const { betType, selections, stakes, accumulatorStake } = get();
    if (betType === "accumulator") {
      const combinedOdds = selections.reduce((acc, s) => acc * s.odds, 1);
      return accumulatorStake * combinedOdds;
    }
    return selections.reduce((sum, s) => {
      const stake = stakes[s.id] || 0;
      return sum + stake * s.odds;
    }, 0);
  },

  getSelectionCount: () => get().selections.length,
}));

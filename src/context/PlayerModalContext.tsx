"use client";

import { createContext, ReactNode, useCallback, useContext, useState } from "react";

interface PlayerModalContextValue {
  playerId: string | null;
  openPlayer: (playerId: string) => void;
  closePlayerModal: () => void;
}

const PlayerModalContext = createContext<PlayerModalContextValue | null>(null);

/**
 * Tracks which player's detail modal is open as a single shared value, instead of each
 * caller (match row, feed, HCP list, MVP list, etc.) keeping its own local state and
 * nesting a fresh modal on top of the last one. Hopping from one player to another via
 * an opponent/partner link just swaps this value in place, so the × always closes the
 * whole chain in one step and returns to whatever was open before it started — never
 * just one level up.
 */
export function PlayerModalProvider({ children }: { children: ReactNode }) {
  const [playerId, setPlayerId] = useState<string | null>(null);

  const openPlayer = useCallback((id: string) => setPlayerId(id), []);
  const closePlayerModal = useCallback(() => setPlayerId(null), []);

  return (
    <PlayerModalContext.Provider value={{ playerId, openPlayer, closePlayerModal }}>
      {children}
    </PlayerModalContext.Provider>
  );
}

export function usePlayerModal() {
  const ctx = useContext(PlayerModalContext);
  if (!ctx) throw new Error("usePlayerModal must be used within a PlayerModalProvider");
  return ctx;
}

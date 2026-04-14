// PantryContext — global store for the user's pantry ingredients.
// Components across the app can read pantryItems and modify them via the
// addItem / removeItem / clearPantry helpers exposed by usePantry().

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PantryContextValue {
  pantryItems: string[];
  addItem: (name: string) => void;
  removeItem: (name: string) => void;
  clearPantry: () => void;
  // Whether the match badge is shown on recipe cards in the Discover tab
  matchBadgeEnabled: boolean;
  toggleMatchBadge: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const PantryContext = createContext<PantryContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PantryProvider({ children }: { children: ReactNode }) {
  const [pantryItems, setPantryItems] = useState<string[]>([]);
  const [matchBadgeEnabled, setMatchBadgeEnabled] = useState(false);

  const addItem = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setPantryItems((prev) => {
      // Ignore duplicates (case-insensitive) so the same ingredient can't be added twice
      if (prev.some((item) => item.toLowerCase() === trimmed.toLowerCase())) return prev;
      return [...prev, trimmed];
    });
  };

  const removeItem = (name: string) => {
    setPantryItems((prev) => prev.filter((item) => item !== name));
  };

  const clearPantry = () => setPantryItems([]);

  const toggleMatchBadge = () => setMatchBadgeEnabled((v) => !v);

  return (
    <PantryContext.Provider
      value={{ pantryItems, addItem, removeItem, clearPantry, matchBadgeEnabled, toggleMatchBadge }}
    >
      {children}
    </PantryContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePantry(): PantryContextValue {
  const ctx = useContext(PantryContext);
  if (!ctx) throw new Error('usePantry must be used inside PantryProvider');
  return ctx;
}

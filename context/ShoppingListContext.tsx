// ShoppingListContext — global store for the user's shopping list.
// Each item tracks its clean display name, checked state, shopping category,
// and which recipe added it (if any).
//
// addItems() strips quantities/units from recipe ingredient strings, assigns a
// category, deduplicates against the current list, and returns the count of
// items actually added so the caller can show a confirmation toast.

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import {
  extractIngredientName,
  detectCategory,
  ingredientMatches,
} from '@/utils/ingredientUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShoppingListItem {
  id: string;
  name: string;         // clean display name, e.g. "Chicken breast"
  checked: boolean;
  category: string;     // shopping category, e.g. "Meat & Fish", "Fresh Produce"
  recipeId?: string;    // which recipe contributed this item (if any)
  recipeName?: string;  // display name for the recipe attribution badge
}

interface ShoppingListContextValue {
  shoppingList: ShoppingListItem[];
  // Bulk-add items from a recipe. Strips quantities/units from each name,
  // assigns a category, and skips duplicates. Returns count added.
  addItems: (
    items: Array<{ name: string; recipeId?: string; recipeName?: string }>,
  ) => number;
  // Add a single item typed manually by the user.
  addManualItem: (name: string) => void;
  toggleItem: (id: string) => void;
  removeItem: (id: string) => void;
  // Remove all checked items from the list.
  clearChecked: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ShoppingListContext = createContext<ShoppingListContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ShoppingListProvider({ children }: { children: ReactNode }) {
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);

  const addItems = (
    items: Array<{ name: string; recipeId?: string; recipeName?: string }>,
  ): number => {
    // Deduplicate against the current list using normalised matching so that
    // "400g spaghetti" won't re-add a "Spaghetti" already on the list.
    const toAdd = items.filter(
      (item) => !shoppingList.some((s) => ingredientMatches(item.name, s.name)),
    );
    if (toAdd.length === 0) return 0;

    const newItems: ShoppingListItem[] = toAdd.map((item, i) => ({
      id: `${Date.now()}-${i}-${Math.random()}`,
      // Strip "400g", "2 tbsp" etc. and depluralize for a clean display name
      name: extractIngredientName(item.name),
      checked: false,
      category: detectCategory(item.name),
      recipeId: item.recipeId,
      recipeName: item.recipeName,
    }));

    setShoppingList((prev) => [...prev, ...newItems]);
    return toAdd.length;
  };

  const addManualItem = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    // Ignore duplicates using the same normalised match used for recipe items
    if (shoppingList.some((s) => ingredientMatches(trimmed, s.name))) return;
    setShoppingList((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        // Sentence-case the manually typed name
        name: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
        checked: false,
        category: detectCategory(trimmed),
      },
    ]);
  };

  const toggleItem = (id: string) => {
    setShoppingList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );
  };

  const removeItem = (id: string) => {
    setShoppingList((prev) => prev.filter((item) => item.id !== id));
  };

  const clearChecked = () => {
    setShoppingList((prev) => prev.filter((item) => !item.checked));
  };

  return (
    <ShoppingListContext.Provider
      value={{ shoppingList, addItems, addManualItem, toggleItem, removeItem, clearChecked }}
    >
      {children}
    </ShoppingListContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useShoppingList(): ShoppingListContextValue {
  const ctx = useContext(ShoppingListContext);
  if (!ctx) throw new Error('useShoppingList must be used inside ShoppingListProvider');
  return ctx;
}

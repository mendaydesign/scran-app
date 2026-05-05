// ShoppingListContext — manages multiple named shopping lists.
//
// Each ShoppingListGroup has a name (e.g. "Weekly Shop") and contains
// ShoppingListItems. Items track their clean display name, checked state,
// shopping category, and which recipe contributed them.
//
// addItemsToList() strips quantities/units, assigns a category, deduplicates
// within the target list, and returns the count added for toast feedback.

import { createContext, useContext, useState, useMemo } from 'react';
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
  category: string;     // e.g. "Meat & Fish", "Fresh Produce"
  recipeId?: string;
  recipeName?: string;
}

export interface ShoppingListGroup {
  id: string;
  name: string;
  createdAt: number;
  items: ShoppingListItem[];
}

interface ShoppingListContextValue {
  lists: ShoppingListGroup[];
  totalUncheckedCount: number;
  // Create a new named list. Returns the new list's id.
  createList: (name: string) => string;
  deleteList: (listId: string) => void;
  // Bulk-add recipe ingredients to a specific list. Returns count added.
  addItemsToList: (
    items: Array<{ name: string; recipeId?: string; recipeName?: string }>,
    listId: string,
  ) => number;
  // Add a single manually typed item to a specific list.
  addManualItemToList: (name: string, listId: string) => void;
  renameList: (listId: string, name: string) => void;
  toggleItem: (listId: string, itemId: string) => void;
  removeItem: (listId: string, itemId: string) => void;
  clearChecked: (listId: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ShoppingListContext = createContext<ShoppingListContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ShoppingListProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<ShoppingListGroup[]>([]);

  // Total unchecked items across all lists — used by the pantry tab badge.
  const totalUncheckedCount = useMemo(
    () => lists.reduce((sum, list) => sum + list.items.filter((i) => !i.checked).length, 0),
    [lists],
  );

  const createList = (name: string): string => {
    const id = `list-${Date.now()}-${Math.random()}`;
    setLists((prev) => [
      ...prev,
      { id, name: name.trim() || 'New list', createdAt: Date.now(), items: [] },
    ]);
    return id;
  };

  const deleteList = (listId: string) => {
    setLists((prev) => prev.filter((l) => l.id !== listId));
  };

  const addItemsToList = (
    items: Array<{ name: string; recipeId?: string; recipeName?: string }>,
    listId: string,
  ): number => {
    let added = 0;
    setLists((prev) =>
      prev.map((list) => {
        if (list.id !== listId) return list;
        const toAdd = items.filter(
          (item) => !list.items.some((s) => ingredientMatches(item.name, s.name)),
        );
        added = toAdd.length;
        if (toAdd.length === 0) return list;
        const newItems: ShoppingListItem[] = toAdd.map((item, i) => ({
          id: `${Date.now()}-${i}-${Math.random()}`,
          name: extractIngredientName(item.name),
          checked: false,
          category: detectCategory(item.name),
          recipeId: item.recipeId,
          recipeName: item.recipeName,
        }));
        return { ...list, items: [...list.items, ...newItems] };
      }),
    );
    return added;
  };

  const addManualItemToList = (name: string, listId: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLists((prev) =>
      prev.map((list) => {
        if (list.id !== listId) return list;
        if (list.items.some((s) => ingredientMatches(trimmed, s.name))) return list;
        const newItem: ShoppingListItem = {
          id: `${Date.now()}-${Math.random()}`,
          name: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
          checked: false,
          category: detectCategory(trimmed),
        };
        return { ...list, items: [...list.items, newItem] };
      }),
    );
  };

  const toggleItem = (listId: string, itemId: string) => {
    setLists((prev) =>
      prev.map((list) =>
        list.id !== listId
          ? list
          : {
              ...list,
              items: list.items.map((item) =>
                item.id === itemId ? { ...item, checked: !item.checked } : item,
              ),
            },
      ),
    );
  };

  const removeItem = (listId: string, itemId: string) => {
    setLists((prev) =>
      prev.map((list) =>
        list.id !== listId
          ? list
          : { ...list, items: list.items.filter((item) => item.id !== itemId) },
      ),
    );
  };

  const clearChecked = (listId: string) => {
    setLists((prev) =>
      prev.map((list) =>
        list.id !== listId
          ? list
          : { ...list, items: list.items.filter((item) => !item.checked) },
      ),
    );
  };

  const renameList = (listId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLists((prev) =>
      prev.map((list) =>
        list.id !== listId ? list : { ...list, name: trimmed },
      ),
    );
  };

  return (
    <ShoppingListContext.Provider
      value={{
        lists,
        totalUncheckedCount,
        createList,
        deleteList,
        addItemsToList,
        addManualItemToList,
        renameList,
        toggleItem,
        removeItem,
        clearChecked,
      }}
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

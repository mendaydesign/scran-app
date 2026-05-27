// ShoppingListContext — persists shopping lists and items to Supabase.
// Optimistic updates keep the UI instant; Supabase writes happen in the background.

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';

import { supabase } from '@/lib/supabase';
import { getDeviceId } from '@/lib/deviceId';
import {
  extractIngredientName,
  detectCategory,
  ingredientMatches,
} from '@/utils/ingredientUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShoppingListItem {
  id: string;
  name: string;
  checked: boolean;
  category: string;
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
  createList:          (name: string) => string;
  deleteList:          (listId: string) => void;
  addItemsToList:      (items: Array<{ name: string; recipeId?: string; recipeName?: string }>, listId: string) => number;
  addManualItemToList: (name: string, listId: string) => void;
  renameList:          (listId: string, name: string) => void;
  toggleItem:          (listId: string, itemId: string) => void;
  removeItem:          (listId: string, itemId: string) => void;
  clearChecked:        (listId: string) => void;
  uncheckAll:          (listId: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ShoppingListContext = createContext<ShoppingListContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ShoppingListProvider({ children }: { children: ReactNode }) {
  const [lists,    setLists]    = useState<ShoppingListGroup[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const totalUncheckedCount = useMemo(
    () => lists.reduce((sum, list) => sum + list.items.filter((i) => !i.checked).length, 0),
    [lists],
  );

  // On mount: load all lists + items for this device
  useEffect(() => {
    async function init() {
      const id = await getDeviceId();
      setDeviceId(id);

      // Fetch lists
      const { data: listRows } = await supabase
        .from('shopping_lists')
        .select('id, name, created_at')
        .eq('user_id', id)
        .order('created_at');

      if (!listRows || listRows.length === 0) return;

      // Fetch all items for those lists in one query
      const listIds = listRows.map((l) => l.id);
      const { data: itemRows } = await supabase
        .from('shopping_list_items')
        .select('*')
        .in('list_id', listIds)
        .order('created_at');

      // Reconstruct the in-memory structure
      const reconstructed: ShoppingListGroup[] = listRows.map((l) => ({
        id:        l.id as string,
        name:      l.name as string,
        createdAt: new Date(l.created_at as string).getTime(),
        items: (itemRows ?? [])
          .filter((item) => item.list_id === l.id)
          .map((item) => ({
            id:         item.id as string,
            name:       item.name as string,
            checked:    item.checked as boolean,
            category:   (item.category as string) ?? '',
            recipeId:   (item.recipe_id as string) ?? undefined,
            recipeName: (item.recipe_name as string) ?? undefined,
          })),
      }));

      setLists(reconstructed);
    }
    init();
  }, []);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createList = (name: string): string => {
    const id = `list-${Date.now()}-${Math.random()}`;
    const trimmedName = name.trim() || 'New list';
    // Optimistic
    setLists((prev) => [...prev, { id, name: trimmedName, createdAt: Date.now(), items: [] }]);
    // Persist
    if (deviceId) {
      supabase.from('shopping_lists')
        .insert({ id, user_id: deviceId, name: trimmedName })
        .then(({ error }) => { if (error) console.warn('[ShoppingList] createList error', error); });
    }
    return id;
  };

  const deleteList = (listId: string) => {
    // Optimistic
    setLists((prev) => prev.filter((l) => l.id !== listId));
    // Persist — cascade deletes items automatically
    supabase.from('shopping_lists').delete().eq('id', listId)
      .then(({ error }) => { if (error) console.warn('[ShoppingList] deleteList error', error); });
  };

  const addItemsToList = (
    items: Array<{ name: string; recipeId?: string; recipeName?: string }>,
    listId: string,
  ): number => {
    let added = 0;
    let newItems: ShoppingListItem[] = [];

    setLists((prev) =>
      prev.map((list) => {
        if (list.id !== listId) return list;
        const toAdd = items.filter(
          (item) => !list.items.some((s) => ingredientMatches(item.name, s.name)),
        );
        added = toAdd.length;
        if (toAdd.length === 0) return list;
        newItems = toAdd.map((item, i) => ({
          id:         `${Date.now()}-${i}-${Math.random()}`,
          name:       extractIngredientName(item.name),
          checked:    false,
          category:   detectCategory(item.name),
          recipeId:   item.recipeId,
          recipeName: item.recipeName,
        }));
        return { ...list, items: [...list.items, ...newItems] };
      }),
    );

    // Persist new items
    if (newItems.length > 0) {
      const rows = newItems.map((item) => ({
        id:          item.id,
        list_id:     listId,
        name:        item.name,
        checked:     item.checked,
        category:    item.category,
        recipe_id:   item.recipeId ?? null,
        recipe_name: item.recipeName ?? null,
      }));
      supabase.from('shopping_list_items').insert(rows)
        .then(({ error }) => { if (error) console.warn('[ShoppingList] addItems error', error); });
    }

    return added;
  };

  const addManualItemToList = (name: string, listId: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    let newItem: ShoppingListItem | null = null;

    setLists((prev) =>
      prev.map((list) => {
        if (list.id !== listId) return list;
        if (list.items.some((s) => ingredientMatches(trimmed, s.name))) return list;
        newItem = {
          id:       `${Date.now()}-${Math.random()}`,
          name:     trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
          checked:  false,
          category: detectCategory(trimmed),
        };
        return { ...list, items: [...list.items, newItem] };
      }),
    );

    if (newItem) {
      const item = newItem as ShoppingListItem;
      supabase.from('shopping_list_items')
        .insert({ id: item.id, list_id: listId, name: item.name, checked: false, category: item.category })
        .then(({ error }) => { if (error) console.warn('[ShoppingList] addManualItem error', error); });
    }
  };

  const renameList = (listId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    // Optimistic
    setLists((prev) =>
      prev.map((list) => list.id !== listId ? list : { ...list, name: trimmed }),
    );
    // Persist
    supabase.from('shopping_lists').update({ name: trimmed }).eq('id', listId)
      .then(({ error }) => { if (error) console.warn('[ShoppingList] renameList error', error); });
  };

  const toggleItem = (listId: string, itemId: string) => {
    let newChecked: boolean | null = null;
    // Optimistic
    setLists((prev) =>
      prev.map((list) =>
        list.id !== listId ? list : {
          ...list,
          items: list.items.map((item) => {
            if (item.id !== itemId) return item;
            newChecked = !item.checked;
            return { ...item, checked: newChecked };
          }),
        },
      ),
    );
    // Persist
    if (newChecked !== null) {
      supabase.from('shopping_list_items').update({ checked: newChecked }).eq('id', itemId)
        .then(({ error }) => { if (error) console.warn('[ShoppingList] toggleItem error', error); });
    }
  };

  const removeItem = (listId: string, itemId: string) => {
    // Optimistic
    setLists((prev) =>
      prev.map((list) =>
        list.id !== listId ? list : { ...list, items: list.items.filter((item) => item.id !== itemId) },
      ),
    );
    // Persist
    supabase.from('shopping_list_items').delete().eq('id', itemId)
      .then(({ error }) => { if (error) console.warn('[ShoppingList] removeItem error', error); });
  };

  const clearChecked = (listId: string) => {
    let checkedIds: string[] = [];
    // Optimistic
    setLists((prev) =>
      prev.map((list) => {
        if (list.id !== listId) return list;
        checkedIds = list.items.filter((i) => i.checked).map((i) => i.id);
        return { ...list, items: list.items.filter((item) => !item.checked) };
      }),
    );
    // Persist
    if (checkedIds.length > 0) {
      supabase.from('shopping_list_items').delete().in('id', checkedIds)
        .then(({ error }) => { if (error) console.warn('[ShoppingList] clearChecked error', error); });
    }
  };

  const uncheckAll = (listId: string) => {
    let itemIds: string[] = [];
    // Optimistic
    setLists((prev) =>
      prev.map((list) => {
        if (list.id !== listId) return list;
        itemIds = list.items.map((i) => i.id);
        return { ...list, items: list.items.map((item) => ({ ...item, checked: false })) };
      }),
    );
    // Persist
    if (itemIds.length > 0) {
      supabase.from('shopping_list_items').update({ checked: false }).in('id', itemIds)
        .then(({ error }) => { if (error) console.warn('[ShoppingList] uncheckAll error', error); });
    }
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
        uncheckAll,
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

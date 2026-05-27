// PantryContext — persists pantry items to Supabase.
// Optimistic updates keep the UI instant; Supabase writes happen in the background.

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

import { supabase } from '@/lib/supabase';
import { getDeviceId } from '@/lib/deviceId';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PantryContextValue {
  pantryItems: string[];
  addItem:     (name: string) => void;
  removeItem:  (name: string) => void;
  clearPantry: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const PantryContext = createContext<PantryContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PantryProvider({ children }: { children: ReactNode }) {
  const [pantryItems, setPantryItems] = useState<string[]>([]);
  const [deviceId,    setDeviceId]    = useState<string | null>(null);

  // On mount: get device ID then load pantry items from Supabase
  useEffect(() => {
    async function init() {
      const id = await getDeviceId();
      setDeviceId(id);

      const { data } = await supabase
        .from('pantry_items')
        .select('name')
        .eq('user_id', id)
        .order('created_at');

      if (data) {
        setPantryItems(data.map((row) => row.name as string));
      }
    }
    init();
  }, []);

  const addItem = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || !deviceId) return;
    if (pantryItems.some((item) => item.toLowerCase() === trimmed.toLowerCase())) return;
    // Optimistic
    setPantryItems((prev) => [...prev, trimmed]);
    // Persist
    supabase
      .from('pantry_items')
      .insert({ user_id: deviceId, name: trimmed })
      .then(({ error }) => {
        if (error) console.warn('[Pantry] insert error', error);
      });
  };

  const removeItem = (name: string) => {
    if (!deviceId) return;
    // Optimistic
    setPantryItems((prev) => prev.filter((item) => item !== name));
    // Persist
    supabase
      .from('pantry_items')
      .delete()
      .eq('user_id', deviceId)
      .eq('name', name)
      .then(({ error }) => {
        if (error) console.warn('[Pantry] delete error', error);
      });
  };

  const clearPantry = () => {
    if (!deviceId) return;
    // Optimistic
    setPantryItems([]);
    // Persist
    supabase
      .from('pantry_items')
      .delete()
      .eq('user_id', deviceId)
      .then(({ error }) => {
        if (error) console.warn('[Pantry] clear error', error);
      });
  };

  return (
    <PantryContext.Provider value={{ pantryItems, addItem, removeItem, clearPantry }}>
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

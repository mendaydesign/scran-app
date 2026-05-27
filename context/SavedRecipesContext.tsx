// SavedRecipesContext — persists saved recipes to Supabase.
// Stores only recipe IDs in the DB; full Recipe objects are resolved from
// RecipesContext so there is no data duplication.
// Optimistic updates keep the UI instant; Supabase writes happen in the background.

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';

import { supabase } from '@/lib/supabase';
import { getDeviceId } from '@/lib/deviceId';
import { useRecipes } from '@/context/RecipesContext';
import type { Recipe } from '@/types/recipe';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedRecipesContextValue {
  savedRecipes: Recipe[];
  saveRecipe:   (recipe: Recipe) => void;
  unsaveRecipe: (id: string) => void;
  isSaved:      (id: string) => boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SavedRecipesContext = createContext<SavedRecipesContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SavedRecipesProvider({ children }: { children: ReactNode }) {
  const { recipes } = useRecipes();

  const [deviceId,   setDeviceId]   = useState<string | null>(null);
  const [savedIds,   setSavedIds]   = useState<Set<string>>(new Set());

  // Resolve IDs to full Recipe objects whenever either changes
  const savedRecipes = useMemo(
    () => recipes.filter((r) => savedIds.has(r.id)),
    [recipes, savedIds],
  );

  // On mount: get device ID then load saved recipe IDs from Supabase
  useEffect(() => {
    async function init() {
      const id = await getDeviceId();
      setDeviceId(id);

      const { data } = await supabase
        .from('saved_recipes')
        .select('recipe_id')
        .eq('user_id', id);

      if (data) {
        setSavedIds(new Set(data.map((row) => row.recipe_id as string)));
      }
    }
    init();
  }, []);

  const saveRecipe = (recipe: Recipe) => {
    if (!deviceId || savedIds.has(recipe.id)) return;
    // Optimistic
    setSavedIds((prev) => new Set([...prev, recipe.id]));
    // Persist
    supabase
      .from('saved_recipes')
      .insert({ user_id: deviceId, recipe_id: recipe.id })
      .then(({ error }) => {
        if (error) console.warn('[SavedRecipes] insert error', error);
      });
  };

  const unsaveRecipe = (id: string) => {
    if (!deviceId) return;
    // Optimistic
    setSavedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    // Persist
    supabase
      .from('saved_recipes')
      .delete()
      .eq('user_id', deviceId)
      .eq('recipe_id', id)
      .then(({ error }) => {
        if (error) console.warn('[SavedRecipes] delete error', error);
      });
  };

  const isSaved = (id: string) => savedIds.has(id);

  return (
    <SavedRecipesContext.Provider
      value={{ savedRecipes, saveRecipe, unsaveRecipe, isSaved }}
    >
      {children}
    </SavedRecipesContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSavedRecipes(): SavedRecipesContextValue {
  const ctx = useContext(SavedRecipesContext);
  if (!ctx) throw new Error('useSavedRecipes must be used inside SavedRecipesProvider');
  return ctx;
}

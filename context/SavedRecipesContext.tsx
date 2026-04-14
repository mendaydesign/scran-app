// SavedRecipesContext — global store for recipes the user has swiped right on.
// Wrap the app root with SavedRecipesProvider to make the context available
// on every screen. No persistence yet — state resets on app restart.

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Recipe } from '@/types/recipe';

interface SavedRecipesContextValue {
  savedRecipes: Recipe[];
  saveRecipe: (recipe: Recipe) => void;
  unsaveRecipe: (id: string) => void;
  isSaved: (id: string) => boolean;
}

const SavedRecipesContext = createContext<SavedRecipesContextValue | null>(null);

export function SavedRecipesProvider({ children }: { children: ReactNode }) {
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);

  const saveRecipe = (recipe: Recipe) => {
    setSavedRecipes((prev) => {
      // Guard against duplicates (e.g. button pressed twice)
      if (prev.some((r) => r.id === recipe.id)) return prev;
      return [...prev, recipe];
    });
  };

  const unsaveRecipe = (id: string) => {
    setSavedRecipes((prev) => prev.filter((r) => r.id !== id));
  };

  const isSaved = (id: string) => savedRecipes.some((r) => r.id === id);

  return (
    <SavedRecipesContext.Provider
      value={{ savedRecipes, saveRecipe, unsaveRecipe, isSaved }}
    >
      {children}
    </SavedRecipesContext.Provider>
  );
}

// Convenience hook — throws if called outside the provider
export function useSavedRecipes(): SavedRecipesContextValue {
  const ctx = useContext(SavedRecipesContext);
  if (!ctx) {
    throw new Error('useSavedRecipes must be used inside SavedRecipesProvider');
  }
  return ctx;
}

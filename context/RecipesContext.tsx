// RecipesContext — fetches the recipe catalogue from Supabase on startup.
// Falls back to the local MOCK_RECIPES bundle if the network is unavailable.
// Local images are always used (bundled assets, no remote dependency).

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

import { supabase } from '@/lib/supabase';
import { MOCK_RECIPES, CATEGORIES as LOCAL_CATEGORIES, RECIPE_IMAGES } from '@/constants/mockRecipes';
import type { Recipe, Difficulty, Nutrition } from '@/types/recipe';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecipesContextValue {
  recipes:    Recipe[];
  categories: string[];   // ['All', 'Asian', 'Italian', ...]
  isLoading:  boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const RecipesContext = createContext<RecipesContextValue | null>(null);

// ─── Row → Recipe mapper ──────────────────────────────────────────────────────
// Supabase returns snake_case; nutrition JSONB may use either case.

function mapRow(row: Record<string, unknown>): Recipe {
  const n = row.nutrition as Record<string, number> | null;

  const nutrition: Nutrition | undefined = n
    ? {
        calories:      n.calories,
        fat:           n.fat,
        // stored as saturated_fat in the seed SQL
        saturatedFat:  n.saturated_fat ?? n.saturatedFat,
        fibre:         n.fibre,
        carbohydrates: n.carbohydrates,
        sugars:        n.sugars,
        protein:       n.protein,
        sodium:        n.sodium,
      }
    : undefined;

  return {
    id:          row.id as string,
    title:       row.title as string,
    description: (row.description as string) ?? '',
    category:    row.category as string,
    cookTime:    row.cook_time as number,
    prepTime:    row.prep_time as number,
    servings:    row.servings as number,
    difficulty:  row.difficulty as Difficulty,
    // JSONB arrays come back already parsed by the Supabase client
    ingredients: row.ingredients as string[],
    steps:       row.steps as string[],
    // Always use the local bundled image; image_url reserved for future remote assets
    imageUrl:    RECIPE_IMAGES[row.id as string] ?? '',
    nutrition,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function RecipesProvider({ children }: { children: ReactNode }) {
  // Initialise with local data so the UI renders immediately (no blank state)
  const [recipes,    setRecipes]    = useState<Recipe[]>(MOCK_RECIPES);
  const [categories, setCategories] = useState<string[]>(LOCAL_CATEGORIES);
  const [isLoading,  setIsLoading]  = useState(true);

  useEffect(() => {
    async function fetchRecipes() {
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .order('id');

        if (error) throw error;

        if (data && data.length > 0) {
          const mapped = data.map(mapRow);
          setRecipes(mapped);

          // Preserve LOCAL_CATEGORIES order; add any new ones from Supabase
          const remoteCategories = Array.from(new Set(mapped.map((r) => r.category)));
          const ordered = LOCAL_CATEGORIES.filter((c) => c === 'All' || remoteCategories.includes(c));
          setCategories(ordered);
        }
      } catch (err) {
        console.warn('[RecipesContext] Supabase fetch failed — using local data', err);
        // Keep the initial MOCK_RECIPES state
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecipes();
  }, []);

  return (
    <RecipesContext.Provider value={{ recipes, categories, isLoading }}>
      {children}
    </RecipesContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRecipes(): RecipesContextValue {
  const ctx = useContext(RecipesContext);
  if (!ctx) throw new Error('useRecipes must be used inside RecipesProvider');
  return ctx;
}

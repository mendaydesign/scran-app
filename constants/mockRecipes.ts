// All 30 recipes sourced from scran_recipes.json.
// imageUrl is generated here using picsum.photos with the recipe id as the
// seed so each recipe always gets the same placeholder image.

import data from '../scran_recipes.json';
import type { Recipe, Difficulty } from '@/types/recipe';

export const MOCK_RECIPES: Recipe[] = data.recipes.map((r) => ({
  ...r,
  imageUrl: `https://picsum.photos/seed/${r.id}/600/800`,
  // Cast difficulty: JSON infers it as string, but our type narrows it
  difficulty: r.difficulty as Difficulty,
}));

// 'All' is prepended so the filter chip row always has a show-everything option
export const CATEGORIES: string[] = ['All', ...data.categories];

// Type definitions for a recipe.
// All fields mirror the scran_recipes.json schema; imageUrl is added at the
// data layer since the JSON file does not include image URLs.

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Recipe {
  id: string;
  title: string;
  imageUrl: string;        // generated at data layer — not in source JSON
  cookTime: number;        // total active cook time in minutes
  prepTime: number;        // prep time in minutes
  servings: number;
  difficulty: Difficulty;
  category: string;        // used by the category-filter feature
  description: string;     // shown on the recipe detail screen
  ingredients: string[];
  steps: string[];
}

// Type definitions for a recipe.
// All fields mirror the scran_recipes.json schema; imageUrl is added at the
// data layer since the JSON file does not include image URLs.

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

// Per-serving nutritional values shown on the Nutrition tab of the detail screen.
export interface Nutrition {
  calories: number;      // kcal
  fat: number;           // g
  saturatedFat: number;  // g
  fibre: number;         // g
  carbohydrates: number; // g
  sugars: number;        // g
  protein: number;       // g
  sodium: number;        // mg
}

export interface Recipe {
  id: string;
  title: string;
  imageUrl: string | number; // string = remote URI; number = local require() asset
  cookTime: number;        // total active cook time in minutes
  prepTime: number;        // prep time in minutes
  servings: number;
  difficulty: Difficulty;
  category: string;        // used by the category-filter feature
  description: string;     // shown on the recipe detail screen
  ingredients: string[];
  steps: string[];
  nutrition?: Nutrition;   // populated from nutritionData.ts at the data layer
}

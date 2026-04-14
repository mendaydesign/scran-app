// All 30 recipes sourced from scran_recipes.json.
// Images are local files in assets/Recipe-images/, loaded via require() so they
// work offline and are bundled with the app. require() returns a number (asset ID)
// which expo-image and React Native's Image both accept directly as a source.

import data from '../scran_recipes.json';
import type { Recipe, Difficulty } from '@/types/recipe';

// Map each recipe ID to its local image asset
const RECIPE_IMAGES: Record<string, number> = {
  // Asian
  'asian-001': require('../assets/Recipe-images/asian-001.jpg'),
  'asian-002': require('../assets/Recipe-images/asian-002.jpg'),
  'asian-003': require('../assets/Recipe-images/asian-003.jpg'),
  'asian-004': require('../assets/Recipe-images/asian-004.jpg'),
  'asian-005': require('../assets/Recipe-images/asian-005.jpg'),
  // Italian
  'italian-001': require('../assets/Recipe-images/italian-001.jpg'),
  'italian-002': require('../assets/Recipe-images/italian-002.jpg'),
  'italian-003': require('../assets/Recipe-images/italian-003.jpg'),
  'italian-004': require('../assets/Recipe-images/italian-004.jpg'),
  'italian-005': require('../assets/Recipe-images/italian-005.jpg'),
  // Mexican
  'mexican-001': require('../assets/Recipe-images/mexican-001.jpg'),
  'mexican-002': require('../assets/Recipe-images/mexican-002.jpg'),
  'mexican-003': require('../assets/Recipe-images/mexican-003.jpg'),
  'mexican-004': require('../assets/Recipe-images/mexican-004.jpg'),
  'mexican-005': require('../assets/Recipe-images/mexican-005.jpg'),
  // Burgers & Sandwiches
  'burgers-001': require('../assets/Recipe-images/burgers-001.jpg'),
  'burgers-002': require('../assets/Recipe-images/burgers-002.jpg'),
  'burgers-003': require('../assets/Recipe-images/burgers-003.jpg'),
  'burgers-004': require('../assets/Recipe-images/burgers-004.jpg'),
  'burgers-005': require('../assets/Recipe-images/burgers-005.jpg'),
  // Salads & Healthy
  'salads-001': require('../assets/Recipe-images/salads-001.jpg'),
  'salads-002': require('../assets/Recipe-images/salads-002.jpg'),
  'salads-003': require('../assets/Recipe-images/salads-003.jpg'),
  'salads-004': require('../assets/Recipe-images/salads-004.jpg'),
  'salads-005': require('../assets/Recipe-images/salads-005.jpg'),
  // Desserts
  'desserts-001': require('../assets/Recipe-images/desserts-001.jpg'),
  'desserts-002': require('../assets/Recipe-images/desserts-002.jpg'),
  'desserts-003': require('../assets/Recipe-images/desserts-003.jpg'),
  'desserts-004': require('../assets/Recipe-images/desserts-004.jpg'),
  'desserts-005': require('../assets/Recipe-images/desserts-005.jpg'),
};

export const MOCK_RECIPES: Recipe[] = data.recipes.map((r) => ({
  ...r,
  imageUrl: RECIPE_IMAGES[r.id],
  // Cast difficulty: JSON infers it as string, but our type narrows it
  difficulty: r.difficulty as Difficulty,
}));

// 'All' is prepended so the filter chip row always has a show-everything option
export const CATEGORIES: string[] = ['All', ...data.categories];

// ingredientUtils — helpers for comparing and displaying ingredient strings.
//
// Recipe data uses full strings like "400g spaghetti" or "2 tbsp olive oil".
// The pantry and shopping list store bare names like "spaghetti" or "olive oil".
// This file provides:
//   normalizeIngredient   — strips qty / units / prep for fuzzy matching
//   extractIngredientName — normalize + depluralize + sentence-case for display
//   ingredientMatches     — bidirectional match after normalization
//   detectCategory        — maps a clean name to a shopping-list category

import { INGREDIENT_CATEGORIES } from '@/constants/ingredients';

// ─── Strip patterns ───────────────────────────────────────────────────────────

// Common cooking units. Listed as whole words so "can" won't clip "cantaloupe".
const UNIT_PATTERN =
  /\b(g|kg|ml|l|litre|liter|oz|lb|lbs|tbsp|tbs|tbsps|tsp|tsps|cup|cups|clove|cloves|bunch|bunches|pinch|pinches|handful|handfuls|slice|slices|piece|pieces|can|cans|tin|tins|jar|jars|packet|packets|bag|bags|sprig|sprigs|stalk|stalks|head|heads|rasher|rashers|fillet|fillets|sheet|sheets)\b/gi;

// Preparation adverbs — always modify a prep verb, never an ingredient name.
// "finely chopped", "roughly torn", "thinly sliced", etc.
const PREP_ADVERB_PATTERN =
  /\b(finely|roughly|coarsely|thinly|thickly|freshly|lightly|well|loosely|firmly)\b/gi;

// Preparation verbs / past-participle adjectives that describe how to prep the
// ingredient, not what it is.
// NOTE: "ground", "dried", "fresh", "smoked" are intentionally excluded —
// they form part of ingredient names ("ground coriander", "dried thyme", etc.).
const PREP_WORD_PATTERN =
  /\b(chopped|sliced|diced|minced|grated|peeled|crushed|shredded|trimmed|halved|quartered|beaten|softened|melted|toasted|torn|cubed|julienned|deseeded|seeded|pitted|zested|squeezed|crumbled|flaked|washed|rinsed|separated|sifted|sieved|blanched|scored|boned|deboned|skinned|shelled|hulled|cored|sliced|butterflied)\b/gi;

// ─── normalizeIngredient ──────────────────────────────────────────────────────

/**
 * Strips quantities, units, and preparation instructions so ingredients can be
 * compared and displayed regardless of how they are written in a recipe.
 *
 *   "400g spaghetti"              → "spaghetti"
 *   "2 tbsp olive oil"            → "olive oil"
 *   "3 cloves garlic"             → "garlic"
 *   "1/2 tsp sea salt"            → "sea salt"
 *   "spring onions, sliced"       → "spring onions"
 *   "4 chicken breasts, skin off" → "chicken breasts"
 *   "onion, finely chopped"       → "onion"
 */
export function normalizeIngredient(raw: string): string {
  return (
    raw
      // Everything after a comma is prep instruction ("sliced", "skin on", etc.)
      .split(',')[0]
      .toLowerCase()
      // Remove integers, decimals and simple fractions (e.g. 400, 1.5, 1/2)
      .replace(/\b\d+([./]\d+)?\b/g, '')
      // Remove unit words
      .replace(UNIT_PATTERN, '')
      // Remove prep adverbs ("finely", "roughly", …)
      .replace(PREP_ADVERB_PATTERN, '')
      // Remove prep verbs ("chopped", "sliced", "diced", …)
      .replace(PREP_WORD_PATTERN, '')
      // Collapse any extra whitespace left behind
      .replace(/\s+/g, ' ')
      .trim()
  );
}

// ─── ingredientMatches ────────────────────────────────────────────────────────

/**
 * Returns true if a recipe ingredient and a pantry/shopping-list item refer to
 * the same ingredient after normalisation.  The bidirectional substring check
 * means "olive oil" matches "2 tbsp extra virgin olive oil" in either direction.
 */
export function ingredientMatches(
  recipeIngredient: string,
  listItem: string,
): boolean {
  const normRecipe = normalizeIngredient(recipeIngredient);
  const normItem = normalizeIngredient(listItem);
  if (!normRecipe || !normItem) return false;
  return normRecipe.includes(normItem) || normItem.includes(normRecipe);
}

// ─── extractIngredientName ────────────────────────────────────────────────────

/**
 * Strips quantity, unit, size, and preparation info from a recipe ingredient
 * string and returns only the clean ingredient name, sentence-cased, ready to
 * display on the shopping list.
 *
 *   "4 chicken breasts"            → "Chicken breast"
 *   "400g spaghetti"               → "Spaghetti"
 *   "2 tbsp olive oil"             → "Olive oil"
 *   "spring onions, sliced"        → "Spring onion"
 *   "onion, finely chopped"        → "Onion"
 *   "4 chicken breasts, skin off"  → "Chicken breast"
 *   "1 tsp cumin seeds"            → "Cumin seed"
 *   "cherry tomatoes"              → "Cherry tomato"
 */
export function extractIngredientName(raw: string): string {
  const normalized = normalizeIngredient(raw);
  // Fall back to the raw string (sentence-cased) if stripping removed everything
  const base = normalized || raw.trim().toLowerCase();
  // Depluralize only the final word (e.g. "breasts" → "breast")
  const words = base.split(' ');
  words[words.length - 1] = depluralize(words[words.length - 1]);
  // Sentence case: uppercase the very first letter only
  const result = words.join(' ');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Converts a plural word to its singular form for the most common English
 * patterns found in cooking ingredient names.
 */
function depluralize(word: string): string {
  if (word.length <= 3) return word;
  // berries → berry, raspberries → raspberry
  if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
  // tomatoes → tomato, potatoes → potato
  if (word.endsWith('oes') && word.length > 4) return word.slice(0, -2);
  // peaches → peach, dishes → dish, boxes → box
  if (/(?:sh|ch|x)es$/.test(word)) return word.slice(0, -2);
  // breasts → breast, onions → onion, carrots → carrot
  // Exclude words ending in -ss, -us, -is, -as (asparagus, couscous, etc.)
  if (word.endsWith('s') && !/(?:ss|us|is|as|os)$/.test(word)) {
    return word.slice(0, -1);
  }
  return word;
}

// ─── detectCategory ───────────────────────────────────────────────────────────

// Maps ingredient-list category labels to shopping-list-friendly names.
// Vegetables and Fruits are merged into "Fresh Produce" since shoppers find
// them in the same section of a supermarket.
const INGREDIENT_TO_SHOPPING_CATEGORY: Record<string, string> = {
  Proteins:            'Meat & Fish',
  Vegetables:          'Fresh Produce',
  Fruits:              'Fresh Produce',
  'Herbs & Spices':    'Herbs & Spices',
  Dairy:               'Dairy',
  'Pantry Staples':    'Pantry',
  'Sauces & Condiments': 'Sauces & Condiments',
  'Grains & Carbs':    'Grains & Carbs',
};

/** Ordered list used to render shopping list sections top to bottom. */
export const SHOPPING_CATEGORY_ORDER: string[] = [
  'Fresh Produce',
  'Meat & Fish',
  'Dairy',
  'Grains & Carbs',
  'Herbs & Spices',
  'Pantry',
  'Sauces & Condiments',
  'Other',
];

/**
 * Returns the shopping-list category for a given ingredient name.
 * Checks the ingredient against every category in INGREDIENT_CATEGORIES and
 * returns "Other" if no match is found.
 */
export function detectCategory(ingredientName: string): string {
  for (const { label, items } of INGREDIENT_CATEGORIES) {
    if (items.some((item) => ingredientMatches(ingredientName, item))) {
      return INGREDIENT_TO_SHOPPING_CATEGORY[label] ?? label;
    }
  }
  return 'Other';
}

// Nutritional information per serving for each recipe.
// Values are realistic estimates based on the recipe ingredients and servings.
// Stored separately from scran_recipes.json so the JSON stays clean.
// Merged into the Recipe objects in mockRecipes.ts.

import type { Nutrition } from '@/types/recipe';

export const NUTRITION_DATA: Record<string, Nutrition> = {

  // ── Asian ──────────────────────────────────────────────────────────────────
  'asian-001': { calories: 601, fat: 19, saturatedFat: 3,  fibre: 13, carbohydrates: 78, sugars: 4,  protein: 22, sodium: 820 }, // Chicken Katsu Curry
  'asian-002': { calories: 480, fat: 14, saturatedFat: 3,  fibre: 4,  carbohydrates: 52, sugars: 7,  protein: 32, sodium: 940 }, // Beef Stir-Fry with Noodles
  'asian-003': { calories: 520, fat: 22, saturatedFat: 8,  fibre: 3,  carbohydrates: 48, sugars: 6,  protein: 28, sodium: 760 }, // Thai Green Curry
  'asian-004': { calories: 440, fat: 12, saturatedFat: 3,  fibre: 5,  carbohydrates: 58, sugars: 5,  protein: 24, sodium: 680 }, // Pad Thai
  'asian-005': { calories: 390, fat: 10, saturatedFat: 2,  fibre: 4,  carbohydrates: 55, sugars: 8,  protein: 22, sodium: 560 }, // Teriyaki Salmon Bowl

  // ── Italian ───────────────────────────────────────────────────────────────
  'italian-001': { calories: 620, fat: 18, saturatedFat: 6,  fibre: 5,  carbohydrates: 82, sugars: 8,  protein: 28, sodium: 480 }, // Spaghetti Bolognese
  'italian-002': { calories: 540, fat: 20, saturatedFat: 8,  fibre: 4,  carbohydrates: 68, sugars: 6,  protein: 24, sodium: 560 }, // Margherita Pizza
  'italian-003': { calories: 580, fat: 22, saturatedFat: 9,  fibre: 6,  carbohydrates: 72, sugars: 7,  protein: 26, sodium: 520 }, // Chicken Parmigiana
  'italian-004': { calories: 650, fat: 24, saturatedFat: 10, fibre: 5,  carbohydrates: 78, sugars: 9,  protein: 30, sodium: 640 }, // Lasagne
  'italian-005': { calories: 490, fat: 16, saturatedFat: 6,  fibre: 4,  carbohydrates: 64, sugars: 7,  protein: 22, sodium: 440 }, // Risotto

  // ── Mexican ───────────────────────────────────────────────────────────────
  'mexican-001': { calories: 560, fat: 22, saturatedFat: 8,  fibre: 7,  carbohydrates: 62, sugars: 6,  protein: 28, sodium: 700 }, // Beef Tacos
  'mexican-002': { calories: 480, fat: 18, saturatedFat: 6,  fibre: 9,  carbohydrates: 52, sugars: 8,  protein: 26, sodium: 760 }, // Chicken Burritos
  'mexican-003': { calories: 520, fat: 20, saturatedFat: 7,  fibre: 8,  carbohydrates: 56, sugars: 5,  protein: 30, sodium: 680 }, // Enchiladas
  'mexican-004': { calories: 440, fat: 16, saturatedFat: 5,  fibre: 10, carbohydrates: 48, sugars: 7,  protein: 24, sodium: 600 }, // Black Bean Quesadillas
  'mexican-005': { calories: 590, fat: 24, saturatedFat: 9,  fibre: 6,  carbohydrates: 60, sugars: 8,  protein: 32, sodium: 740 }, // Carnitas

  // ── Burgers & Sandwiches ──────────────────────────────────────────────────
  'burgers-001': { calories: 720, fat: 38, saturatedFat: 14, fibre: 4,  carbohydrates: 68, sugars: 12, protein: 36, sodium: 900 }, // Classic Beef Burger
  'burgers-002': { calories: 680, fat: 32, saturatedFat: 12, fibre: 5,  carbohydrates: 72, sugars: 10, protein: 34, sodium: 840 }, // Chicken Burger
  'burgers-003': { calories: 640, fat: 28, saturatedFat: 10, fibre: 5,  carbohydrates: 70, sugars: 14, protein: 30, sodium: 780 }, // BBQ Pulled Pork Burger
  'burgers-004': { calories: 700, fat: 36, saturatedFat: 13, fibre: 4,  carbohydrates: 66, sugars: 11, protein: 38, sodium: 860 }, // Smash Burger
  'burgers-005': { calories: 560, fat: 22, saturatedFat: 7,  fibre: 8,  carbohydrates: 64, sugars: 9,  protein: 28, sodium: 720 }, // Veggie Burger

  // ── Salads & Healthy ──────────────────────────────────────────────────────
  'salads-001': { calories: 280, fat: 14, saturatedFat: 3,  fibre: 8,  carbohydrates: 22, sugars: 10, protein: 18, sodium: 380 }, // Greek Salad with Chicken
  'salads-002': { calories: 320, fat: 16, saturatedFat: 4,  fibre: 9,  carbohydrates: 28, sugars: 12, protein: 20, sodium: 420 }, // Caesar Salad
  'salads-003': { calories: 260, fat: 12, saturatedFat: 2,  fibre: 10, carbohydrates: 20, sugars: 9,  protein: 16, sodium: 340 }, // Asian Slaw
  'salads-004': { calories: 340, fat: 18, saturatedFat: 5,  fibre: 7,  carbohydrates: 26, sugars: 11, protein: 22, sodium: 460 }, // Nicoise Salad
  'salads-005': { calories: 300, fat: 14, saturatedFat: 3,  fibre: 11, carbohydrates: 24, sugars: 8,  protein: 20, sodium: 400 }, // Quinoa Power Bowl

  // ── Desserts ──────────────────────────────────────────────────────────────
  'desserts-001': { calories: 420, fat: 18, saturatedFat: 10, fibre: 2,  carbohydrates: 62, sugars: 42, protein: 6, sodium: 180 }, // Chocolate Brownie
  'desserts-002': { calories: 380, fat: 16, saturatedFat: 9,  fibre: 3,  carbohydrates: 58, sugars: 38, protein: 7, sodium: 160 }, // Cheesecake
  'desserts-003': { calories: 450, fat: 20, saturatedFat: 12, fibre: 2,  carbohydrates: 64, sugars: 46, protein: 7, sodium: 200 }, // Sticky Toffee Pudding
  'desserts-004': { calories: 400, fat: 17, saturatedFat: 10, fibre: 4,  carbohydrates: 56, sugars: 40, protein: 6, sodium: 170 }, // Apple Crumble
  'desserts-005': { calories: 460, fat: 22, saturatedFat: 13, fibre: 2,  carbohydrates: 60, sugars: 44, protein: 8, sodium: 210 }, // Tiramisu
};

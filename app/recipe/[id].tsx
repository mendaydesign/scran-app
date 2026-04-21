// RecipeDetail — full recipe view, pushed as a Stack screen over the tabs.
// Shows the hero image, metadata badges, description, then a 3-tab segmented
// control switching between Ingredients, Method, and Nutrition.
// Back and save buttons float over the hero image.

import { useRef, useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { MOCK_RECIPES } from '@/constants/mockRecipes';
import { useSavedRecipes } from '@/context/SavedRecipesContext';
import { usePantry } from '@/context/PantryContext';
import { useShoppingList } from '@/context/ShoppingListContext';
import { Colors, FontFamily, FontSize, FontWeight, Radius } from '@/constants/tokens';
import { ingredientMatches } from '@/utils/ingredientUtils';
import type { Difficulty } from '@/types/recipe';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'ingredients' | 'method' | 'nutrition';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  Easy: '#4CAF50',
  Medium: '#FF9800',
  Hard: '#FF4444',
};

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSaved, saveRecipe, unsaveRecipe } = useSavedRecipes();
  const { pantryItems } = usePantry();
  const { addItems } = useShoppingList();

  const [activeTab, setActiveTab] = useState<Tab>('ingredients');

  // Toast state — shows a brief confirmation after adding to the shopping list
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const recipe = MOCK_RECIPES.find((r) => r.id === id);

  if (!recipe) {
    return (
      <View style={[styles.container, styles.centred, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Recipe not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBack}>
          <Text style={styles.errorBackText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const saved = isSaved(recipe.id);
  const difficultyColor = DIFFICULTY_COLOR[recipe.difficulty];

  const handleAddToShoppingList = () => {
    const missingIngredients = recipe.ingredients.filter(
      (ingredient) =>
        !pantryItems.some(
          (pantryItem) =>
            pantryItem.trim().length > 0 && ingredientMatches(ingredient, pantryItem),
        ),
    );

    const added = addItems(
      missingIngredients.map((name) => ({
        name,
        recipeId: recipe.id,
        recipeName: recipe.title,
      })),
    );

    const message =
      added === 0
        ? 'All ingredients already in your list'
        : `Added ${added} item${added !== 1 ? 's' : ''} to shopping list`;

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 2500);
  };

  // ── Tab content ─────────────────────────────────────────────────────────────

  const renderIngredientsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        {recipe.ingredients.map((ingredient, i) => (
          <View key={i} style={styles.ingredientRow}>
            <View style={styles.bullet} />
            <Text style={styles.bodyText}>{ingredient}</Text>
          </View>
        ))}
      </View>

      {/* Add to Shopping List — only shown for saved recipes */}
      {saved && (
        <TouchableOpacity
          style={styles.shoppingListButton}
          onPress={handleAddToShoppingList}
          accessibilityLabel="Add missing ingredients to shopping list"
          accessibilityRole="button"
        >
          <Ionicons name="cart-outline" size={20} color={Colors.onPrimary} />
          <Text style={styles.shoppingListButtonText}>Add to Shopping List</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderMethodTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.section, styles.sectionAlt]}>
        {recipe.steps.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>{i + 1}</Text>
            </View>
            <Text style={styles.bodyText}>{step}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderNutritionTab = () => {
    const n = recipe.nutrition;
    if (!n) {
      return (
        <View style={[styles.tabContent, styles.centred]}>
          <Text style={styles.noDataText}>Nutritional data not available.</Text>
        </View>
      );
    }

    const rows: Array<{ label: string; value: string }> = [
      { label: 'Calories',        value: `${n.calories} kcal` },
      { label: 'Fat',             value: `${n.fat}g` },
      { label: 'Saturated Fat',   value: `${n.saturatedFat}g` },
      { label: 'Dietary Fibre',   value: `${n.fibre}g` },
      { label: 'Carbohydrates',   value: `${n.carbohydrates}g` },
      { label: 'Sugars',          value: `${n.sugars}g` },
      { label: 'Protein',         value: `${n.protein}g` },
      { label: 'Sodium',          value: `${n.sodium}mg` },
    ];

    return (
      <View style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.nutritionNote}>
            Nutritional information per serving
          </Text>
          {rows.map((row, i) => (
            <View
              key={row.label}
              style={[
                styles.nutritionRow,
                i < rows.length - 1 && styles.nutritionRowBorder,
              ]}
            >
              <Text style={styles.nutritionLabel}>{row.label}</Text>
              <Text style={styles.nutritionValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero image */}
        <View style={styles.hero}>
          <Image
            source={recipe.imageUrl}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <View style={styles.heroScrim} />
        </View>

        {/* Detail content */}
        <View style={styles.content}>

          {/* Title */}
          <Text style={styles.recipeTitle}>{recipe.title}</Text>

          {/* Metadata badges */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={[styles.badgeText, { color: difficultyColor }]}>
                {recipe.difficulty}
              </Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.badgeText}>Cook {formatTime(recipe.cookTime)}</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="hourglass-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.badgeText}>Prep {formatTime(recipe.prepTime)}</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="people-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.badgeText}>{recipe.servings} servings</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>{recipe.description}</Text>

          {/* ── Segmented tab bar ──────────────────────────────────────────── */}
          <View style={styles.tabBar}>
            {(['ingredients', 'method', 'nutrition'] as Tab[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
                onPress={() => setActiveTab(tab)}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === tab }}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === tab && styles.tabLabelActive,
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Active tab content ──────────────────────────────────────────── */}
          {activeTab === 'ingredients' && renderIngredientsTab()}
          {activeTab === 'method'      && renderMethodTab()}
          {activeTab === 'nutrition'   && renderNutritionTab()}

          {/* Bottom breathing room */}
          <View style={{ height: 48 }} />

        </View>
      </ScrollView>

      {/* Toast confirmation */}
      {toast && (
        <View
          style={[styles.toast, { bottom: insets.bottom + 24 }]}
          pointerEvents="none"
        >
          <Ionicons name="checkmark-circle" size={18} color={Colors.onPrimary} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* Floating back button */}
      <TouchableOpacity
        style={[styles.floatingBtn, styles.backBtn, { top: insets.top + 12 }]}
        onPress={() => router.back()}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
      </TouchableOpacity>

      {/* Floating save button */}
      <TouchableOpacity
        style={[styles.floatingBtn, styles.saveBtn, { top: insets.top + 12 }]}
        onPress={() => (saved ? unsaveRecipe(recipe.id) : saveRecipe(recipe))}
        accessibilityLabel={saved ? 'Remove from saved' : 'Save recipe'}
        accessibilityRole="button"
      >
        <Ionicons
          name={saved ? 'heart' : 'heart-outline'}
          size={22}
          color={saved ? '#4CAF50' : Colors.textPrimary}
        />
      </TouchableOpacity>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  centred: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    height: 300,
    backgroundColor: Colors.surface,
  },

  heroScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  // ── Content ───────────────────────────────────────────────────────────────
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },

  recipeTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.subtitle,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: FontSize.subtitle * 1.2,
    marginBottom: 14,
  },

  // ── Badges ────────────────────────────────────────────────────────────────
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
  },

  badgeText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodySmall,
    color: Colors.textSecondary,
  },

  // ── Description ───────────────────────────────────────────────────────────
  description: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodyBase,
    color: Colors.textSecondary,
    lineHeight: FontSize.bodyBase * 1.5,
    marginBottom: 24,
  },

  // ── Segmented tab bar ─────────────────────────────────────────────────────
  // Outer pill container sits on surfaceHigh; active tab gets a surface
  // background to "lift" off it — same tonal trick used across the app.
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radius.full,
    padding: 4,
    marginBottom: 20,
  },

  tabItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabItemActive: {
    backgroundColor: Colors.surface,
    // Subtle shadow to lift the active pill
    shadowColor: '#383834',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },

  tabLabel: {
    fontFamily: FontFamily.headingSemibold,
    fontSize: FontSize.bodySmall,
    color: Colors.textSecondary,
  },

  tabLabelActive: {
    fontFamily: FontFamily.heading,
    color: Colors.textPrimary,
  },

  // ── Tab content wrapper ───────────────────────────────────────────────────
  tabContent: {
    gap: 16,
  },

  // ── Sections — tonal containers ───────────────────────────────────────────
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.r400,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },

  sectionAlt: {
    backgroundColor: Colors.surfaceHigh,
  },

  // ── Ingredients ───────────────────────────────────────────────────────────
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },

  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 9,
    flexShrink: 0,
  },

  bodyText: {
    fontFamily: FontFamily.body,
    flex: 1,
    fontSize: FontSize.bodyBase,
    color: Colors.textPrimary,
    lineHeight: FontSize.bodyBase * 1.5,
  },

  // ── Steps ─────────────────────────────────────────────────────────────────
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },

  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },

  stepNumber: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.bold,
    color: Colors.onPrimary,
  },

  // ── Nutrition ─────────────────────────────────────────────────────────────
  nutritionNote: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 16,
  },

  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
  },

  nutritionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  nutritionLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodyBase,
    color: Colors.textPrimary,
  },

  nutritionValue: {
    fontFamily: FontFamily.headingSemibold,
    fontSize: FontSize.bodyBase,
    color: Colors.textPrimary,
  },

  noDataText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodyBase,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 40,
  },

  // ── Add to Shopping List button ───────────────────────────────────────────
  shoppingListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 16,
    paddingHorizontal: 28,
    minHeight: 54,
    shadowColor: '#383834',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },

  shoppingListButtonText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.bodyBase,
    fontWeight: FontWeight.bold,
    color: Colors.onPrimary,
  },

  // ── Toast ─────────────────────────────────────────────────────────────────
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.textPrimary,
    borderRadius: Radius.full,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: '#383834',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 8,
  },

  toastText: {
    fontFamily: FontFamily.headingSemibold,
    fontSize: FontSize.bodySmall,
    color: Colors.onPrimary,
    flex: 1,
  },

  // ── Floating buttons ──────────────────────────────────────────────────────
  floatingBtn: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backBtn: {
    left: 16,
  },

  saveBtn: {
    right: 16,
  },

  // ── Error state ───────────────────────────────────────────────────────────
  errorText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodyBase,
    color: Colors.textSecondary,
  },

  errorBack: {
    marginTop: 12,
  },

  errorBackText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodyBase,
    color: Colors.accent,
  },
});

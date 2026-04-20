// RecipeDetail — full recipe view, pushed as a Stack screen over the tabs.
// Shows the hero image, metadata badges, description, ingredient list,
// and step-by-step method. Back and save buttons float over the hero image,
// inset by the device's safe area so they don't sit under the status bar.

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

  // Toast state — shows a brief confirmation after adding to the shopping list
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the timer on unmount to avoid state updates on an unmounted component
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const recipe = MOCK_RECIPES.find((r) => r.id === id);

  // Fallback for an invalid ID (shouldn't happen in normal use)
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

  // Adds the recipe's missing ingredients to the shopping list.
  // Skips anything the user already has in their pantry, and deduplicates
  // against whatever is already on the shopping list.
  const handleAddToShoppingList = () => {
    // Filter out ingredients the user already has in their pantry.
    // Uses the same substring-match logic as the Discover tab's match badge.
    const missingIngredients = recipe.ingredients.filter(
      (ingredient) =>
        !pantryItems.some(
          (pantryItem) =>
            pantryItem.trim().length > 0 && ingredientMatches(ingredient, pantryItem),
        ),
    );

    // addItems handles deduplication against the existing shopping list and
    // returns the count of items that were actually added.
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

  return (
    <View style={styles.container}>

      {/* ── Scrollable content ────────────────────────────────────────────── */}
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero image */}
        <View style={styles.hero}>
          <Image
            source={recipe.imageUrl}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          {/* Subtle scrim at the bottom so the content area below reads cleanly */}
          <View style={styles.heroScrim} />
        </View>

        {/* Detail content */}
        <View style={styles.content}>

          {/* Title */}
          <Text style={styles.recipeTitle}>{recipe.title}</Text>

          {/* Metadata badges — wraps onto multiple lines if needed */}
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

          <View style={{ height: 32 }} />

          {/* ── Ingredients — sits on surface for tonal lift ─────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients.map((ingredient, i) => (
              <View key={i} style={styles.ingredientRow}>
                <View style={styles.bullet} />
                <Text style={styles.bodyText}>{ingredient}</Text>
              </View>
            ))}
          </View>

          {/* ── Add to Shopping List — only shown for saved recipes ──────── */}
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

          {/* ── Method — sits on surfaceHigh for contrast vs ingredients ─ */}
          <View style={[styles.section, styles.sectionAlt]}>
            <Text style={styles.sectionTitle}>Method</Text>
            {recipe.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNumber}>{i + 1}</Text>
                </View>
                <Text style={styles.bodyText}>{step}</Text>
              </View>
            ))}
          </View>

          {/* Bottom breathing room */}
          <View style={{ height: 48 }} />

        </View>
      </ScrollView>

      {/* ── Toast confirmation ───────────────────────────────────────────── */}
      {toast && (
        <View
          style={[styles.toast, { bottom: insets.bottom + 24 }]}
          pointerEvents="none"
        >
          <Ionicons name="checkmark-circle" size={18} color={Colors.onPrimary} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* ── Floating back button ──────────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.floatingBtn, styles.backBtn, { top: insets.top + 12 }]}
        onPress={() => router.back()}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
      </TouchableOpacity>

      {/* ── Floating save button ──────────────────────────────────────────── */}
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

  // ── Sections — tonal containers for depth without dividers ───────────────
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.r400,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    marginBottom: 16,
  },

  sectionAlt: {
    backgroundColor: Colors.surfaceHigh,
  },

  sectionTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.heading,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 16,
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
    marginTop: 9, // aligns with the cap-height of bodyBase text
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
    marginBottom: 16,
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

  // ── Toast snackbar ────────────────────────────────────────────────────────
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

  // ── Floating buttons (back + save) ────────────────────────────────────────
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

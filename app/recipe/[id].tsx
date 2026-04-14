// RecipeDetail — full recipe view, pushed as a Stack screen over the tabs.
// Shows the hero image, metadata badges, description, ingredient list,
// and step-by-step method. Back and save buttons float over the hero image,
// inset by the device's safe area so they don't sit under the status bar.

import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { MOCK_RECIPES } from '@/constants/mockRecipes';
import { useSavedRecipes } from '@/context/SavedRecipesContext';
import { Colors, FontFamily, FontSize, FontWeight, Radius, Stroke } from '@/constants/tokens';
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
            <View style={[styles.badge, { borderColor: difficultyColor }]}>
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

          <View style={styles.divider} />

          {/* ── Ingredients ─────────────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {recipe.ingredients.map((ingredient, i) => (
            <View key={i} style={styles.ingredientRow}>
              <View style={styles.bullet} />
              <Text style={styles.bodyText}>{ingredient}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          {/* ── Method ──────────────────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>Method</Text>
          {recipe.steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>{i + 1}</Text>
              </View>
              <Text style={styles.bodyText}>{step}</Text>
            </View>
          ))}

          {/* Bottom breathing room */}
          <View style={{ height: 48 }} />

        </View>
      </ScrollView>

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
    paddingTop: 24,
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
    borderWidth: Stroke.border,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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

  divider: {
    height: Stroke.border,
    backgroundColor: Colors.border,
    marginBottom: 20,
  },

  // ── Sections ──────────────────────────────────────────────────────────────
  sectionTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.heading,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 14,
  },

  // ── Ingredients ───────────────────────────────────────────────────────────
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },

  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
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
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },

  stepNumber: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
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

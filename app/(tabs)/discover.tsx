// Discover tab — the main swipe interface.
// Identical layout to the old app/index.tsx but saved-recipe state now
// comes from SavedRecipesContext instead of local useState, so it persists
// across tab switches and is shared with the Saved tab.

import { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { MOCK_RECIPES, CATEGORIES } from '@/constants/mockRecipes';
import { Colors, FontFamily, FontSize, FontWeight, Radius, IconSize } from '@/constants/tokens';
import SwipeStack from '@/components/SwipeStack';
import CategoryFilter from '@/components/CategoryFilter';
import { useSavedRecipes } from '@/context/SavedRecipesContext';
import { usePantry } from '@/context/PantryContext';
import type { Recipe } from '@/types/recipe';


export default function DiscoverScreen() {
  // Saved state lives in context — shared with the Saved tab
  const { savedRecipes, saveRecipe } = useSavedRecipes();

  // Pantry state — shared with the Pantry tab
  const { pantryItems, matchBadgeEnabled } = usePantry();

  // Active category filter — 'All' shows every recipe
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const displayedRecipes =
    selectedCategory === 'All'
      ? MOCK_RECIPES
      : MOCK_RECIPES.filter((r) => r.category === selectedCategory);

  // Ref used to trigger programmatic swipes from the ✕ / ♥ buttons
  const triggerSwipeRef = useRef<((direction: 'left' | 'right') => void) | null>(null);

  const handleSwipeRight = (recipe: Recipe) => {
    saveRecipe(recipe);
  };

  return (
    // edges={['top']} — the tab bar owns the bottom safe area
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.appName}>SCRAN</Text>
        {savedRecipes.length > 0 && (
          <View style={styles.savedBadge}>
            <Ionicons name="heart" size={14} color={Colors.textPrimary} />
            <Text style={styles.savedBadgeText}>{savedRecipes.length}</Text>
          </View>
        )}
      </View>

      {/* ── Category filter chips ─────────────────────────────────────────── */}
      <CategoryFilter
        categories={CATEGORIES}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* ── Swipe stack ───────────────────────────────────────────────────── */}
      {/* key={selectedCategory} remounts SwipeStack on filter change,
          resetting its internal currentIndex back to 0. */}
      <View style={styles.stackContainer}>
        <SwipeStack
          key={selectedCategory}
          recipes={displayedRecipes}
          onSwipeRight={handleSwipeRight}
          triggerSwipeRef={triggerSwipeRef}
          pantryItems={matchBadgeEnabled ? pantryItems : undefined}
        />
      </View>

      {/* ── Action buttons ────────────────────────────────────────────────── */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.nopeButton]}
          onPress={() => triggerSwipeRef.current?.('left')}
          accessibilityLabel="Skip this recipe"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={28} color={Colors.secondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => triggerSwipeRef.current?.('right')}
          accessibilityLabel="Save this recipe"
          accessibilityRole="button"
        >
          <Ionicons name="heart" size={28} color={Colors.onPrimary} />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'flex-start',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 6,
  },

  appName: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.titlePage,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
    letterSpacing: 4,
  },

  savedBadge: {
    position: 'absolute',
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  savedBadgeText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  stackContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 48,
    paddingBottom: 24,
    paddingTop: 8,
  },

  actionButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#383834',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },

  // Nope: white fill with pink ring + pink X icon
  nopeButton: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.secondary,
  },

  // Like: solid green circle with white heart
  likeButton: {
    backgroundColor: Colors.primary,
  },
});

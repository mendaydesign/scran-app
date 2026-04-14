// Saved tab — scrollable 2-column grid of recipes the user has liked.
// Tapping a card navigates to RecipeDetail (/recipe/[id]) as a Stack screen.

import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useSavedRecipes } from '@/context/SavedRecipesContext';
import { Colors, FontFamily, FontSize, FontWeight, Radius } from '@/constants/tokens';
import type { Recipe } from '@/types/recipe';

// ─── Layout constants ─────────────────────────────────────────────────────────

const SCREEN_PADDING = 16;
const CARD_GAP = 12;
const CARD_WIDTH =
  (Dimensions.get('window').width - SCREEN_PADDING * 2 - CARD_GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.5; // portrait ratio

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCookTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Grid card ────────────────────────────────────────────────────────────────

function RecipeGridCard({
  recipe,
  onPress,
}: {
  recipe: Recipe;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel={`View ${recipe.title}`}
      accessibilityRole="button"
    >
      {/* Full-bleed image */}
      <Image
        source={recipe.imageUrl}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
      />

      {/* Dark overlay + text at the bottom of the card */}
      <View style={styles.cardOverlay}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {recipe.title}
        </Text>
        <View style={styles.cardMeta}>
          <Ionicons name="time-outline" size={12} color={Colors.textPrimary} />
          <Text style={styles.cardMetaText}>
            {formatCookTime(recipe.cookTime)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SavedScreen() {
  const { savedRecipes } = useSavedRecipes();
  const router = useRouter();

  return (
    // edges={['top']} — the tab bar owns the bottom safe area
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Saved</Text>
        {savedRecipes.length > 0 && (
          <Text style={styles.countLabel}>
            {savedRecipes.length} recipe{savedRecipes.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {savedRecipes.length === 0 ? (

        // Empty state
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No saved recipes yet</Text>
          <Text style={styles.emptySubtitle}>
            Swipe right on recipes you like and they'll appear here.
          </Text>
        </View>

      ) : (

        // 2-column recipe grid
        <FlatList
          data={savedRecipes}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <RecipeGridCard
              recipe={item}
              onPress={() =>
                router.push({
                  pathname: '/recipe/[id]',
                  params: { id: item.id },
                })
              }
            />
          )}
        />

      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },

  screenTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.titlePage,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },

  countLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodyBase,
    color: Colors.textSecondary,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
    paddingBottom: 80, // offset so it reads as vertically centred above the tab bar
  },

  emptyTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.subheading,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  emptySubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodyBase,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.bodyBase * 1.4,
  },

  // ── Grid ──────────────────────────────────────────────────────────────────
  grid: {
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: 24,
    gap: CARD_GAP,
  },

  gridRow: {
    gap: CARD_GAP,
  },

  // ── Grid card ─────────────────────────────────────────────────────────────
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: Radius.r200,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },

  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingTop: 28,
    paddingBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },

  cardTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: FontSize.bodySmall * 1.3,
    marginBottom: 5,
  },

  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  cardMetaText: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.textPrimary,
    opacity: 0.85,
  },
});

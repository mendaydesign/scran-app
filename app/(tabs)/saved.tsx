// Saved tab — recipes grouped by cuisine category.
// Each category that has ≥1 saved recipe renders as a section:
//   • Category heading
//   • Horizontally-scrollable row of recipe cards
// The whole page scrolls vertically.

import {
  ScrollView,
  FlatList,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useSavedRecipes } from '@/context/SavedRecipesContext';
import { CATEGORIES } from '@/constants/mockRecipes';
import { Colors, FontFamily, FontSize, FontWeight, Radius } from '@/constants/tokens';
import type { Recipe } from '@/types/recipe';

// ─── Layout constants ─────────────────────────────────────────────────────────

const CARD_WIDTH  = 160;
const CARD_HEIGHT = CARD_WIDTH * 1.55; // portrait ratio

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCookTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Horizontal card ──────────────────────────────────────────────────────────

function RecipeGridCard({
  recipe,
  onPress,
}: {
  recipe: Recipe;
  onPress: () => void;
}) {
  return (
    <View style={styles.cardShadow}>
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

        {/* Green gradient overlay */}
        <LinearGradient
          colors={['rgba(0,75,51,0)', 'rgba(0,75,51,0.40)', 'rgba(0,75,51,0.95)']}
          locations={[0, 0.6, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.cardOverlay}
        >
          <Text style={styles.cardTitle} numberOfLines={2}>
            {recipe.title.toUpperCase()}
          </Text>
          <View style={styles.cardMeta}>
            <Ionicons name="time-outline" size={12} color="#ffffff" />
            <Text style={styles.cardMetaText}>
              {formatCookTime(recipe.cookTime)}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ─── Category section ─────────────────────────────────────────────────────────

function CategorySection({
  category,
  recipes,
  onPress,
}: {
  category: string;
  recipes: Recipe[];
  onPress: (id: string) => void;
}) {
  return (
    <View style={styles.section}>
      {/* Section heading */}
      <Text style={styles.sectionTitle}>{category}</Text>

      {/* Horizontal scroll row */}
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        renderItem={({ item }) => (
          <RecipeGridCard recipe={item} onPress={() => onPress(item.id)} />
        )}
      />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SavedScreen() {
  const { savedRecipes } = useSavedRecipes();
  const router = useRouter();

  // Build ordered list of categories that have ≥1 saved recipe.
  // CATEGORIES starts with 'All' — skip it; the rest are the cuisine names.
  const cuisines = CATEGORIES.filter((c) => c !== 'All');
  const sections = cuisines
    .map((cat) => ({
      category: cat,
      recipes: savedRecipes.filter((r) => r.category === cat),
    }))
    .filter((s) => s.recipes.length > 0);

  const navigateTo = (id: string) =>
    router.push({ pathname: '/recipe/[id]', params: { id } });

  return (
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

        // Vertically-scrolling list of category sections
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {sections.map((s) => (
            <CategorySection
              key={s.category}
              category={s.category}
              recipes={s.recipes}
              onPress={navigateTo}
            />
          ))}
        </ScrollView>

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
    paddingBottom: 80,
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

  // ── Scroll container ──────────────────────────────────────────────────────
  scrollContent: {
    paddingBottom: 32,
    gap: 32,
  },

  // ── Category section ──────────────────────────────────────────────────────
  section: {
    gap: 14,
  },

  sectionTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.subheading,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    paddingHorizontal: 24,
  },

  // Horizontal card row — leading/trailing padding so cards align with header
  row: {
    paddingHorizontal: 24,
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  cardShadow: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: Radius.r300,
    shadowColor: '#383834',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },

  card: {
    flex: 1,
    borderRadius: Radius.r300,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },

  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingTop: 40,
    paddingBottom: 12,
  },

  cardTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.bold,
    color: '#ffffff',
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
    color: '#ffffff',
    opacity: 0.85,
  },
});

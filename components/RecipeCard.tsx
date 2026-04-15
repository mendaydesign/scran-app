// RecipeCard — pure UI component for a single recipe card.
// Renders two faces (front + back) that flip on the Y-axis via a shared
// flipProgress value driven by the parent (SwipeStack).
// swipeProgress drives the LIKE / NOPE overlays on the front face only.

import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useSharedValue,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

import type { Recipe } from '@/types/recipe';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  LineHeight,
  Radius,
} from '@/constants/tokens';

// ─── Colours specific to the back-face pills ────────────────────────────────
// These are not in the global design tokens (they're card-back-specific).
const PILL_MINT_BG   = '#d4f0e4';
const PILL_MINT_TEXT = '#1a6b42';
const PILL_LIME_BG   = '#e8f76c';
const PILL_LIME_TEXT = '#3a5500';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCookTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// Splits a raw ingredient string (e.g. "2 tbsp curry powder") into its
// leading quantity token and the remaining ingredient name.
function parseIngredient(raw: string): { quantity: string; name: string } {
  const match = raw.match(
    /^(\d[\d./]*\s*(?:g|kg|ml|l|tbsp?|tsp|cups?|oz|lbs?|cloves?|pinch)?)\s+(.+)$/i,
  );
  if (match) return { quantity: match[1].trim(), name: match[2].trim() };
  return { quantity: '', name: raw };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RecipeCardProps {
  recipe: Recipe;
  // swipeProgress is only passed to the top card; drives LIKE / NOPE opacity.
  swipeProgress?: SharedValue<number>;
  stackDepth: number; // 0 = top, 1 = behind, 2 = furthest back
  // When pantry mode is active the parent passes how many ingredients matched.
  matchBadge?: { matched: number; total: number };
  // Drives the Y-axis flip animation (0 = front, 1 = back). Only top card.
  flipProgress?: SharedValue<number>;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function RecipeCard({
  recipe,
  swipeProgress,
  matchBadge,
  flipProgress,
}: RecipeCardProps) {
  // Fallback shared values so hooks are never called conditionally
  const fallbackSwipe = useSharedValue(0);
  const fallbackFlip  = useSharedValue(0);

  const progress     = swipeProgress ?? fallbackSwipe;
  const flipVal      = flipProgress  ?? fallbackFlip;

  // ── LIKE / NOPE overlay opacity ──────────────────────────────────────────
  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.35], [0, 1], Extrapolation.CLAMP),
  }));

  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [-0.35, 0], [1, 0], Extrapolation.CLAMP),
  }));

  // ── Flip face transforms ─────────────────────────────────────────────────
  // Front: 0° at rest → 180° when fully flipped (back-face hidden > 90°)
  const frontFaceStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipVal.value, [0, 1], [0, 180], Extrapolation.CLAMP);
    return { transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }] };
  });

  // Back: starts at -180° (hidden) → 0° when fully flipped (visible)
  const backFaceStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipVal.value, [0, 1], [-180, 0], Extrapolation.CLAMP);
    return { transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }] };
  });

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.flipContainer} collapsable={false}>

      {/* ── Front face ──────────────────────────────────────────────────── */}
      <Animated.View style={[styles.face, frontFaceStyle]}>
        <View style={styles.card}>
          {/* Full-bleed recipe image */}
          <Image
            source={recipe.imageUrl}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />

          {/* Bottom-up gradient overlay */}
          <LinearGradient
            colors={['rgba(0,75,51,0)', 'rgba(0,75,51,0.40)', 'rgba(0,75,51,0.95)']}
            locations={[0, 0.6, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.infoOverlay}
          >
            <Text style={styles.title} numberOfLines={2}>
              {recipe.title.toUpperCase()}
            </Text>

            <View style={styles.badgeRow}>
              <BlurView intensity={60} tint="light" style={styles.badge}>
                <Ionicons name="time-outline" size={14} color="#ffffff" />
                <Text style={styles.badgeText}>{formatCookTime(recipe.cookTime)}</Text>
              </BlurView>

              <BlurView intensity={60} tint="light" style={styles.badge}>
                <Ionicons name="restaurant-outline" size={14} color="#ffffff" />
                <Text style={styles.badgeText}>{recipe.difficulty}</Text>
              </BlurView>

              {matchBadge && (
                <BlurView intensity={60} tint="light" style={styles.badge}>
                  <Ionicons name="basket-outline" size={14} color="#ffffff" />
                  <Text style={styles.badgeText}>
                    {matchBadge.matched}/{matchBadge.total}
                  </Text>
                </BlurView>
              )}
            </View>
          </LinearGradient>

          {/* LIKE stamp */}
          <Animated.View style={[styles.likeLabel, likeStyle]}>
            <Text style={styles.likeLabelText}>LIKE</Text>
          </Animated.View>

          {/* NOPE stamp */}
          <Animated.View style={[styles.nopeLabel, nopeStyle]}>
            <Text style={styles.nopeLabelText}>NOPE</Text>
          </Animated.View>
        </View>
      </Animated.View>

      {/* ── Back face ───────────────────────────────────────────────────── */}
      <Animated.View style={[styles.face, backFaceStyle]}>
        <View style={styles.backCard}>

          {/* Fixed top section — category, title, pills, section heading */}
          <View style={styles.backTop}>

            {/* Category tag */}
            <Text style={styles.backCategory}>
              {recipe.category.toUpperCase()}
            </Text>

            {/* Recipe title */}
            <Text style={styles.backTitle} numberOfLines={3}>
              {recipe.title.toUpperCase()}
            </Text>

            {/* Cook time + difficulty pills */}
            <View style={styles.backPillRow}>
              <View style={[styles.backPill, { backgroundColor: PILL_MINT_BG }]}>
                <MaterialIcons name="access-time" size={14} color={PILL_MINT_TEXT} />
                <Text style={[styles.backPillText, { color: PILL_MINT_TEXT }]}>
                  {formatCookTime(recipe.cookTime)}
                </Text>
              </View>

              <View style={[styles.backPill, { backgroundColor: PILL_LIME_BG }]}>
                <MaterialIcons name="bolt" size={14} color={PILL_LIME_TEXT} />
                <Text style={[styles.backPillText, { color: PILL_LIME_TEXT }]}>
                  {recipe.difficulty}
                </Text>
              </View>
            </View>

            {/* "Key Ingredients" heading + decorative rule */}
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionHeadingText}>Key Ingredients</Text>
              <View style={styles.sectionRule} />
            </View>

          </View>

          {/* Scrollable ingredient list */}
          <ScrollView
            style={styles.ingredientScroll}
            contentContainerStyle={styles.ingredientScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {recipe.ingredients.map((raw, i) => {
              const { quantity, name } = parseIngredient(raw);
              return (
                <View key={i} style={styles.ingredientRow}>
                  <MaterialIcons
                    name="check-circle"
                    size={18}
                    color={Colors.primary}
                    style={styles.ingredientCheck}
                  />
                  <Text style={styles.ingredientName} numberOfLines={1}>
                    {name}
                  </Text>
                  {quantity !== '' && (
                    <Text style={styles.ingredientQuantity}>{quantity}</Text>
                  )}
                </View>
              );
            })}
          </ScrollView>

        </View>
      </Animated.View>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  // Outer wrapper — fills whatever the parent gives; no overflow restriction
  // so that both faces can rotate freely without being clipped.
  flipContainer: {
    flex: 1,
  },

  // Each face absolutely fills the container and hides its back surface so
  // only one face is visible at any point during the rotation.
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: 'hidden',
    borderRadius: Radius.r400,
    overflow: 'hidden',
  },

  // ── Front face ──────────────────────────────────────────────────────────
  card: {
    flex: 1,
    borderRadius: Radius.r400,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },

  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 24,
    justifyContent: 'flex-end',
  },

  title: {
    fontFamily: FontFamily.heading,
    fontSize: 36,
    lineHeight: 36 * 1.1,
    fontWeight: FontWeight.bold,
    color: '#ffffff',
    marginBottom: 12,
  },

  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.30)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
  },

  badgeText: {
    fontFamily: FontFamily.headingSemibold,
    fontSize: 12,
    lineHeight: FontSize.bodySmall * LineHeight.tight,
    fontWeight: FontWeight.regular,
    color: '#ffffff',
  },

  likeLabel: {
    position: 'absolute',
    top: 44,
    left: 20,
    transform: [{ rotate: '-15deg' }],
    borderWidth: 3,
    borderColor: '#4CAF50',
    borderRadius: Radius.r100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  likeLabelText: {
    fontFamily: FontFamily.heading,
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: '#4CAF50',
    letterSpacing: 3,
  },

  nopeLabel: {
    position: 'absolute',
    top: 44,
    right: 20,
    transform: [{ rotate: '15deg' }],
    borderWidth: 3,
    borderColor: '#FF4444',
    borderRadius: Radius.r100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  nopeLabelText: {
    fontFamily: FontFamily.heading,
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: '#FF4444',
    letterSpacing: 3,
  },

  // ── Back face ────────────────────────────────────────────────────────────
  backCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.r400,
    overflow: 'hidden',
  },

  backTop: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 16,
  },

  backCategory: {
    fontFamily: FontFamily.headingSemibold,
    fontSize: 12,
    color: Colors.primary,
    letterSpacing: 1.5,
    marginBottom: 6,
  },

  backTitle: {
    fontFamily: FontFamily.heading,
    fontSize: 28,
    lineHeight: 28 * 1.1,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 16,
  },

  backPillRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },

  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },

  backPillText: {
    fontFamily: FontFamily.headingSemibold,
    fontSize: 13,
    lineHeight: 13,
    fontWeight: FontWeight.regular,
  },

  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  sectionHeadingText: {
    fontFamily: FontFamily.headingSemibold,
    fontSize: FontSize.bodySmall,
    color: Colors.textPrimary,
    lineHeight: FontSize.bodySmall,
  },

  // Decorative rule to the right of the heading text
  sectionRule: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },

  ingredientScroll: {
    flex: 1,
  },

  ingredientScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 8,
  },

  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radius.r400,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  ingredientCheck: {
    marginRight: 10,
  },

  ingredientName: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodySmall,
    color: Colors.textPrimary,
  },

  ingredientQuantity: {
    fontFamily: FontFamily.headingSemibold,
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
});

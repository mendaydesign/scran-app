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
  Radius,
} from '@/constants/tokens';

// ─── Badge colour maps (spec colours from design) ────────────────────────────
const DIFFICULTY_BADGE: Record<string, { bg: string; fg: string }> = {
  Easy:   { bg: '#D5FB2A', fg: '#3A5500' },
  Medium: { bg: '#FBA42A', fg: '#4C310C' },
  Hard:   { bg: '#FB2A2A', fg: '#FFE2E2' },
};
const BOLT_COUNT: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 };
const TIME_BADGE   = { bg: '#B8F9D7', fg: '#226248' };
const SERVES_BADGE = { bg: '#F9B8F5', fg: '#4A3849' };

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
          {/* Full-bleed recipe image.
              priority="high"  → tells the native image pipeline to load
                                 eagerly (important for back-stack cards that
                                 must be ready before they reach the top).
              transition={0}   → no fade-in so locally bundled assets appear
                                 instantly rather than fading from blank. */}
          <Image
            source={recipe.imageUrl}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            priority="high"
            transition={0}
          />

          {/* Matched Ingredients — top-left, pantry mode only */}
          {matchBadge && (
            <View style={styles.matchRow}>
              <BlurView intensity={60} tint="light" style={[styles.badge, styles.matchBadge]}>
                <Ionicons name="basket-outline" size={14} color="#ffffff" />
                <Text style={[styles.badgeText, { color: '#ffffff' }]}>
                  {matchBadge.matched}/{matchBadge.total}
                </Text>
              </BlurView>
              <Text style={styles.matchLabel}>Matched Ingredients</Text>
            </View>
          )}

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

            {/* Cook time · difficulty · serves */}
            <View style={styles.badgeRow}>
              {/* Cook time */}
              <View style={[styles.badge, { backgroundColor: TIME_BADGE.bg }]}>
                <Ionicons name="time-outline" size={14} color={TIME_BADGE.fg} />
                <Text style={[styles.badgeText, { color: TIME_BADGE.fg }]}>
                  {formatCookTime(recipe.cookTime).toUpperCase()}
                </Text>
              </View>

              {/* Difficulty — bolt count matches level */}
              {(() => {
                const { bg, fg } = DIFFICULTY_BADGE[recipe.difficulty] ?? DIFFICULTY_BADGE.Easy;
                const bolts = BOLT_COUNT[recipe.difficulty] ?? 1;
                return (
                  <View style={[styles.badge, { backgroundColor: bg }]}>
                    {Array.from({ length: bolts }).map((_, i) => (
                      <MaterialIcons
                        key={i}
                        name="bolt"
                        size={14}
                        color={fg}
                        style={i > 0 ? { marginLeft: -5 } : undefined}
                      />
                    ))}
                    <Text style={[styles.badgeText, { color: fg }]}>
                      {recipe.difficulty.toUpperCase()}
                    </Text>
                  </View>
                );
              })()}

              {/* Serves */}
              <View style={[styles.badge, { backgroundColor: SERVES_BADGE.bg }]}>
                <Ionicons name="people-outline" size={14} color={SERVES_BADGE.fg} />
                <Text style={[styles.badgeText, { color: SERVES_BADGE.fg }]}>
                  SERVES {recipe.servings}
                </Text>
              </View>
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
              {/* Cook time */}
              <View style={[styles.backPill, { backgroundColor: TIME_BADGE.bg }]}>
                <MaterialIcons name="access-time" size={14} color={TIME_BADGE.fg} />
                <Text style={[styles.backPillText, { color: TIME_BADGE.fg }]}>
                  {formatCookTime(recipe.cookTime).toUpperCase()}
                </Text>
              </View>

              {/* Difficulty — bolt count matches level (1 = Easy, 2 = Medium, 3 = Hard) */}
              {(() => {
                const { bg, fg } = DIFFICULTY_BADGE[recipe.difficulty] ?? DIFFICULTY_BADGE.Easy;
                const bolts = BOLT_COUNT[recipe.difficulty] ?? 1;
                return (
                  <View style={[styles.backPill, { backgroundColor: bg }]}>
                    {Array.from({ length: bolts }).map((_, i) => (
                      <MaterialIcons
                        key={i}
                        name="bolt"
                        size={14}
                        color={fg}
                        style={i > 0 ? { marginLeft: -5 } : undefined}
                      />
                    ))}
                    <Text style={[styles.backPillText, { color: fg }]}>
                      {recipe.difficulty.toUpperCase()}
                    </Text>
                  </View>
                );
              })()}
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

  // "Matched Ingredients" — absolutely pinned to top-left of card
  matchRow: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },

  matchLabel: {
    fontFamily: FontFamily.headingSemibold,
    fontSize: FontSize.bodySmall,
    color: 'rgba(255,255,255,0.85)',
  },

  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'nowrap',
    alignItems: 'center',
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
    flexShrink: 1,
  },

  // Applied in addition to badge for the pantry match pill only
  matchBadge: {
    backgroundColor: 'rgba(255,255,255,0.30)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
  },

  badgeText: {
    fontFamily: FontFamily.heading,
    fontSize: 12,
    lineHeight: 12,
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
    fontFamily: FontFamily.heading,
    fontSize: 13,
    lineHeight: 13,
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

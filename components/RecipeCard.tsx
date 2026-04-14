// RecipeCard — pure UI component for a single recipe card.
// Receives an optional swipeProgress shared value from the parent SwipeStack
// to drive the LIKE / NOPE overlay opacity. No gesture logic lives here.

import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useSharedValue,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import type { Recipe, Difficulty } from '@/types/recipe';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  LineHeight,
  Radius,
} from '@/constants/tokens';

// Colours for the difficulty badge — not in the main token set yet
const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  Easy: '#4CAF50',
  Medium: '#FF9800',
  Hard: '#FF4444',
};

// Format minutes into a human-readable cook time string
function formatCookTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

interface RecipeCardProps {
  recipe: Recipe;
  // swipeProgress is only passed to the top card; drives LIKE / NOPE opacity.
  // For back cards it is undefined and the overlays remain invisible.
  swipeProgress?: SharedValue<number>;
  stackDepth: number; // 0 = top, 1 = behind, 2 = furthest back
  // When pantry mode is active the parent passes how many ingredients matched.
  matchBadge?: { matched: number; total: number };
}

// Colour for the match badge based on the match ratio
function matchColor(matched: number, total: number): string {
  if (total === 0) return Colors.textSecondary;
  const ratio = matched / total;
  if (ratio >= 0.7) return '#4CAF50';
  if (ratio >= 0.4) return '#FF9800';
  return '#FF4444';
}

export default function RecipeCard({
  recipe,
  swipeProgress,
  matchBadge,
}: RecipeCardProps) {
  // Fallback so useAnimatedStyle always has a SharedValue to read —
  // avoids conditional hook calls for non-top cards.
  const fallback = useSharedValue(0);
  const progress = swipeProgress ?? fallback;

  // LIKE overlay fades in as the card is dragged right
  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.35],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  // NOPE overlay fades in as the card is dragged left
  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [-0.35, 0],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const difficultyColor = DIFFICULTY_COLOR[recipe.difficulty];

  return (
    <View style={styles.card}>
      {/* Full-bleed recipe image */}
      <Image
        source={recipe.imageUrl}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
      />

      {/* Dark overlay so text is readable over any image */}
      <View style={styles.infoOverlay}>
        {/* Recipe title */}
        <Text style={styles.title} numberOfLines={2}>
          {recipe.title}
        </Text>

        {/* Metadata badges */}
        <View style={styles.badgeRow}>
          {/* Cook time */}
          <View style={styles.badge}>
            <Ionicons
              name="time-outline"
              size={14}
              color={Colors.textPrimary}
            />
            <Text style={styles.badgeText}>
              {formatCookTime(recipe.cookTime)}
            </Text>
          </View>

          {/* Difficulty */}
          <View style={styles.badge}>
            <Text style={[styles.badgeText, { color: difficultyColor }]}>
              {recipe.difficulty}
            </Text>
          </View>

          {/* Pantry match — only shown when parent passes matchBadge */}
          {matchBadge && (() => {
            const color = matchColor(matchBadge.matched, matchBadge.total);
            return (
              <View style={styles.badge}>
                <Ionicons name="basket-outline" size={14} color={color} />
                <Text style={[styles.badgeText, { color }]}>
                  {matchBadge.matched}/{matchBadge.total}
                </Text>
              </View>
            );
          })()}
        </View>
      </View>

      {/* LIKE label — top left, tilted */}
      <Animated.View style={[styles.likeLabel, likeStyle]}>
        <Text style={styles.likeLabelText}>LIKE</Text>
      </Animated.View>

      {/* NOPE label — top right, tilted */}
      <Animated.View style={[styles.nopeLabel, nopeStyle]}>
        <Text style={styles.nopeLabelText}>NOPE</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Radius.r400,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },

  // Semi-transparent gradient-like panel at the bottom of the card
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },

  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.heading,
    lineHeight: FontSize.heading * LineHeight.heading,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 10,
  },

  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  badgeText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodySmall,
    lineHeight: FontSize.bodySmall * LineHeight.tight,
    fontWeight: FontWeight.regular,
    color: Colors.textPrimary,
  },

  // LIKE stamp — top-left corner, rotated counter-clockwise
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

  // NOPE stamp — top-right corner, rotated clockwise
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
});

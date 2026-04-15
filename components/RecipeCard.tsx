// RecipeCard — pure UI component for a single recipe card.
// Receives an optional swipeProgress shared value from the parent SwipeStack
// to drive the LIKE / NOPE overlay opacity. No gesture logic lives here.

import { StyleSheet, Text, View } from 'react-native';
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

import type { Recipe } from '@/types/recipe';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  LineHeight,
  Radius,
} from '@/constants/tokens';

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

  return (
    <View style={styles.card}>
      {/* Full-bleed recipe image */}
      <Image
        source={recipe.imageUrl}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
      />

      {/* Bottom-up gradient overlay — #004B33 from 95% opacity at bottom to transparent at top */}
      <LinearGradient
        colors={['rgba(0,75,51,0)', 'rgba(0,75,51,0.40)', 'rgba(0,75,51,0.95)']}
        locations={[0, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.infoOverlay}
      >
        {/* Recipe title — uppercase, large, bold */}
        <Text style={styles.title} numberOfLines={2}>
          {recipe.title.toUpperCase()}
        </Text>

        {/* Metadata badges — glassmorphism: blurred background + white tint */}
        <View style={styles.badgeRow}>
          {/* Cook time */}
          <BlurView intensity={60} tint="light" style={styles.badge}>
            <Ionicons name="time-outline" size={14} color="#ffffff" />
            <Text style={styles.badgeText}>
              {formatCookTime(recipe.cookTime)}
            </Text>
          </BlurView>

          {/* Difficulty */}
          <BlurView intensity={60} tint="light" style={styles.badge}>
            <Ionicons name="restaurant-outline" size={14} color="#ffffff" />
            <Text style={styles.badgeText}>{recipe.difficulty}</Text>
          </BlurView>

          {/* Pantry match — only shown when parent passes matchBadge */}
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

  // LinearGradient overlay spanning the bottom half of the card
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

  // Glassmorphism badge — BlurView requires overflow:hidden to clip to pill shape
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

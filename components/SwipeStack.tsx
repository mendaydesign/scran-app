// SwipeStack — manages the animated card stack and all swipe gesture logic.
// Renders up to 3 cards (top + 2 behind). Only the top card receives gestures.
// Exposes an imperative `triggerSwipeRef` so parent action buttons can fire swipes.

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import type { Recipe } from '@/types/recipe';
import { Colors, FontFamily, FontSize, FontWeight, Radius } from '@/constants/tokens';
import RecipeCard from './RecipeCard';

// ─── Constants ────────────────────────────────────────────────────────────────

// How far (px) the user must drag horizontally to trigger a swipe
const SWIPE_THRESHOLD = 120;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Distance the card travels off-screen after a confirmed swipe
const FLY_DISTANCE = SCREEN_WIDTH * 1.5;

// ─── Types ────────────────────────────────────────────────────────────────────

interface SwipeStackProps {
  recipes: Recipe[];
  onSwipeLeft?: (recipe: Recipe) => void;
  onSwipeRight?: (recipe: Recipe) => void;
  // Parent attaches a ref here to trigger programmatic swipes (e.g. from buttons)
  triggerSwipeRef?: React.MutableRefObject<
    ((direction: 'left' | 'right') => void) | null
  >;
  // When provided, each card shows a pantry match badge (matched/total ingredients)
  pantryItems?: string[];
}

// How many ingredients in a recipe match any item in the pantry.
// Uses case-insensitive substring matching so "garlic" matches "4 garlic cloves, minced".
function calcMatch(
  recipe: Recipe,
  pantryItems: string[],
): { matched: number; total: number } {
  const total = recipe.ingredients.length;
  const matched = recipe.ingredients.filter((ingredient) =>
    pantryItems.some(
      (item) =>
        item.trim().length > 0 &&
        ingredient.toLowerCase().includes(item.trim().toLowerCase()),
    ),
  ).length;
  return { matched, total };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SwipeStack({
  recipes,
  onSwipeLeft,
  onSwipeRight,
  triggerSwipeRef,
  pantryItems,
}: SwipeStackProps) {
  // Index of the card currently on top of the stack
  const [currentIndex, setCurrentIndex] = useState(0);

  // Shared values for the top card's drag position and a normalised progress
  // value (~translateX / SWIPE_THRESHOLD) that drives overlays and back-card
  // animations on the UI thread without bouncing through React state.
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const swipeProgress = useSharedValue(0);

  // ── JS-thread helpers ──────────────────────────────────────────────────────

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // Called (on JS thread via runOnJS) once a card finishes its fly-off animation
  const handleSwipeComplete = useCallback(
    (direction: 'left' | 'right') => {
      if (direction === 'right') {
        onSwipeRight?.(recipes[currentIndex]);
      } else {
        onSwipeLeft?.(recipes[currentIndex]);
      }

      // Reset shared values before React re-renders so the new top card
      // starts centred with no transform carried over from the dismissed card.
      translateX.value = 0;
      translateY.value = 0;
      swipeProgress.value = 0;

      setCurrentIndex((i) => i + 1);
    },
    [
      currentIndex,
      recipes,
      onSwipeLeft,
      onSwipeRight,
      translateX,
      translateY,
      swipeProgress,
    ],
  );

  // Store the latest handler in a ref so the pan gesture's useMemo (empty deps)
  // always calls the up-to-date version without needing to be recreated.
  const handleSwipeCompleteRef = useRef(handleSwipeComplete);
  useEffect(() => {
    handleSwipeCompleteRef.current = handleSwipeComplete;
  }, [handleSwipeComplete]);

  // A stable wrapper that reads from the ref — safe to pass to runOnJS inside
  // the gesture's empty-deps useMemo.
  const stableHandleSwipeComplete = useCallback(
    (direction: 'left' | 'right') => {
      handleSwipeCompleteRef.current(direction);
    },
    [],
  );

  // ── Pan gesture ────────────────────────────────────────────────────────────

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
          // Track horizontal drag; dampen vertical movement for a more natural feel
          translateX.value = e.translationX;
          translateY.value = e.translationY * 0.35;
          // Normalised progress: 1 at right-threshold, -1 at left-threshold
          swipeProgress.value = e.translationX / SWIPE_THRESHOLD;
        })
        .onEnd((e) => {
          const isSwipeRight = e.translationX > SWIPE_THRESHOLD;
          const isSwipeLeft = e.translationX < -SWIPE_THRESHOLD;

          if (isSwipeRight || isSwipeLeft) {
            // Fly the card off screen then notify JS thread
            const target = isSwipeRight ? FLY_DISTANCE : -FLY_DISTANCE;
            const direction = isSwipeRight ? 'right' : 'left';

            runOnJS(triggerHaptic)();

            translateX.value = withTiming(
              target,
              { duration: 280 },
              (finished) => {
                if (finished) runOnJS(stableHandleSwipeComplete)(direction);
              },
            );
          } else {
            // Snap back to centre
            translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
            translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
            swipeProgress.value = withSpring(0, {
              damping: 20,
              stiffness: 200,
            });
          }
        }),
    // These are stable callbacks (useCallback with [] deps) so this memo
    // is effectively created once.
    [triggerHaptic, stableHandleSwipeComplete],
  );

  // ── Animated styles ────────────────────────────────────────────────────────

  // Top card: translate + rotate based on drag distance
  const topCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-15, 0, 15],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  // Second card: animates toward top-card size as the top card is dragged
  const backCard1Style = useAnimatedStyle(() => {
    const progress = Math.min(Math.abs(swipeProgress.value), 1);
    return {
      transform: [
        {
          scale: interpolate(
            progress,
            [0, 1],
            [0.95, 1.0],
            Extrapolation.CLAMP,
          ),
        },
        {
          translateY: interpolate(
            progress,
            [0, 1],
            [8, 0],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  // Third card: animates toward second-card size as the top card is dragged
  const backCard2Style = useAnimatedStyle(() => {
    const progress = Math.min(Math.abs(swipeProgress.value), 1);
    return {
      transform: [
        {
          scale: interpolate(
            progress,
            [0, 1],
            [0.90, 0.95],
            Extrapolation.CLAMP,
          ),
        },
        {
          translateY: interpolate(
            progress,
            [0, 1],
            [16, 8],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  // ── Imperative trigger (for action buttons) ────────────────────────────────

  useEffect(() => {
    if (!triggerSwipeRef) return;

    triggerSwipeRef.current = (direction: 'left' | 'right') => {
      if (currentIndex >= recipes.length) return;

      triggerHaptic();

      const target = direction === 'right' ? FLY_DISTANCE : -FLY_DISTANCE;
      translateX.value = withTiming(
        target,
        { duration: 280 },
        (finished) => {
          if (finished) runOnJS(stableHandleSwipeComplete)(direction);
        },
      );
    };
  }, [
    currentIndex,
    recipes.length,
    triggerHaptic,
    stableHandleSwipeComplete,
    triggerSwipeRef,
    translateX,
  ]);

  // ── Render ─────────────────────────────────────────────────────────────────

  // Empty state — all cards have been swiped
  if (currentIndex >= recipes.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>You've seen them all!</Text>
        <Text style={styles.emptySubtitle}>
          Check back later for more recipes.
        </Text>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => setCurrentIndex(0)}
          accessibilityLabel="Start over — see all recipes again"
        >
          <Text style={styles.resetButtonText}>Start Over</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Build a list of card indices to render (back-to-front so the last item in
  // the array sits on top in React Native's paint order).
  const visibleIndices = [currentIndex + 2, currentIndex + 1, currentIndex]
    .filter((i) => i < recipes.length);

  return (
    <View style={styles.container}>
      {visibleIndices.map((recipeIndex) => {
        const depth = recipeIndex - currentIndex; // 0 = top, 1 = behind, 2 = furthest
        const isTop = depth === 0;
        const cardAnimStyle =
          isTop
            ? topCardStyle
            : depth === 1
              ? backCard1Style
              : backCard2Style;

        return (
          <Animated.View
            key={recipes[recipeIndex].id}
            style={[styles.cardContainer, cardAnimStyle]}
          >
            {isTop ? (
              // Only the top card is interactive
              <GestureDetector gesture={panGesture}>
                <RecipeCard
                  recipe={recipes[recipeIndex]}
                  swipeProgress={swipeProgress}
                  stackDepth={0}
                  matchBadge={
                    pantryItems && pantryItems.length > 0
                      ? calcMatch(recipes[recipeIndex], pantryItems)
                      : undefined
                  }
                />
              </GestureDetector>
            ) : (
              <RecipeCard
                recipe={recipes[recipeIndex]}
                stackDepth={depth}
                matchBadge={
                  pantryItems && pantryItems.length > 0
                    ? calcMatch(recipes[recipeIndex], pantryItems)
                    : undefined
                }
              />
            )}
          </Animated.View>
        );
      })}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Fills whatever space the parent gives it; cards are absolutely positioned
  // inside so they all occupy the same space and stack visually.
  container: {
    flex: 1,
  },

  // Each card absolutely fills the container; z-order comes from render order.
  // Shadow lives here (not inside RecipeCard) because overflow:hidden on the
  // card clips shadows — the parent must be shadow-owner.
  cardContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Radius.r400,
    // backgroundColor is required on iOS for shadows to render —
    // a view with no background colour casts no shadow.
    backgroundColor: '#fffcf6',
    // Ambient shadow — tinted, not pure black, barely perceptible
    shadowColor: '#383834',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.10,
    shadowRadius: 32,
    elevation: 8,
  },

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
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
    marginBottom: 16,
  },

  resetButton: {
    marginTop: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    minHeight: 44,
    justifyContent: 'center',
    shadowColor: '#383834',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  resetButtonText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.bodyBase,
    fontWeight: FontWeight.bold,
    color: Colors.onPrimary,
  },
});

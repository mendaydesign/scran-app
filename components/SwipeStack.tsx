// SwipeStack — manages the animated card stack and all swipe/flip gesture logic.
// Renders up to 3 cards (top + 2 behind). Only the top card receives gestures.
//
// Interactions on the top card:
//   • Tap  → flip to reveal the recipe back face (400ms ease-in-out)
//   • Drag → swipe left (skip) or right (save); disabled while card is flipped
//
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
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import type { Recipe } from '@/types/recipe';
import { Colors, FontFamily, FontSize, FontWeight, Radius } from '@/constants/tokens';
import { ingredientMatches } from '@/utils/ingredientUtils';
import RecipeCard from './RecipeCard';

// ─── Constants ────────────────────────────────────────────────────────────────

const SWIPE_THRESHOLD = 120;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FLY_DISTANCE = SCREEN_WIDTH * 1.5;

// ─── Types ────────────────────────────────────────────────────────────────────

interface SwipeStackProps {
  recipes: Recipe[];
  onSwipeLeft?: (recipe: Recipe) => void;
  onSwipeRight?: (recipe: Recipe) => void;
  triggerSwipeRef?: React.MutableRefObject<
    ((direction: 'left' | 'right') => void) | null
  >;
  pantryItems?: string[];
}

function calcMatch(
  recipe: Recipe,
  pantryItems: string[],
): { matched: number; total: number } {
  const total = recipe.ingredients.length;
  const matched = recipe.ingredients.filter((ingredient) =>
    pantryItems.some(
      (item) => item.trim().length > 0 && ingredientMatches(ingredient, item),
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
  const [currentIndex, setCurrentIndex] = useState(0);

  // ── Flip state ────────────────────────────────────────────────────────────
  // isFlipped (React state) controls whether the pan gesture is enabled.
  // flipProgress (SharedValue) drives the 3D rotation animation in RecipeCard.
  const [isFlipped, setIsFlipped] = useState(false);
  const isFlippedRef = useRef(false);
  const flipProgress = useSharedValue(0);

  // ── Swipe shared values ───────────────────────────────────────────────────
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const swipeProgress = useSharedValue(0);
  // Opacity of the departing card. Set to 0 the instant the fly-off animation
  // finishes — before any position values are reset and before setCurrentIndex
  // fires. This guarantees the old card is invisible during the one-frame gap
  // between the translateX snap-back and React removing it from the DOM.
  const exitOpacity = useSharedValue(1);

  // ── JS-thread helpers ──────────────────────────────────────────────────────

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // Called (on JS thread via runOnJS) the instant the fly-off animation ends.
  //
  // Sequence that eliminates all ghost/flash artefacts:
  //   1. exitOpacity → 0  — card becomes invisible while still at FLY_DISTANCE.
  //                          This happens before any position reset and before
  //                          React re-renders, so there is no frame where the old
  //                          card is visible at the centre of the screen.
  //   2. setCurrentIndex  — React removes the old card and promotes the next one.
  //   3. useEffect below  — after React commits, reset all shared values for the
  //                          fresh swipe cycle (translateX, translateY,
  //                          swipeProgress, exitOpacity).
  //
  // Crucially, translateX is NOT reset here. Resetting it before setCurrentIndex
  // snapped the departing card back to x=0 for one frame, which was the ghost.
  const handleSwipeComplete = useCallback(
    (direction: 'left' | 'right') => {
      // Step 1 — hide the departing card before anything else moves
      exitOpacity.value = 0;

      if (direction === 'right') {
        onSwipeRight?.(recipes[currentIndex]);
      } else {
        onSwipeLeft?.(recipes[currentIndex]);
      }

      // Reset flip state for the next card
      isFlippedRef.current = false;
      setIsFlipped(false);
      flipProgress.value = 0;

      // Step 2 — trigger the re-render that removes the old card
      setCurrentIndex((i) => i + 1);
    },
    [
      currentIndex,
      recipes,
      onSwipeLeft,
      onSwipeRight,
      exitOpacity,
      flipProgress,
    ],
  );

  // Step 3 — reset all shared values after React has committed the new index.
  // The old card is already unmounted by the time this runs, so resetting
  // translateX to 0 here only affects the new top card (which starts centred).
  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
    swipeProgress.value = 0;
    exitOpacity.value = 1;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const handleSwipeCompleteRef = useRef(handleSwipeComplete);
  useEffect(() => {
    handleSwipeCompleteRef.current = handleSwipeComplete;
  }, [handleSwipeComplete]);

  const stableHandleSwipeComplete = useCallback(
    (direction: 'left' | 'right') => {
      handleSwipeCompleteRef.current(direction);
    },
    [],
  );

  // ── Tap handler — toggles the card flip ───────────────────────────────────

  // stableHandleTap reads from isFlippedRef so it never goes stale even though
  // the gesture's useMemo has no deps on the flip booleans.
  const stableHandleTap = useCallback(() => {
    const next = !isFlippedRef.current;
    isFlippedRef.current = next;
    setIsFlipped(next);
    flipProgress.value = withTiming(next ? 1 : 0, {
      duration: 450,
      easing: Easing.inOut(Easing.ease),
    });
  }, [flipProgress]);

  // ── Pan gesture ────────────────────────────────────────────────────────────
  // activeOffsetX ensures tiny finger movements (< ±8 px) don't activate the
  // pan gesture, giving the tap gesture room to fire on quick touches.
  // enabled(!isFlipped) disables swiping entirely while the back face is shown.

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-8, 8])
        .enabled(!isFlipped)
        .onUpdate((e) => {
          translateX.value = e.translationX;
          translateY.value = e.translationY * 0.35;
          swipeProgress.value = e.translationX / SWIPE_THRESHOLD;
        })
        .onEnd((e) => {
          const isSwipeRight = e.translationX > SWIPE_THRESHOLD;
          const isSwipeLeft = e.translationX < -SWIPE_THRESHOLD;

          if (isSwipeRight || isSwipeLeft) {
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
            translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
            translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
            swipeProgress.value = withSpring(0, { damping: 20, stiffness: 200 });
          }
        }),
    // isFlipped is included so the gesture re-evaluates its enabled state
    // whenever the card is flipped or unflipped.
    [triggerHaptic, stableHandleSwipeComplete, isFlipped],
  );

  // ── Tap gesture ────────────────────────────────────────────────────────────
  // maxDistance(10) ensures the tap doesn't fire if the user drags the card
  // even slightly — only true stationary taps trigger the flip.

  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDistance(10)
        .onEnd(() => {
          runOnJS(stableHandleTap)();
        }),
    [stableHandleTap],
  );

  // ── Composed gesture ───────────────────────────────────────────────────────
  // Race: whichever gesture activates first wins and cancels the other.
  // For a drag the pan activates first (movement exceeds activeOffsetX ±8).
  // For a tap the pan never activates (no movement), so tap wins on finger-up.

  const composedGesture = useMemo(
    () => Gesture.Race(tapGesture, panGesture),
    [tapGesture, panGesture],
  );

  // Stable no-op gesture for back cards.
  // Every card in the stack is always wrapped with GestureDetector — back cards
  // use this disabled gesture so the component tree shape is identical at every
  // depth. This means React sees the same GestureDetector→RecipeCard structure
  // regardless of a card's position, so RecipeCard is NEVER unmounted and
  // remounted when a card advances from the back of the stack to the top.
  // Without this, the GestureDetector insertion when depth changes 1→0 causes
  // React to treat the inner RecipeCard as a brand-new component, restarting
  // the expo-image load and producing a blank-image flash on every swipe.
  const disabledGesture = useMemo(() => Gesture.Tap().enabled(false), []);

  // ── Animated styles ────────────────────────────────────────────────────────

  const topCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-15, 0, 15],
      Extrapolation.CLAMP,
    );
    return {
      opacity: exitOpacity.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const backCard1Style = useAnimatedStyle(() => {
    const progress = Math.min(Math.abs(swipeProgress.value), 1);
    return {
      transform: [
        { scale: interpolate(progress, [0, 1], [0.95, 1.0], Extrapolation.CLAMP) },
        { translateY: interpolate(progress, [0, 1], [8, 0], Extrapolation.CLAMP) },
      ],
    };
  });

  const backCard2Style = useAnimatedStyle(() => {
    const progress = Math.min(Math.abs(swipeProgress.value), 1);
    return {
      transform: [
        { scale: interpolate(progress, [0, 1], [0.90, 0.95], Extrapolation.CLAMP) },
        { translateY: interpolate(progress, [0, 1], [16, 8], Extrapolation.CLAMP) },
      ],
    };
  });

  // Fourth card — sits directly behind backCard2, visually identical at rest.
  // Pre-rendering it ensures the card that becomes the new backCard2 after a
  // swipe is already mounted with its image loaded, so there is no mount-flash.
  const backCard3Style = useAnimatedStyle(() => {
    const progress = Math.min(Math.abs(swipeProgress.value), 1);
    return {
      transform: [
        { scale: interpolate(progress, [0, 1], [0.90, 0.95], Extrapolation.CLAMP) },
        { translateY: interpolate(progress, [0, 1], [16, 8], Extrapolation.CLAMP) },
      ],
    };
  });

  // ── Imperative trigger (for action buttons) ────────────────────────────────

  useEffect(() => {
    if (!triggerSwipeRef) return;

    triggerSwipeRef.current = (direction: 'left' | 'right') => {
      // Don't fire while the card is flipped — user must flip back first
      if (isFlippedRef.current) return;
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

  if (currentIndex >= recipes.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>You've seen them all!</Text>
        <Text style={styles.emptySubtitle}>
          Check back later for more recipes.
        </Text>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => {
            setCurrentIndex(0);
            isFlippedRef.current = false;
            setIsFlipped(false);
            flipProgress.value = 0;
          }}
          accessibilityLabel="Start over — see all recipes again"
        >
          <Text style={styles.resetButtonText}>Start Over</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render 4 cards (top + 3 behind) so the card that will become backCard2
  // after the next swipe is already mounted with its image painted — no fresh
  // mount flash when the stack advances.
  const visibleIndices = [
    currentIndex + 3,
    currentIndex + 2,
    currentIndex + 1,
    currentIndex,
  ].filter((i) => i < recipes.length);

  return (
    <View style={styles.container}>
      {visibleIndices.map((recipeIndex) => {
        const depth = recipeIndex - currentIndex;
        const isTop = depth === 0;
        const cardAnimStyle =
          isTop
            ? topCardStyle
            : depth === 1
              ? backCard1Style
              : depth === 2
                ? backCard2Style
                : backCard3Style;

        return (
          <Animated.View
            key={recipes[recipeIndex].id}
            style={[styles.cardContainer, cardAnimStyle]}
            // Android: promote to a hardware GPU layer so transforms run
            // without re-compositing the view content each frame.
            // iOS: shouldRasterizeIOS is intentionally omitted — it captures
            // a static bitmap snapshot at render time, but expo-image loads
            // its pixels asynchronously even for local bundled assets.
            // That race produces a blank snapshot that appears during swipes.
            // Reanimated's UI-thread worklets give smooth transforms on iOS
            // without needing an explicit rasterization hint.
            renderToHardwareTextureAndroid
          >
            {/* All cards use the same GestureDetector→RecipeCard tree so
                React never unmounts RecipeCard when depth changes 1→0.
                Back cards receive a disabled noop gesture. */}
            <GestureDetector gesture={isTop ? composedGesture : disabledGesture}>
              <RecipeCard
                recipe={recipes[recipeIndex]}
                swipeProgress={isTop ? swipeProgress : undefined}
                flipProgress={isTop ? flipProgress : undefined}
                stackDepth={depth}
                matchBadge={
                  pantryItems && pantryItems.length > 0
                    ? calcMatch(recipes[recipeIndex], pantryItems)
                    : undefined
                }
              />
            </GestureDetector>
          </Animated.View>
        );
      })}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  cardContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Radius.r400,
    backgroundColor: '#fffcf6',
    shadowColor: '#383834',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.10,
    shadowRadius: 32,
    elevation: 8,
  },

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

// ToggleSwitch — custom animated toggle matching the SCRAN design system.
//
// Active   → yellow track (Colors.tertiaryContainer, #f4e645)
// Inactive → off-white track (Colors.surfaceHigh)
// Both states: dark thumb (Colors.textPrimary) + 2px dark border on the track.
//
// Uses a single 0→1 shared value (progress) to drive both the track colour
// interpolation and the thumb translation in one animation pass.

import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';

import { Colors, Radius } from '@/constants/tokens';

// ─── Geometry ─────────────────────────────────────────────────────────────────

const TRACK_W    = 52;   // total track width
const TRACK_H    = 30;   // total track height (sets the pill dimensions)
const THUMB_SIZE = 22;   // thumb diameter
const THUMB_PAD  = 3;    // gap between thumb edge and track inner edge
const BORDER_W   = 2;    // track border width
const DURATION   = 220;  // animation duration in ms

// Derived thumb positions.
// Absolute children are laid out inside the border (content area = TRACK_W − 2×BORDER_W).
// THUMB_X_ON must not exceed (TRACK_W − 2×BORDER_W − THUMB_SIZE − THUMB_PAD) or the
// thumb will clip against the right stroke under overflow:hidden.
const THUMB_X_OFF = THUMB_PAD;
const THUMB_X_ON  = TRACK_W - BORDER_W * 2 - THUMB_SIZE - THUMB_PAD;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ToggleSwitch({
  value,
  onValueChange,
  accessibilityLabel,
}: ToggleSwitchProps) {
  // 0 = off, 1 = on — drives both colour and position
  const progress = useSharedValue(value ? 1 : 0);

  // Animate whenever the controlled `value` prop changes
  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, {
      duration: DURATION,
      easing: Easing.inOut(Easing.ease),
    });
  }, [value, progress]);

  // Track background interpolates between off-white and yellow
  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [Colors.surfaceHigh, Colors.tertiaryContainer],
    ),
  }));

  // Thumb slides left ↔ right
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          THUMB_X_OFF + progress.value * (THUMB_X_ON - THUMB_X_OFF),
      },
    ],
  }));

  return (
    // Pressable is sized to 44px min-height for accessibility; the visual
    // track is centred inside it via justifyContent / alignItems.
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onValueChange(!value);
      }}
      style={styles.pressable}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pressable: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
    minWidth: 44,
  },

  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: Radius.full,
    borderWidth: BORDER_W,
    borderColor: Colors.textPrimary,
    justifyContent: 'center',
    // overflow hidden so the thumb never visually escapes the track pill
    overflow: 'hidden',
  },

  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: Colors.textPrimary,
  },
});

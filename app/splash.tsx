// Splash screen — shown on every launch before onboarding.
// The SCRAN wordmark animates in (opacity, rotation, translateY) then the
// entire screen fades out and hands off to /onboarding.

import { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { Colors, FontFamily } from '@/constants/tokens';

const { width: SCREEN_W } = Dimensions.get('window');

export default function Splash() {
  const router = useRouter();

  // 0 = animation start, 1 = animation end
  const logoAnim    = useSharedValue(0);
  // 1 = fully visible, 0 = fully transparent (for the screen fade-out)
  const screenOpacity = useSharedValue(1);

  const navigateOut = () => router.replace('/onboarding');

  // Logo: fades in, rotates from -12° → 0°, rises 50px into centre
  const logoStyle = useAnimatedStyle(() => ({
    // Clamp opacity so the bezier undershoot (-0.35) doesn't produce opacity < 0
    opacity: interpolate(logoAnim.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [
      // Allow overshoot on translate and rotate — creates the spring feel
      { translateY: interpolate(logoAnim.value, [0, 1], [50, 0]) },
      { rotate: `${interpolate(logoAnim.value, [0, 1], [-12, 0])}deg` },
    ],
  }));

  // Outer screen: fades to 0 after the logo has settled
  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  useEffect(() => {
    // Step 1 — logo entrance (1000ms, custom spring bezier)
    logoAnim.value = withTiming(
      1,
      { duration: 1000, easing: Easing.bezier(0.92, -0.35, 0, 1.33) },
      (finished) => {
        if (!finished) return;
        // Step 2 — 2s hold, then screen fade-out (400ms ease-out)
        screenOpacity.value = withDelay(
          2000,
          withTiming(
            0,
            { duration: 400, easing: Easing.out(Easing.ease) },
            (done) => {
              if (done) runOnJS(navigateOut)();
            },
          ),
        );
      },
    );
  }, []);

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      <Animated.Text style={[styles.wordmark, logoStyle]}>
        SCRAN
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  wordmark: {
    fontFamily: FontFamily.heading,
    // Scale wordmark to roughly 80% of screen width for maximum impact
    fontSize: Math.round(SCREEN_W * 0.21),
    color: '#D5FB2A',
    // Prevent line-wrap on narrow screens
    includeFontPadding: false,
  },
});

// Onboarding — shown only on first launch.
// Architecture: the cream panel is a static View (60 % of screen height).
// A FlatList sits inside it so only the illustration content slides; the text
// below the panel and the top/bottom bars are driven by currentIndex state.
//
// ASSETS NEEDED (wireframes used until provided):
//   • Replace <RecipeCardMockup color="…"> with an <Image> once food photos
//     or real app screenshots are available.

import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ListRenderItem,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, FontFamily, FontSize, Radius } from '@/constants/tokens';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const ONBOARDING_KEY = 'onboarding_complete';
const PANEL_H = SCREEN_H * 0.60;

// Button animation layout constants
const BTN_PADDING_H = 28; // matches bottomBar paddingHorizontal
const BTN_GAP       = 10; // gap between Back and Next when both visible
const BTN_ROW_W     = SCREEN_W - BTN_PADDING_H * 2;
const BTN_HALF_W    = (BTN_ROW_W - BTN_GAP) / 2;

// ─── Slide data ───────────────────────────────────────────────────────────────

interface SlideData {
  key: 'swipe' | 'pantry' | 'start';
  title: string;
  subtitle: string;
}

const SLIDES: SlideData[] = [
  {
    key: 'swipe',
    title: 'Swipe to discover',
    subtitle: 'Swipe right to save a recipe to your collection & left to skip it.',
  },
  {
    key: 'pantry',
    title: 'Use Your Pantry',
    subtitle: "Add what's in your kitchen already and we'll show you the recipes that match.",
  },
  {
    key: 'start',
    title: "You're All Set!",
    subtitle: 'Get swiping then get cooking.',
  },
];

// ─── Phone frame ──────────────────────────────────────────────────────────────

const PHONE_W = 148;
const PHONE_H = 288;

function PhoneFrame({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View style={[phoneStyles.outer, style]}>
      <View style={phoneStyles.islandRow}>
        <View style={phoneStyles.island} />
      </View>
      <View style={phoneStyles.screen}>{children}</View>
      <View style={phoneStyles.homeRow}>
        <View style={phoneStyles.homeBar} />
      </View>
    </View>
  );
}

const phoneStyles = StyleSheet.create({
  outer: {
    width: PHONE_W,
    height: PHONE_H,
    borderRadius: 26,
    backgroundColor: '#111',
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.40,
    shadowRadius: 20,
    elevation: 12,
  },
  islandRow: {
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  island: {
    width: 36,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#111',
  },
  screen: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.background,
  },
  homeRow: {
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
});

// ─── Shared: recipe card wireframe ────────────────────────────────────────────

function RecipeCardMockup({ title, color }: { title: string; color: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: color }}>
      <View style={cardMock.overlay}>
        <View style={cardMock.timeBadge}>
          <Text style={cardMock.badgeText}>20 MIN</Text>
        </View>
        <Text style={cardMock.title} numberOfLines={2}>
          {title.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const cardMock = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    paddingTop: 20,
    backgroundColor: 'rgba(0,40,20,0.80)',
    gap: 4,
  },
  timeBadge: {
    backgroundColor: '#B8F9D7',
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontFamily: FontFamily.heading,
    fontSize: 7,
    color: '#226248',
    lineHeight: 9,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: 11,
    color: '#ffffff',
    lineHeight: 13,
  },
});

// ─── Illustration: Slide 1 — Swipe ───────────────────────────────────────────

const SLIDE1_IMAGE    = require('../assets/onboarding assets/screen 1 image.png'); // Metro auto-selects @2x/@3x variants
const SLIDE2_IMAGE    = require('../assets/onboarding assets/screen 2 image.png');
import OnboardingLogo from '../assets/onboarding assets/Onboarding Logo.svg';

function SwipeIllustration() {
  return (
    <View style={illustrationStyles.root}>
      <Image
        source={SLIDE1_IMAGE}
        style={[swipeStyles.image, { marginBottom: 24 }]}
        contentFit="contain"
      />
    </View>
  );
}

const swipeStyles = StyleSheet.create({
  image: {
    width: SCREEN_W * 0.88,
    height: PANEL_H * 0.73,
  },
});

// ─── Illustration: Slide 2 — Pantry ──────────────────────────────────────────


function PantryIllustration() {
  return (
    <View style={illustrationStyles.root}>
      <Image
        source={SLIDE2_IMAGE}
        style={swipeStyles.image}
        contentFit="contain"
      />
    </View>
  );
}

// ─── Illustration: Slide 3 — You're All Set ───────────────────────────────────

function DiscoverScreenContent() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={discoverMock.header}>
        <Text style={discoverMock.logo}>SCRAN</Text>
      </View>
      <View style={discoverMock.chipsRow}>
        {['Burgers', 'Mexican'].map((chip) => (
          <View key={chip} style={discoverMock.chip}>
            <Text style={discoverMock.chipText}>{chip}</Text>
          </View>
        ))}
      </View>
      <View style={discoverMock.cardStack}>
        <View style={[discoverMock.card, discoverMock.cardBack]}>
          <RecipeCardMockup title="Prawn Pad Thai" color="#1a3d2e" />
        </View>
        <View style={[discoverMock.card, discoverMock.cardFront]}>
          <RecipeCardMockup title="Chicken Tikka" color="#2d5a3d" />
        </View>
      </View>
    </View>
  );
}

const discoverMock = StyleSheet.create({
  header: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 4,
  },
  logo: {
    fontFamily: FontFamily.heading,
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: Colors.primary,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: {
    fontFamily: FontFamily.heading,
    fontSize: 7,
    color: '#ffffff',
    lineHeight: 9,
  },
  cardStack: {
    flex: 1,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  card: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardBack: {
    top: 12,
    transform: [{ rotate: '2deg' }],
    opacity: 0.7,
  },
  cardFront: {
    top: 4,
  },
});

function GetStartedIllustration() {
  return (
    <View style={illustrationStyles.root}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <PhoneFrame style={{ transform: [{ rotate: '-7deg' }], zIndex: 2, marginRight: -16 }}>
          <DiscoverScreenContent />
        </PhoneFrame>
        <PhoneFrame style={{ transform: [{ rotate: '7deg' }], zIndex: 1, marginTop: 24 }}>
          <RecipeCardMockup title="Prawn Pad Thai" color="#1a3d2e" />
        </PhoneFrame>
      </View>
    </View>
  );
}

// Shared illustration wrapper — centres content within the panel cell.
const illustrationStyles = StyleSheet.create({
  root: {
    width: SCREEN_W,
    height: PANEL_H,
    alignItems: 'center',
    justifyContent: 'flex-end',
    // paddingTop prevents content creeping up behind the logo overlay
    paddingTop: 120,
  },
});

// ─── Main Onboarding screen ───────────────────────────────────────────────────

export default function Onboarding() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const listRef = useRef<FlatList<SlideData>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLast = currentIndex === SLIDES.length - 1;
  const slide  = SLIDES[currentIndex];

  // 0 = solo Next (slide 1), 1 = Back + Next (slides 2–3)
  const btnAnim = useSharedValue(0);

  // Back button wrapper: grows from 0 → BTN_HALF_W with a right margin gap.
  // Extrapolation.CLAMP prevents the bezier overshoot from producing negative
  // widths (which would cause a layout glitch mid-animation).
  // Opacity fades in over the first half of the animation.
  const backWrapStyle = useAnimatedStyle(() => ({
    width:       interpolate(btnAnim.value, [0, 1],   [0, BTN_HALF_W], Extrapolation.CLAMP),
    marginRight: interpolate(btnAnim.value, [0, 1],   [0, BTN_GAP],    Extrapolation.CLAMP),
    opacity:     interpolate(btnAnim.value, [0, 0.5], [0, 1],          Extrapolation.CLAMP),
  }));

  // Next button wrapper: shrinks from full row width → BTN_HALF_W
  const nextWrapStyle = useAnimatedStyle(() => ({
    width: interpolate(btnAnim.value, [0, 1], [BTN_ROW_W, BTN_HALF_W], Extrapolation.CLAMP),
  }));

  const SPRING = {
    duration: 500,
    easing: Easing.bezier(0.92, -0.35, 0, 1.33),
  } as const;

  const complete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/discover');
  };

  const handleNext = () => {
    if (isLast) { complete(); return; }
    const next = currentIndex + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setCurrentIndex(next);
    // Animate back button in when leaving slide 1 for the first time
    if (currentIndex === 0) btnAnim.value = withTiming(1, SPRING);
  };

  const handleBack = () => {
    const prev = currentIndex - 1;
    listRef.current?.scrollToIndex({ index: prev, animated: true });
    setCurrentIndex(prev);
    // Animate back button out when returning to slide 1
    if (prev === 0) btnAnim.value = withTiming(0, SPRING);
  };

  const renderItem: ListRenderItem<SlideData> = ({ item }) => {
    switch (item.key) {
      case 'swipe':  return <SwipeIllustration />;
      case 'pantry': return <PantryIllustration />;
      case 'start':  return <GetStartedIllustration />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.primary }]}>

      {/* ── Static cream panel (60 % height) ─────────────────────────────── */}
      {/* The panel itself never moves. The FlatList inside it slides the
          illustration content on button press. */}
      <View style={styles.panel}>
        <FlatList
          ref={listRef}
          data={SLIDES}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          bounces={false}
        />
      </View>

      {/* ── Text content — updates instantly via state ────────────────────── */}
      <View style={styles.textArea}>
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
      </View>

      {/* ── Logo — static, centred at top of cream panel ─────────────────── */}
      <View
        style={[styles.logoOverlay, { top: insets.top + 12 }]}
        pointerEvents="none"
      >
        <OnboardingLogo width={40} height={40} />
      </View>

      {/* ── Skip — top right, always visible ──────────────────────────────── */}
      <View
        style={[styles.topBar, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.skipButton}
          onPress={complete}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* ── Bottom bar: CTA button + dot indicators ────────────────────────── */}
      <View
        style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}
        pointerEvents="box-none"
      >
        {/* Button row — Back grows in from the left as Next shrinks */}
        <View style={styles.buttonRow}>
          <Animated.View style={[styles.backWrap, backWrapStyle]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Go to previous slide"
            >
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.nextWrap, nextWrapStyle]}>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={handleNext}
              accessibilityRole="button"
              accessibilityLabel={isLast ? 'Get started' : 'Next slide'}
            >
              <Text style={styles.ctaText}>{isLast ? 'GO!' : 'Next'}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  container: {
    flex: 1,
  },

  // Static cream panel — never moves, only its FlatList content slides.
  panel: {
    height: PANEL_H,
    backgroundColor: '#FDFAF4',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },

  // Text block below the panel.
  textArea: {
    paddingHorizontal: 28,
    paddingTop: 28,
  },

  slideTitle: {
    fontFamily: FontFamily.heading,
    fontSize: 36,
    lineHeight: 36 * 1.1,
    color: '#ffffff',
    marginBottom: 10,
  },

  slideSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodyBase,
    lineHeight: FontSize.bodyBase * 1.55,
    color: 'rgba(255,255,255,0.70)',
  },

  // ── Logo overlay — static, never scrolls ──────────────────────────────────
  logoOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  // ── Top bar — Skip only, right-aligned ────────────────────────────────────
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },

  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 44,
    justifyContent: 'center',
  },

  skipText: {
    fontFamily: FontFamily.headingSemibold,
    fontSize: FontSize.bodySmall,
    color: '#04492B',
  },

  // ── Bottom bar ─────────────────────────────────────────────────────────────
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    gap: 14,
  },

  // ── Button row ─────────────────────────────────────────────────────────────
  // No alignItems — default 'stretch' lets wrappers fill the row height.
  buttonRow: {
    flexDirection: 'row',
  },

  // Both wrappers have a fixed height (56px) so the layout engine never
  // recalculates the Y axis during the width animation.
  backWrap: {
    height: 56,
    overflow: 'hidden',
  },

  nextWrap: {
    height: 56,
  },

  // Back button — dark green fill, lime border + text.
  // height:'100%' fills the fixed-height wrapper; no paddingVertical so the
  // button height is always exactly 56px regardless of animation state.
  backButton: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: '#D5FB2A',
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.bodyBase,
    lineHeight: FontSize.bodyBase,
    color: '#D5FB2A',
  },

  ctaButton: {
    width: '100%',
    height: '100%',
    backgroundColor: '#D5FB2A',
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 5,
  },

  ctaText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.bodyBase,
    lineHeight: FontSize.bodyBase,
    color: Colors.primary,
  },

  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 4,
  },

  dot: {
    height: 8,
    borderRadius: 4,
  },

  dotActive: {
    width: 24,
    backgroundColor: '#D5FB2A',
  },

  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.30)',
  },
});

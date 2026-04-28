// Onboarding — shown only on first launch.
// Four full-screen slides the user swipes through horizontally.
// On completion (or skip), writes 'onboarding_complete' to AsyncStorage
// so the flow never shows again.

import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ListRenderItem,
  ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors, FontFamily, FontSize, Radius } from '@/constants/tokens';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const ONBOARDING_KEY = 'onboarding_complete';

// ─── Slide shape ──────────────────────────────────────────────────────────────

interface SlideItem {
  key: 'welcome' | 'swipe' | 'pantry' | 'start';
}

const SLIDES: SlideItem[] = [
  { key: 'welcome' },
  { key: 'swipe' },
  { key: 'pantry' },
  { key: 'start' },
];

// Slides 0 and 3 sit on the dark green background; overlays must adapt.
const DARK_BG_SLIDES = new Set([0, 3]);

// ─── Individual slide UIs ─────────────────────────────────────────────────────

function WelcomeSlide() {
  return (
    <View style={[styles.slide, { backgroundColor: Colors.primary }]}>
      {/* Illustration */}
      <View style={styles.illustrationArea}>
        <View style={styles.logoContainer}>
          <Ionicons name="restaurant" size={72} color="#D5FB2A" />
        </View>
        <Text style={styles.wordmark}>SCRAN</Text>
      </View>

      {/* Text */}
      <View style={styles.textArea}>
        <Text style={[styles.slideTitle, { color: '#D5FB2A' }]}>
          Welcome to SCRAN
        </Text>
        <Text style={[styles.slideSubtitle, { color: 'rgba(255,255,255,0.75)' }]}>
          Discover your next favourite meal — one swipe at a time.
        </Text>
      </View>
    </View>
  );
}

function SwipeSlide() {
  return (
    <View style={[styles.slide, { backgroundColor: Colors.background }]}>
      {/* Illustration — mini card mockup with LIKE / NOPE stamps */}
      <View style={styles.illustrationArea}>
        <View style={styles.cardMockupWrapper}>

          {/* The card */}
          <View style={styles.cardMockup}>
            <View style={styles.cardMockupImageArea} />
            <View style={styles.cardMockupFooter}>
              <View style={styles.cardMockupTitleBar} />
              <View style={styles.cardMockupSubBar} />
            </View>
          </View>

          {/* LIKE stamp (top-left, tilted) */}
          <View style={styles.likeStamp}>
            <Text style={styles.likeStampText}>LIKE</Text>
          </View>

          {/* NOPE stamp (top-right, tilted) */}
          <View style={styles.nopeStamp}>
            <Text style={styles.nopeStampText}>NOPE</Text>
          </View>
        </View>

        {/* Direction cues */}
        <View style={styles.directionRow}>
          <View style={[styles.directionBadge, { backgroundColor: '#FB2A2A' }]}>
            <Ionicons name="arrow-back" size={16} color="#FFE2E2" />
            <Text style={[styles.directionLabel, { color: '#FFE2E2' }]}>Skip</Text>
          </View>
          <View style={[styles.directionBadge, { backgroundColor: '#D5FB2A' }]}>
            <Text style={[styles.directionLabel, { color: '#3A5500' }]}>Save</Text>
            <Ionicons name="arrow-forward" size={16} color="#3A5500" />
          </View>
        </View>
      </View>

      {/* Text */}
      <View style={styles.textArea}>
        <Text style={[styles.slideTitle, { color: Colors.textPrimary }]}>
          Swipe to Discover
        </Text>
        <Text style={[styles.slideSubtitle, { color: Colors.textSecondary }]}>
          Swipe right to save a recipe to your collection. Swipe left to skip it.
        </Text>
      </View>
    </View>
  );
}

// Pantry slide — shows a mock ingredient list with a match badge.
const PANTRY_ITEMS = [
  { name: 'Chicken breast', matched: true },
  { name: 'Garlic',         matched: true },
  { name: 'Olive oil',      matched: true },
  { name: 'Lemon',          matched: true },
  { name: 'Paprika',        matched: false },
];

function PantrySlide() {
  return (
    <View style={[styles.slide, { backgroundColor: Colors.surface }]}>
      {/* Illustration */}
      <View style={styles.illustrationArea}>
        <View style={styles.pantryCard}>

          {/* Header row */}
          <View style={styles.pantryHeader}>
            <Ionicons name="basket-outline" size={20} color={Colors.primary} />
            <Text style={styles.pantryHeaderText}>My Pantry</Text>
          </View>

          {/* Ingredient rows */}
          {PANTRY_ITEMS.map((item) => (
            <View key={item.name} style={styles.pantryRow}>
              <View
                style={[
                  styles.pantryDot,
                  { backgroundColor: item.matched ? Colors.primary : Colors.border },
                ]}
              />
              <Text
                style={[
                  styles.pantryItemText,
                  { color: item.matched ? Colors.textPrimary : Colors.textSecondary },
                ]}
              >
                {item.name}
              </Text>
              {item.matched && (
                <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
              )}
            </View>
          ))}

          {/* Match badge */}
          <View style={styles.matchBadge}>
            <Ionicons name="restaurant-outline" size={14} color="#226248" />
            <Text style={styles.matchBadgeText}>4 / 5 ingredients matched</Text>
          </View>
        </View>
      </View>

      {/* Text */}
      <View style={styles.textArea}>
        <Text style={[styles.slideTitle, { color: Colors.textPrimary }]}>
          Use Your Pantry
        </Text>
        <Text style={[styles.slideSubtitle, { color: Colors.textSecondary }]}>
          Add what's in your kitchen and we'll find recipes that match what you already have.
        </Text>
      </View>
    </View>
  );
}

function GetStartedSlide({ onStart }: { onStart: () => void }) {
  return (
    <View style={[styles.slide, { backgroundColor: Colors.primary }]}>
      {/* Illustration */}
      <View style={styles.illustrationArea}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={80} color="#D5FB2A" />
        </View>
      </View>

      {/* Text + CTA */}
      <View style={styles.textArea}>
        <Text style={[styles.slideTitle, { color: '#D5FB2A' }]}>
          You're All Set
        </Text>
        <Text style={[styles.slideSubtitle, { color: 'rgba(255,255,255,0.75)' }]}>
          Your next favourite meal is waiting.
        </Text>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={onStart}
          accessibilityRole="button"
          accessibilityLabel="Get started"
        >
          <Text style={styles.ctaText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Onboarding screen ───────────────────────────────────────────────────

export default function Onboarding() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const listRef  = useRef<FlatList<SlideItem>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Stable refs — FlatList requires these to not change between renders.
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const isLast = currentIndex === SLIDES.length - 1;
  const onDarkBg = DARK_BG_SLIDES.has(currentIndex);

  const complete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/discover');
  };

  const handleNext = () => {
    listRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
  };

  const renderItem: ListRenderItem<SlideItem> = ({ item }) => {
    switch (item.key) {
      case 'welcome': return <WelcomeSlide />;
      case 'swipe':   return <SwipeSlide />;
      case 'pantry':  return <PantrySlide />;
      case 'start':   return <GetStartedSlide onStart={complete} />;
    }
  };

  // Dot and button colours adapt to the slide background.
  const dotInactive  = onDarkBg ? 'rgba(255,255,255,0.30)' : 'rgba(56,56,52,0.20)';
  const dotActive    = onDarkBg ? '#D5FB2A' : Colors.primary;
  const skipColor    = onDarkBg ? 'rgba(255,255,255,0.60)' : Colors.textSecondary;
  const nextBtnBg    = onDarkBg ? '#D5FB2A' : Colors.primary;
  const nextBtnIcon  = onDarkBg ? Colors.primary : '#ffffff';

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
      />

      {/* ── Overlay: skip / dots / next ─────────────────────────────────── */}
      {!isLast && (
        <View
          style={[
            styles.overlay,
            { paddingBottom: insets.bottom + 32, paddingTop: insets.top + 16 },
          ]}
          pointerEvents="box-none"
        >
          {/* Skip button — top right */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={complete}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text style={[styles.skipText, { color: skipColor }]}>Skip</Text>
          </TouchableOpacity>

          {/* Bottom row: dots + next arrow */}
          <View style={styles.bottomRow}>
            {/* Dot indicators */}
            <View style={styles.dotsRow}>
              {SLIDES.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: i === currentIndex ? dotActive : dotInactive },
                    i === currentIndex && styles.dotActive,
                  ]}
                />
              ))}
            </View>

            {/* Next button */}
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: nextBtnBg }]}
              onPress={handleNext}
              accessibilityRole="button"
              accessibilityLabel="Next slide"
            >
              <Ionicons name="arrow-forward" size={22} color={nextBtnIcon} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  container: {
    flex: 1,
  },

  // ── Slide shell ────────────────────────────────────────────────────────────
  slide: {
    width: SCREEN_W,
    flex: 1,
    minHeight: SCREEN_H,
  },

  illustrationArea: {
    flex: 1.1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },

  textArea: {
    flex: 0.9,
    paddingHorizontal: 32,
    paddingBottom: 120, // leave room for the overlay
    justifyContent: 'flex-start',
  },

  slideTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.subtitle,
    lineHeight: FontSize.subtitle * 1.15,
    marginBottom: 12,
  },

  slideSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodyBase,
    lineHeight: FontSize.bodyBase * 1.55,
  },

  // ── Slide 1 — Welcome ──────────────────────────────────────────────────────
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 36,
    backgroundColor: 'rgba(213, 251, 42, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  wordmark: {
    fontFamily: FontFamily.heading,
    fontSize: 72,
    lineHeight: 72,
    color: '#D5FB2A',
    letterSpacing: -2,
    paddingRight: 2, // compensate for RN letter-spacing trailing space
  },

  // ── Slide 2 — Swipe ────────────────────────────────────────────────────────
  cardMockupWrapper: {
    position: 'relative',
    marginBottom: 24,
  },

  cardMockup: {
    width: 200,
    height: 270,
    borderRadius: Radius.r400,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceHigh,
    shadowColor: '#383834',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },

  cardMockupImageArea: {
    flex: 1,
    backgroundColor: Colors.surfaceHigh,
    // Subtle diagonal pattern to imply an image
    opacity: 0.6,
  },

  cardMockupFooter: {
    padding: 16,
    backgroundColor: Colors.primary,
    gap: 8,
  },

  cardMockupTitleBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.80)',
    width: '80%',
  },

  cardMockupSubBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.40)',
    width: '50%',
  },

  likeStamp: {
    position: 'absolute',
    top: 24,
    left: -8,
    borderWidth: 3,
    borderColor: '#D5FB2A',
    borderRadius: Radius.r100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    transform: [{ rotate: '-12deg' }],
    backgroundColor: Colors.background,
  },

  likeStampText: {
    fontFamily: FontFamily.heading,
    fontSize: 18,
    color: '#3A5500',
    letterSpacing: 1,
  },

  nopeStamp: {
    position: 'absolute',
    top: 24,
    right: -8,
    borderWidth: 3,
    borderColor: '#FB2A2A',
    borderRadius: Radius.r100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    transform: [{ rotate: '12deg' }],
    backgroundColor: Colors.background,
  },

  nopeStampText: {
    fontFamily: FontFamily.heading,
    fontSize: 18,
    color: '#FB2A2A',
    letterSpacing: 1,
  },

  directionRow: {
    flexDirection: 'row',
    gap: 16,
  },

  directionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },

  directionLabel: {
    fontFamily: FontFamily.heading,
    fontSize: 14,
    lineHeight: 14,
  },

  // ── Slide 3 — Pantry ───────────────────────────────────────────────────────
  pantryCard: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: Colors.background,
    borderRadius: Radius.r400,
    padding: 20,
    shadowColor: '#383834',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },

  pantryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },

  pantryHeaderText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.subheading,
    color: Colors.textPrimary,
  },

  pantryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  pantryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  pantryItemText: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodySmall,
  },

  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    backgroundColor: '#B8F9D7',
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },

  matchBadgeText: {
    fontFamily: FontFamily.heading,
    fontSize: 12,
    lineHeight: 12,
    color: '#226248',
  },

  // ── Slide 4 — Get Started ──────────────────────────────────────────────────
  checkCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(213, 251, 42, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#D5FB2A',
    borderRadius: Radius.full,
    paddingVertical: 18,
    paddingHorizontal: 36,
    marginTop: 28,
    alignSelf: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },

  ctaText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.bodyBase,
    color: Colors.primary,
    lineHeight: FontSize.bodyBase,
  },

  // ── Overlay (dots + skip + next) ────────────────────────────────────────────
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },

  skipButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 44,
    justifyContent: 'center',
  },

  skipText: {
    fontFamily: FontFamily.headingSemibold,
    fontSize: FontSize.bodySmall,
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  dotActive: {
    width: 24,
    borderRadius: 4,
  },

  nextButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#383834',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
});

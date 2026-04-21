// Tab navigator layout — three bottom tabs: Discover, Saved, Pantry.
//
// Pixel-faithful translation of the provided CSS spec:
//   Pill:        335 × 93px, centred, bottom: 29px, border-radius: 120px
//   Inner frame: 325 × 83px, 5px inset, flex row
//   Each item:   108.33 × 83px (325 ÷ 3), no padding between items
//   Active bg:   full item area (108.33 × 83px), border-radius: 50, slides via spring

import { View, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { Colors } from '@/constants/tokens';

// ─── Spec constants (from CSS) ────────────────────────────────────────────────

const PILL_W        = 335;
const PILL_H        = 60;
const INNER_W       = 325; // PILL_W - 5 - 5
const INNER_H       = 50;  // PILL_H - 5 - 5
const INSET         = 5;   // gap between pill edge and inner frame
const BOTTOM_OFFSET = 0;   // sit flush with the safe-area floor
const TAB_COUNT     = 3;
const ITEM_W        = INNER_W / TAB_COUNT; // ≈ 108.33px

// ─── Icon map ─────────────────────────────────────────────────────────────────

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { focused: IoniconName; unfocused: IoniconName }> = {
  discover: { focused: 'home',   unfocused: 'home-outline' },
  saved:    { focused: 'heart',  unfocused: 'heart-outline' },
  pantry:   { focused: 'basket', unfocused: 'basket-outline' },
};

// ─── Custom tab bar ───────────────────────────────────────────────────────────

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets     = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;

  // The outer container must have a real height so React Navigation correctly
  // offsets screen content upward (pill is absolute inside it).
  const containerHeight = BOTTOM_OFFSET + insets.bottom + PILL_H;

  // The pill's bottom edge sits BOTTOM_OFFSET px above the safe-area floor
  const pillBottom = BOTTOM_OFFSET + insets.bottom;

  // Pill is horizontally centred: left = (screenWidth - PILL_W) / 2
  const pillLeft = (screenWidth - PILL_W) / 2;

  // ── Sliding active indicator ─────────────────────────────────────────────
  // Animates between tab positions by translating the full-height indicator
  // rectangle (ITEM_W × INNER_H) along the X axis.
  const activeIndex = useSharedValue(state.index);

  useEffect(() => {
    activeIndex.value = withTiming(state.index, {
      duration: 500,
      easing: Easing.bezier(0.77, 0.03, 0.02, 1.01),
    });
  }, [state.index]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: activeIndex.value * ITEM_W }],
  }));

  return (
    // Outer view — provides height so content isn't obscured by the pill.
    // backgroundColor matches the page so no contrasting strip is visible.
    <View style={{ height: containerHeight, backgroundColor: Colors.background }}>

      {/* Pill — absolutely positioned within the outer container */}
      <View
        style={[
          styles.pill,
          { width: PILL_W, left: pillLeft, bottom: pillBottom },
        ]}
      >
        {/* Inner frame — 5px inset, houses the sliding indicator + items */}
        <View style={styles.innerFrame}>

          {/* Sliding indicator — rendered first so icons sit above it */}
          <Animated.View style={[styles.indicator, indicatorStyle]} />

          {/* Tab items */}
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const icons = TAB_ICONS[route.name] ?? {
              focused: 'ellipse',
              unfocused: 'ellipse-outline',
            };

            const onPress = () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name as never);
              }
            };

            const onLongPress = () => {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            return (
              <TouchableOpacity
                key={route.key}
                style={styles.tabItem}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: isFocused }}
                accessibilityLabel={
                  descriptors[route.key].options.tabBarAccessibilityLabel
                }
              >
                <Ionicons
                  name={isFocused ? icons.focused : icons.unfocused}
                  size={28}
                  color={isFocused ? '#ffffff' : 'rgba(83, 80, 74, 0.5)'}
                />
              </TouchableOpacity>
            );
          })}

        </View>
      </View>
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="saved"    options={{ title: 'Saved' }} />
      <Tabs.Screen name="pantry"   options={{ title: 'Pantry' }} />
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  // Outer pill container — CSS spec: 335×93, border-radius 120, #F6F3ED, 1px #DEDEDE
  pill: {
    position: 'absolute',
    height: PILL_H,
    backgroundColor: '#F6F3ED',
    borderRadius: 120,
    borderWidth: 1,
    borderColor: '#DEDEDE',
    shadowColor: '#383834',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 8,
  },

  // Inner frame — CSS spec: 325×83, left: 5, top: 5, flex-direction: row
  innerFrame: {
    position: 'absolute',
    left: INSET,
    top: INSET,
    width: INNER_W,
    height: INNER_H,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Sliding active indicator — full item area, border-radius: 50
  // Positioned at left: 0; translateX drives the slide animation
  indicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: ITEM_W,
    height: INNER_H,
    borderRadius: 50,
    backgroundColor: Colors.primary,
  },

  // Each tab item — equal share of the inner frame, icon centred
  tabItem: {
    width: ITEM_W,
    height: INNER_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

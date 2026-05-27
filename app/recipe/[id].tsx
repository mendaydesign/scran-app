// RecipeDetail — full recipe view, pushed as a Stack screen over the tabs.
// Shows the hero image, metadata badges, description, then a 3-tab segmented
// control switching between Ingredients, Method, and Nutrition.
// Back and save buttons float over the hero image.

import { useRef, useState, useEffect } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity, Modal,
  KeyboardAvoidingView, Platform, Dimensions, StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  runOnJS, interpolate, Extrapolation, Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

import { MOCK_RECIPES } from '@/constants/mockRecipes';
import { useSavedRecipes } from '@/context/SavedRecipesContext';
import { usePantry } from '@/context/PantryContext';
import { useShoppingList } from '@/context/ShoppingListContext';
import { Colors, FontFamily, FontSize, FontWeight, Radius, Stroke } from '@/constants/tokens';
import { ingredientMatches } from '@/utils/ingredientUtils';
import type { Difficulty } from '@/types/recipe';

const { height: SCREEN_H } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'ingredients' | 'method' | 'nutrition';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIFFICULTY_BADGE: Record<Difficulty, { bg: string; fg: string }> = {
  Easy:   { bg: '#D5FB2A', fg: '#3A5500' },
  Medium: { bg: '#FBA42A', fg: '#4C310C' },
  Hard:   { bg: '#FB2A2A', fg: '#FFE2E2' },
};
const BOLT_COUNT: Record<Difficulty, number> = { Easy: 1, Medium: 2, Hard: 3 };
const TIME_BADGE    = { bg: '#B8F9D7', fg: '#226248' };
const SERVES_BADGE  = { bg: '#F9B8F5', fg: '#4A3849' };

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSaved, saveRecipe, unsaveRecipe } = useSavedRecipes();
  const { pantryItems } = usePantry();
  const { lists, addItemsToList, createList } = useShoppingList();

  const [activeTab, setActiveTab] = useState<Tab>('ingredients');

  // Toast state — shows a brief confirmation after adding to the shopping list
  const [toast, setToast]                     = useState<string | null>(null);
  const toastTimerRef                          = useRef<ReturnType<typeof setTimeout> | null>(null);
  // List-picker modal state
  const [pickerVisible, setPickerVisible]     = useState(false);
  const [newListName, setNewListName]         = useState('');
  const [creatingNew, setCreatingNew]         = useState(false);

  // Sheet starts off-screen; sheetTranslateY drives both position and overlay opacity.
  // All hooks must be declared before any early returns (React rules).
  const sheetTranslateY = useSharedValue(SCREEN_H);

  const overlayAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sheetTranslateY.value, [0, SCREEN_H], [1, 0], Extrapolation.CLAMP),
  }));

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  // Toast slide-in/out — starts far enough below the screen to be fully hidden
  const toastTranslateY = useSharedValue(200);
  const toastAnimStyle  = useAnimatedStyle(() => ({
    transform: [{ translateY: toastTranslateY.value }],
  }));

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Slide sheet up (and fade overlay in) whenever the modal becomes visible
  useEffect(() => {
    if (pickerVisible) {
      sheetTranslateY.value = SCREEN_H; // ensure starting position
      sheetTranslateY.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) });
    }
  }, [pickerVisible]);

  const recipe = MOCK_RECIPES.find((r) => r.id === id);

  if (!recipe) {
    return (
      <View style={[styles.container, styles.centred, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Recipe not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBack}>
          <Text style={styles.errorBackText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const saved      = isSaved(recipe.id);
  const diffBadge  = DIFFICULTY_BADGE[recipe.difficulty];
  const diffBolts  = BOLT_COUNT[recipe.difficulty];

  // Animate sheet down (and overlay out), then tear down modal state
  const dismissPicker = () => {
    setPickerVisible(false);
    setCreatingNew(false);
    setNewListName('');
  };

  const closeModal = () => {
    sheetTranslateY.value = withTiming(
      SCREEN_H,
      { duration: 300, easing: Easing.in(Easing.cubic) },
      () => runOnJS(dismissPicker)(),
    );
  };

  // Pan gesture attached to the drag handle only so ScrollView / TextInput
  // inside the sheet still work normally
  const dragGesture = Gesture.Pan()
    .activeOffsetY(5)
    .onUpdate((e) => {
      if (e.translationY > 0) sheetTranslateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 80 || e.velocityY > 500) {
        sheetTranslateY.value = withTiming(SCREEN_H, { duration: 300 }, () =>
          runOnJS(dismissPicker)(),
        );
      } else {
        sheetTranslateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
      }
    });

  // Build the list of missing ingredients (not already in pantry)
  const missingIngredients = recipe.ingredients.filter(
    (ingredient) =>
      !pantryItems.some(
        (pantryItem) =>
          pantryItem.trim().length > 0 && ingredientMatches(ingredient, pantryItem),
      ),
  );

  const showToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    // Snap off-screen then slide up into view
    toastTranslateY.value = 200;
    toastTranslateY.value = withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) });
    // After display time, slide back down then clear the message
    toastTimerRef.current = setTimeout(() => {
      toastTranslateY.value = withTiming(200, { duration: 300, easing: Easing.in(Easing.cubic) }, () => {
        runOnJS(setToast)(null);
      });
    }, 2500);
  };

  const addToList = (listId: string) => {
    const added = addItemsToList(
      missingIngredients.map((name) => ({ name, recipeId: recipe.id, recipeName: recipe.title })),
      listId,
    );
    showToast(
      added === 0
        ? 'All ingredients already in that list'
        : `Added ${added} item${added !== 1 ? 's' : ''} to shopping list`,
    );
    closeModal();
  };

  const handleAddToShoppingList = () => {
    if (lists.length === 0) {
      // No lists yet — open picker in "create new" mode immediately
      setCreatingNew(true);
      setPickerVisible(true);
    } else {
      setCreatingNew(false);
      setPickerVisible(true);
    }
  };

  const handleCreateAndAdd = () => {
    const name = newListName.trim() || 'New list';
    const newId = createList(name);
    // createList is synchronous in terms of returning the id, but state update
    // is async — call addToList via setTimeout so the new list exists first.
    setTimeout(() => addToList(newId), 0);
  };

  // ── Tab content ─────────────────────────────────────────────────────────────

  const renderIngredientsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        {recipe.ingredients.map((ingredient, i) => (
          <View key={i} style={styles.ingredientRow}>
            <View style={styles.bullet} />
            <Text style={styles.bodyText}>{ingredient}</Text>
          </View>
        ))}
      </View>

    </View>
  );

  const renderMethodTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.section, styles.sectionAlt]}>
        {recipe.steps.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>{i + 1}</Text>
            </View>
            <Text style={styles.bodyText}>{step}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderNutritionTab = () => {
    const n = recipe.nutrition;
    if (!n) {
      return (
        <View style={[styles.tabContent, styles.centred]}>
          <Text style={styles.noDataText}>Nutritional data not available.</Text>
        </View>
      );
    }

    const rows: Array<{ label: string; value: string }> = [
      { label: 'Calories',        value: `${n.calories} kcal` },
      { label: 'Fat',             value: `${n.fat}g` },
      { label: 'Saturated Fat',   value: `${n.saturatedFat}g` },
      { label: 'Dietary Fibre',   value: `${n.fibre}g` },
      { label: 'Carbohydrates',   value: `${n.carbohydrates}g` },
      { label: 'Sugars',          value: `${n.sugars}g` },
      { label: 'Protein',         value: `${n.protein}g` },
      { label: 'Sodium',          value: `${n.sodium}mg` },
    ];

    return (
      <View style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.nutritionNote}>
            Nutritional information per serving
          </Text>
          {rows.map((row, i) => (
            <View
              key={row.label}
              style={[
                styles.nutritionRow,
                i < rows.length - 1 && styles.nutritionRowBorder,
              ]}
            >
              <Text style={styles.nutritionLabel}>{row.label}</Text>
              <Text style={styles.nutritionValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={saved && activeTab === 'ingredients' ? { paddingBottom: 120 } : undefined}
      >

        {/* Hero image */}
        <View style={styles.hero}>
          <Image
            source={recipe.imageUrl}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <View style={styles.heroScrim} />
        </View>

        {/* Detail content */}
        <View style={styles.content}>

          {/* Title */}
          <Text style={styles.recipeTitle}>{recipe.title}</Text>

          {/* Metadata badges */}
          <View style={styles.badgeRow}>
            {/* Difficulty — bolt count matches level */}
            <View style={[styles.badge, { backgroundColor: diffBadge.bg }]}>
              {Array.from({ length: diffBolts }).map((_, i) => (
                <MaterialIcons
                  key={i}
                  name="bolt"
                  size={15}
                  color={diffBadge.fg}
                  style={i > 0 ? { marginLeft: -5 } : undefined}
                />
              ))}
              <Text style={[styles.badgeText, { color: diffBadge.fg }]}>
                {recipe.difficulty.toUpperCase()}
              </Text>
            </View>

            {/* Cook time */}
            <View style={[styles.badge, { backgroundColor: TIME_BADGE.bg }]}>
              <Ionicons name="time-outline" size={14} color={TIME_BADGE.fg} />
              <Text style={[styles.badgeText, { color: TIME_BADGE.fg }]}>
                {formatTime(recipe.cookTime).toUpperCase()}
              </Text>
            </View>

            {/* Prep time */}
            <View style={[styles.badge, { backgroundColor: TIME_BADGE.bg }]}>
              <Ionicons name="hourglass-outline" size={14} color={TIME_BADGE.fg} />
              <Text style={[styles.badgeText, { color: TIME_BADGE.fg }]}>
                PREP {formatTime(recipe.prepTime).toUpperCase()}
              </Text>
            </View>

            {/* Servings */}
            <View style={[styles.badge, { backgroundColor: SERVES_BADGE.bg }]}>
              <Ionicons name="people-outline" size={14} color={SERVES_BADGE.fg} />
              <Text style={[styles.badgeText, { color: SERVES_BADGE.fg }]}>
                SERVES {recipe.servings}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>{recipe.description}</Text>

          {/* ── Segmented tab bar ──────────────────────────────────────────── */}
          <View style={styles.tabBar}>
            {(['ingredients', 'method', 'nutrition'] as Tab[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
                onPress={() => setActiveTab(tab)}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === tab }}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === tab && styles.tabLabelActive,
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Active tab content ──────────────────────────────────────────── */}
          {activeTab === 'ingredients' && renderIngredientsTab()}
          {activeTab === 'method'      && renderMethodTab()}
          {activeTab === 'nutrition'   && renderNutritionTab()}

          {/* Bottom breathing room */}
          <View style={{ height: 48 }} />

        </View>
      </ScrollView>

      {/* Sticky Add to Shopping List — only for saved recipes on ingredients tab */}
      {saved && activeTab === 'ingredients' && (
        <TouchableOpacity
          style={[styles.shoppingListButton, { position: 'absolute', left: 20, right: 20, bottom: 30 }]}
          onPress={handleAddToShoppingList}
          accessibilityLabel="Add missing ingredients to shopping list"
          accessibilityRole="button"
        >
          <Ionicons name="cart-outline" size={20} color={Colors.onPrimary} />
          <Text style={styles.shoppingListButtonText}>Add to Shopping List</Text>
        </TouchableOpacity>
      )}

      {/* Toast confirmation — always mounted; translateY drives slide-in/out */}
      <Animated.View
        style={[styles.toast, { bottom: insets.bottom + 24 }, toastAnimStyle]}
        pointerEvents="none"
      >
        <Text style={styles.toastText}>{toast ?? ''}</Text>
        <View style={styles.toastIcon}>
          <Ionicons name="checkmark-sharp" size={22} color='#D5FB2A' />
        </View>
      </Animated.View>

      {/* List picker modal — custom animation so the overlay fades independently
          of the sheet slide-up, and the sheet can be dragged to dismiss */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        {/* KeyboardAvoidingView pushes the sheet above the keyboard when
            the user is naming a new list */}
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Dimming overlay — fades from 0→1 as sheetTranslateY goes SCREEN_H→0 */}
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.pickerOverlay, overlayAnimStyle]}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={closeModal}
            />
          </Animated.View>

          {/* Sheet — slides up from below */}
          <Animated.View
            style={[styles.pickerSheet, sheetAnimStyle, { paddingBottom: insets.bottom + 20 }]}
          >
            {/* Drag handle — pan gesture is scoped here only so ScrollView
                and TextInput elsewhere in the sheet are not affected */}
            <GestureDetector gesture={dragGesture}>
              <View style={styles.pickerDragArea}>
                <View style={styles.pickerHandle} />
              </View>
            </GestureDetector>

            <Text style={styles.pickerTitle}>Save Ingredients</Text>

            {/* Existing lists */}
            {!creatingNew && (
              <ScrollView
                style={styles.pickerListScroll}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {lists.map((list) => {
                  const unchecked = list.items.filter((i) => !i.checked).length;
                  return (
                    <TouchableOpacity
                      key={list.id}
                      style={styles.pickerListRow}
                      onPress={() => addToList(list.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.pickerListInfo}>
                        <Text style={styles.pickerListName}>{list.name}</Text>
                        {unchecked > 0 && (
                          <Text style={styles.pickerListCount}>{unchecked} item{unchecked !== 1 ? 's' : ''}</Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Name input — shown when creating a new list */}
            {creatingNew && (
              <TextInput
                style={styles.pickerInput}
                value={newListName}
                onChangeText={setNewListName}
                placeholder="Title New List..."
                placeholderTextColor={Colors.textSecondary}
                autoFocus
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleCreateAndAdd}
              />
            )}

            {/* Lime CTA — picker: open create state; create state: confirm */}
            <TouchableOpacity
              style={styles.pickerCreateBtn}
              onPress={creatingNew ? handleCreateAndAdd : () => setCreatingNew(true)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={creatingNew ? 'Create list and add ingredients' : 'Create a new shopping list'}
            >
              <Text style={styles.pickerCreateBtnText}>Create New List</Text>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Floating back button */}
      <TouchableOpacity
        style={[styles.floatingBtn, styles.backBtn, { top: insets.top + 12 }]}
        onPress={() => router.back()}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="chevron-back" size={22} color={Colors.onPrimary} />
      </TouchableOpacity>

      {/* Floating save button */}
      <TouchableOpacity
        style={[styles.floatingBtn, styles.saveBtn, { top: insets.top + 12 }]}
        onPress={() => (saved ? unsaveRecipe(recipe.id) : saveRecipe(recipe))}
        accessibilityLabel={saved ? 'Remove from saved' : 'Save recipe'}
        accessibilityRole="button"
      >
        <Ionicons
          name={saved ? 'heart' : 'heart-outline'}
          size={22}
          color={saved ? '#4CAF50' : Colors.textPrimary}
        />
      </TouchableOpacity>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  centred: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    height: 300,
    backgroundColor: Colors.surface,
  },

  heroScrim: {
    display: 'none',
  },

  // ── Content ───────────────────────────────────────────────────────────────
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },

  recipeTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.subtitle,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: FontSize.subtitle * 1.2,
    marginBottom: 14,
  },

  // ── Badges ────────────────────────────────────────────────────────────────
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },

  badgeText: {
    fontFamily: FontFamily.heading,
    fontSize: 13,
    lineHeight: 13,
  },

  // ── Description ───────────────────────────────────────────────────────────
  description: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodyBase,
    color: Colors.textSecondary,
    lineHeight: FontSize.bodyBase * 1.5,
    marginBottom: 24,
  },

  // ── Segmented tab bar ─────────────────────────────────────────────────────
  // Outer pill container sits on surfaceHigh; active tab gets a surface
  // background to "lift" off it — same tonal trick used across the app.
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radius.full,
    padding: 4,
    marginBottom: 20,
  },

  tabItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabItemActive: {
    backgroundColor: Colors.surface,
    // Subtle shadow to lift the active pill
    shadowColor: '#383834',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },

  tabLabel: {
    fontFamily: FontFamily.headingSemibold,
    fontSize: FontSize.bodySmall,
    color: Colors.textSecondary,
  },

  tabLabelActive: {
    fontFamily: FontFamily.heading,
    color: Colors.textPrimary,
  },

  // ── Tab content wrapper ───────────────────────────────────────────────────
  tabContent: {
    gap: 16,
  },

  // ── Sections — tonal containers ───────────────────────────────────────────
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.r400,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },

  sectionAlt: {
    backgroundColor: Colors.surfaceHigh,
  },

  // ── Ingredients ───────────────────────────────────────────────────────────
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },

  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 9,
    flexShrink: 0,
  },

  bodyText: {
    fontFamily: FontFamily.body,
    flex: 1,
    fontSize: FontSize.bodyBase,
    color: Colors.textPrimary,
    lineHeight: FontSize.bodyBase * 1.5,
  },

  // ── Steps ─────────────────────────────────────────────────────────────────
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },

  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },

  stepNumber: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.bold,
    color: Colors.onPrimary,
  },

  // ── Nutrition ─────────────────────────────────────────────────────────────
  nutritionNote: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 16,
  },

  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
  },

  nutritionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  nutritionLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodyBase,
    color: Colors.textPrimary,
  },

  nutritionValue: {
    fontFamily: FontFamily.headingSemibold,
    fontSize: FontSize.bodyBase,
    color: Colors.textPrimary,
  },

  noDataText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodyBase,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 40,
  },

  // ── Add to Shopping List button ───────────────────────────────────────────
  shoppingListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 16,
    paddingHorizontal: 28,
    minHeight: 54,
    shadowColor: '#383834',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },

  shoppingListButtonText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.bodyBase,
    fontWeight: FontWeight.bold,
    color: Colors.onPrimary,
  },

  // ── Toast ─────────────────────────────────────────────────────────────────
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D5FB2A',
    borderRadius: Radius.full,
    paddingVertical: 16,
    paddingLeft: 24,
    paddingRight: 12,
    shadowColor: '#383834',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 8,
  },

  toastText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.bodyBase,
    color: Colors.primary,
    flex: 1,
  },

  // Forest-green circle with lime tick — sits at the right of the toast bar
  toastIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  // ── Floating buttons ──────────────────────────────────────────────────────
  floatingBtn: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backBtn: {
    left: 16,
  },

  saveBtn: {
    right: 16,
  },

  // ── Error state ───────────────────────────────────────────────────────────
  errorText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodyBase,
    color: Colors.textSecondary,
  },

  errorBack: {
    marginTop: 12,
  },

  errorBackText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodyBase,
    color: Colors.accent,
  },

  // ── List picker modal ─────────────────────────────────────────────────────
  // The overlay is absoluteFill; its opacity is driven by sheetTranslateY
  // via interpolate — no separate animation needed.
  pickerOverlay: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  pickerSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.r400,
    borderTopRightRadius: Radius.r400,
    paddingHorizontal: 24,
  },

  // Hit area for the drag gesture — wider than the visible pill so it's
  // easy to grab. Centres the pill horizontally.
  pickerDragArea: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },

  pickerHandle: {
    width: 40,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
  },

  pickerTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.heading,
    color: Colors.textPrimary,
    marginBottom: 16,
    marginTop: 4,
  },

  // Scrollable area for existing list rows — capped so the sheet doesn't
  // grow past the midpoint of the screen on long lists.
  pickerListScroll: {
    maxHeight: 280,
  },

  pickerListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: Radius.r400,
    backgroundColor: Colors.surface,
    marginBottom: 8,
  },

  pickerListInfo: {
    flex: 1,
  },

  pickerListName: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.bodyBase,
    color: Colors.textPrimary,
  },

  pickerListCount: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Text input shown when naming a new list
  pickerInput: {
    height: 56,
    backgroundColor: Colors.surface,
    borderRadius: Radius.r200,
    paddingHorizontal: 20,
    fontSize: FontSize.bodyBase,
    fontFamily: FontFamily.body,
    color: Colors.textPrimary,
    borderBottomWidth: Stroke.focusRing,
    borderBottomColor: Colors.primary,
    marginBottom: 16,
  },

  // Lime pill CTA — matches the "Create a new shopping list" button style
  // used throughout the app. Doubles as the confirm button in create mode.
  pickerCreateBtn: {
    backgroundColor: '#D5FB2A',
    borderRadius: Radius.full,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#383834',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  pickerCreateBtnText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.bodyBase,
    color: Colors.primary,
  },
});

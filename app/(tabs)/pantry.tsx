// Pantry screen — two sub-sections toggled by a segmented control:
//   • My Pantry   → manage the ingredients you have at home
//   • Shopping List → tick off items to buy; add from recipes or manually

import { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { usePantry } from '@/context/PantryContext';
import { useShoppingList } from '@/context/ShoppingListContext';
import { Colors, FontFamily, FontSize, FontWeight, Radius } from '@/constants/tokens';
import { INGREDIENT_CATEGORIES } from '@/constants/ingredients';
import ToggleSwitch from '@/components/ToggleSwitch';
import ShoppingList from '@/components/ShoppingList';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PantryScreen() {
  const { pantryItems, addItem, removeItem, clearPantry, matchBadgeEnabled, toggleMatchBadge } =
    usePantry();
  const { shoppingList } = useShoppingList();

  // Which sub-section is active
  const [activeTab, setActiveTab] = useState<'pantry' | 'shopping'>('pantry');

  const [inputText, setInputText] = useState('');
  const [inputFocused, setInputFocused] = useState(false);

  // Tracks whether a suggestion row is mid-press so onBlur doesn't collapse
  // the dropdown before onPress fires.
  const selectingRef = useRef(false);

  // ── Autocomplete filtering ────────────────────────────────────────────────

  const groupedSuggestions = useMemo(() => {
    const query = inputText.trim().toLowerCase();
    if (!query) return [];
    return INGREDIENT_CATEGORIES
      .map(({ label, items }) => ({
        label,
        items: items.filter((i) => i.toLowerCase().includes(query)).slice(0, 4),
      }))
      .filter((group) => group.items.length > 0);
  }, [inputText]);

  const allSuggestedItems = useMemo(
    () => groupedSuggestions.flatMap((g) => g.items),
    [groupedSuggestions],
  );

  const showCustomAdd =
    inputText.trim().length > 0 &&
    !allSuggestedItems.some((s) => s.toLowerCase() === inputText.trim().toLowerCase());

  const showDropdown =
    inputFocused && inputText.trim().length > 0 && (groupedSuggestions.length > 0 || showCustomAdd);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleAdd = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    addItem(trimmed);
    setInputText('');
  };

  const handleSelect = (name: string) => {
    addItem(name);
    setInputText('');
    selectingRef.current = false;
  };

  // ── Shopping list badge count for the tab label ───────────────────────────
  const shoppingUnchecked = shoppingList.filter((i) => !i.checked).length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.inner}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Pantry</Text>
        </View>

        {/* ── Segmented control ───────────────────────────────────────────── */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segment, activeTab === 'pantry' && styles.segmentActive]}
            onPress={() => setActiveTab('pantry')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'pantry' }}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'pantry' && styles.segmentTextActive,
              ]}
            >
              My Pantry
              {pantryItems.length > 0 ? ` (${pantryItems.length})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segment, activeTab === 'shopping' && styles.segmentActive]}
            onPress={() => setActiveTab('shopping')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'shopping' }}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'shopping' && styles.segmentTextActive,
              ]}
            >
              Shopping List
              {shoppingUnchecked > 0 ? ` (${shoppingUnchecked})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Sub-section content ──────────────────────────────────────────── */}

        {activeTab === 'pantry' ? (

          // ── MY PANTRY ─────────────────────────────────────────────────────

          <>
            {/* Input section — raised so the dropdown overlays rows below */}
            <View style={styles.inputSection}>

              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, inputFocused && styles.inputFocused]}
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={handleAdd}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => {
                    if (selectingRef.current) return;
                    setInputFocused(false);
                  }}
                  placeholder="e.g. garlic, olive oil, pasta…"
                  placeholderTextColor={Colors.textSecondary}
                  returnKeyType="done"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Ingredient name input"
                />
                <TouchableOpacity
                  style={[styles.addButton, !inputText.trim() && styles.addButtonDisabled]}
                  onPress={handleAdd}
                  disabled={!inputText.trim()}
                  accessibilityLabel="Add ingredient to pantry"
                  accessibilityRole="button"
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Autocomplete dropdown */}
              {showDropdown && (
                <View style={styles.dropdown}>
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                  >
                    {groupedSuggestions.map(({ label, items }) => (
                      <View key={label}>
                        <Text style={styles.categoryHeading}>{label}</Text>
                        {items.map((item) => (
                          <TouchableOpacity
                            key={item}
                            style={styles.suggestionRow}
                            onPressIn={() => { selectingRef.current = true; }}
                            onPress={() => handleSelect(item)}
                            activeOpacity={0.6}
                            accessibilityLabel={`Add ${item} to pantry`}
                            accessibilityRole="button"
                          >
                            <Text style={styles.suggestionText}>{item}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ))}

                    {showCustomAdd && (
                      <TouchableOpacity
                        style={[styles.suggestionRow, styles.customAddRow]}
                        onPressIn={() => { selectingRef.current = true; }}
                        onPress={() => handleSelect(inputText.trim())}
                        activeOpacity={0.6}
                        accessibilityLabel={`Add ${inputText.trim()} as a custom ingredient`}
                        accessibilityRole="button"
                      >
                        <Ionicons
                          name="add-circle-outline"
                          size={18}
                          color={Colors.primary}
                          style={styles.customAddIcon}
                        />
                        <Text style={styles.customAddText}>Add "{inputText.trim()}"</Text>
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                </View>
              )}

            </View>

            {/* Match badge toggle */}
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={toggleMatchBadge}
              accessibilityLabel={
                matchBadgeEnabled
                  ? 'Disable ingredient match badges on recipe cards'
                  : 'Enable ingredient match badges on recipe cards'
              }
              accessibilityRole="switch"
              activeOpacity={0.7}
            >
              <View style={styles.toggleLabel}>
                <Text style={styles.toggleTitle}>Show match badges</Text>
                <Text style={styles.toggleSubtitle}>
                  Displays how many ingredients you have on each recipe card
                </Text>
              </View>
              <ToggleSwitch
                value={matchBadgeEnabled}
                onValueChange={toggleMatchBadge}
                accessibilityLabel="Toggle ingredient match badges"
              />
            </TouchableOpacity>

            {/* Ingredient list or empty state — overflow:hidden prevents the
                content from bleeding into the sections above if space is tight */}
            <View style={styles.contentArea}>
            {pantryItems.length === 0 ? (

              <View style={styles.emptyContainer}>
                <Ionicons name="basket-outline" size={64} color={Colors.textSecondary} />
                <Text style={styles.emptyTitle}>Your pantry is empty</Text>
                <Text style={styles.emptySubtitle}>
                  Add ingredients above and then use the Pantry Match toggle on the
                  Discover tab to see how well each recipe fits what you have.
                </Text>
              </View>

            ) : (

              <>
                <FlatList
                  data={pantryItems}
                  keyExtractor={(item) => item}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.list}
                  renderItem={({ item }) => (
                    <View style={styles.ingredientRow}>
                      <View style={styles.bullet} />
                      <Text style={styles.ingredientText}>{item}</Text>
                      <TouchableOpacity
                        onPress={() => removeItem(item)}
                        accessibilityLabel={`Remove ${item} from pantry`}
                        accessibilityRole="button"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  )}
                />

                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearPantry}
                  accessibilityLabel="Clear all pantry ingredients"
                  accessibilityRole="button"
                >
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
              </>

            )}
            </View>
          </>

        ) : (

          // ── SHOPPING LIST ─────────────────────────────────────────────────
          <ShoppingList />

        )}

      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  inner: {
    flex: 1,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },

  screenTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.titlePage,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },

  // ── Segmented control ─────────────────────────────────────────────────────
  // Two pill tabs side-by-side in a surfaceHigh tray. Active pill fills primary.
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radius.full,
    padding: 4,
  },

  segment: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },

  segmentActive: {
    backgroundColor: Colors.primary,
    shadowColor: '#383834',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
  },

  segmentText: {
    fontFamily: FontFamily.headingSemibold,
    fontSize: FontSize.bodySmall,
    color: Colors.textSecondary,
  },

  segmentTextActive: {
    fontFamily: FontFamily.heading,
    color: Colors.onPrimary,
  },

  // ── Input section — raised above siblings so dropdown overlays them ───────
  inputSection: {
    zIndex: 10,
    elevation: 10,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  input: {
    flex: 1,
    height: 52,
    backgroundColor: Colors.surface,
    borderRadius: Radius.r200,
    paddingHorizontal: 16,
    fontSize: FontSize.bodyBase,
    fontFamily: FontFamily.body,
    color: Colors.textPrimary,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },

  inputFocused: {
    borderBottomColor: Colors.primary,
  },

  addButton: {
    height: 52,
    paddingHorizontal: 24,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
    shadowColor: '#383834',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  addButtonDisabled: {
    opacity: 0.4,
  },

  addButtonText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.bodyBase,
    fontWeight: FontWeight.bold,
    color: Colors.onPrimary,
  },

  // ── Autocomplete dropdown ─────────────────────────────────────────────────
  dropdown: {
    position: 'absolute',
    top: 56,
    left: 20,
    right: 20,
    maxHeight: 280,
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radius.r400,
    overflow: 'hidden',
    shadowColor: '#383834',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 20,
  },

  categoryHeading: {
    fontFamily: FontFamily.headingSemibold,
    fontSize: FontSize.bodySmall,
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
    letterSpacing: 0.5,
  },

  suggestionRow: {
    paddingHorizontal: 20,
    paddingVertical: 13,
  },

  suggestionText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodyBase,
    color: Colors.textPrimary,
  },

  customAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
  },

  customAddIcon: {
    flexShrink: 0,
  },

  customAddText: {
    fontFamily: FontFamily.headingSemibold,
    fontSize: FontSize.bodyBase,
    color: Colors.primary,
  },

  // ── Match badge toggle ────────────────────────────────────────────────────
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radius.r400,
    gap: 12,
  },

  toggleLabel: {
    flex: 1,
    gap: 3,
  },

  toggleTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.bodyBase,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  toggleSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodySmall,
    color: Colors.textSecondary,
    lineHeight: FontSize.bodySmall * 1.4,
  },

  // ── Content area — clips children so they never overflow into sections above
  contentArea: {
    flex: 1,
    overflow: 'hidden',
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
    paddingBottom: 80,
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
    lineHeight: FontSize.bodyBase * 1.4,
  },

  // ── Ingredient list ───────────────────────────────────────────────────────
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radius.r400,
  },

  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },

  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    flexShrink: 0,
  },

  ingredientText: {
    fontFamily: FontFamily.body,
    flex: 1,
    fontSize: FontSize.bodyBase,
    color: Colors.textPrimary,
  },

  // ── Clear all button ──────────────────────────────────────────────────────
  clearButton: {
    alignSelf: 'center',
    marginVertical: 20,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceHigh,
    minHeight: 44,
    justifyContent: 'center',
  },

  clearButtonText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodyBase,
    color: Colors.textSecondary,
  },
});

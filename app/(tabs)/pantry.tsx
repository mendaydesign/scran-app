// Pantry screen — users manage the ingredients they have at home.
// Adding ingredients here enables the Pantry Match toggle on the Discover tab,
// which sorts and badges recipes by how many ingredients you already have.

import { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { usePantry } from '@/context/PantryContext';
import { Colors, FontFamily, FontSize, FontWeight, Radius } from '@/constants/tokens';
import { INGREDIENT_CATEGORIES } from '@/constants/ingredients';
import ToggleSwitch from '@/components/ToggleSwitch';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PantryScreen() {
  const { pantryItems, addItem, removeItem, clearPantry, matchBadgeEnabled, toggleMatchBadge } =
    usePantry();

  const [inputText, setInputText] = useState('');
  const [inputFocused, setInputFocused] = useState(false);

  // Tracks whether a suggestion row is mid-press. Without this, onBlur fires
  // before onPress and collapses the dropdown before the tap registers.
  const selectingRef = useRef(false);

  // ── Autocomplete filtering ────────────────────────────────────────────────
  // For each category, keep items that contain the query (case-insensitive),
  // up to 4 per category. Empty categories are dropped entirely.
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

  // Flat list of every suggested item — used for the exact-match check below.
  const allSuggestedItems = useMemo(
    () => groupedSuggestions.flatMap((g) => g.items),
    [groupedSuggestions],
  );

  // Show "Add [text]" when the typed text isn't already an exact suggestion.
  const showCustomAdd =
    inputText.trim().length > 0 &&
    !allSuggestedItems.some((s) => s.toLowerCase() === inputText.trim().toLowerCase());

  // Dropdown is only visible when the input is focused and has text.
  const showDropdown =
    inputFocused && inputText.trim().length > 0 && (groupedSuggestions.length > 0 || showCustomAdd);

  // ── Handlers ─────────────────────────────────────────────────────────────

  // Adds the current input text as a custom item (used by the Add button and
  // the return key — same as before).
  const handleAdd = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    addItem(trimmed);
    setInputText('');
  };

  // Adds a suggestion (or the custom text) and collapses the dropdown.
  const handleSelect = (name: string) => {
    addItem(name);
    setInputText('');
    selectingRef.current = false;
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    // edges={['top']} — tab bar owns the bottom safe area
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* KeyboardAvoidingView pushes content up when the keyboard opens */}
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={16}
      >

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Pantry</Text>
          {pantryItems.length > 0 && (
            <Text style={styles.countLabel}>
              {pantryItems.length} ingredient{pantryItems.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {/* ── Input section — wraps the text field + autocomplete dropdown ── */}
        {/* zIndex / elevation ensure the dropdown paints over the rows below. */}
        <View style={styles.inputSection}>

          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, inputFocused && styles.inputFocused]}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleAdd}
              onFocus={() => setInputFocused(true)}
              onBlur={() => {
                // If the user is mid-tap on a suggestion, ignore this blur so
                // the dropdown stays visible long enough for onPress to fire.
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

          {/* ── Autocomplete dropdown ─────────────────────────────────────── */}
          {showDropdown && (
            <View style={styles.dropdown}>
              {/* keyboardShouldPersistTaps="handled" lets ScrollView pass taps
                  through to TouchableOpacity children without dismissing the
                  keyboard first. */}
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={false}
              >

                {groupedSuggestions.map(({ label, items }) => (
                  <View key={label}>
                    {/* Category heading — not tappable */}
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

                {/* Custom "Add [text]" row — shown when there is no exact match */}
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

        {/* ── Match badge toggle ──────────────────────────────────────────── */}
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

        {/* ── Ingredient list or empty state ──────────────────────────────── */}
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
                  {/* Accent bullet */}
                  <View style={styles.bullet} />

                  {/* Ingredient name */}
                  <Text style={styles.ingredientText}>{item}</Text>

                  {/* Remove button */}
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

            {/* Clear all button */}
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
      </KeyboardAvoidingView>
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
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },

  screenTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.titlePage,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },

  countLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodyBase,
    color: Colors.textSecondary,
  },

  // ── Input section — raised above siblings so the dropdown overlays them ──
  inputSection: {
    zIndex: 10,
    // Android requires elevation to respect z-ordering
    elevation: 10,
  },

  // ── Input row ─────────────────────────────────────────────────────────────
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // No border by default — bottom 2px line activates on focus (primary green)
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
  // Absolutely positioned so it overlays the content below without pushing it
  // down. The inputSection's zIndex keeps it above siblings.
  dropdown: {
    position: 'absolute',
    // Sit just below the TextInput (height 52) with a 4px gap
    top: 56,
    left: 20,
    right: 20,
    // Cap height at ~5 rows before scrolling kicks in
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

  // Category label — sits above its group of items, not tappable
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

  // "Add [text]" row — slightly distinct to signal it's a custom action
  customAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    // Tonal separator between suggestions and custom row
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

  // ── Match badge toggle — sits on surface for tonal separation ────────────
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

  // ── Ingredient list — sits on surface for tonal lift off the page ─────────
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

// Pantry screen — users manage the ingredients they have at home.
// Adding ingredients here enables the Pantry Match toggle on the Discover tab,
// which sorts and badges recipes by how many ingredients you already have.

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { usePantry } from '@/context/PantryContext';
import { Colors, FontSize, FontWeight, Radius, Stroke } from '@/constants/tokens';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PantryScreen() {
  const { pantryItems, addItem, removeItem, clearPantry, matchBadgeEnabled, toggleMatchBadge } = usePantry();
  const [inputText, setInputText] = useState('');

  const handleAdd = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    addItem(trimmed);
    setInputText('');
  };

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

        {/* ── Input row ───────────────────────────────────────────────────── */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleAdd}
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
          <Switch
            value={matchBadgeEnabled}
            onValueChange={toggleMatchBadge}
            trackColor={{ false: Colors.border, true: Colors.accent }}
            thumbColor={Colors.textPrimary}
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
    fontSize: FontSize.titlePage,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },

  countLabel: {
    fontSize: FontSize.bodyBase,
    color: Colors.textSecondary,
  },

  // ── Input row ─────────────────────────────────────────────────────────────
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  input: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.surface,
    borderRadius: Radius.r200,
    borderWidth: Stroke.border,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    fontSize: FontSize.bodyBase,
    color: Colors.textPrimary,
  },

  addButton: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: Radius.r200,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },

  addButtonDisabled: {
    opacity: 0.4,
  },

  addButtonText: {
    fontSize: FontSize.bodyBase,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  // ── Match badge toggle ────────────────────────────────────────────────────
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 0,
    borderTopWidth: Stroke.border,
    borderBottomWidth: Stroke.border,
    borderColor: Colors.border,
    gap: 12,
  },

  toggleLabel: {
    flex: 1,
    gap: 3,
  },

  toggleTitle: {
    fontSize: FontSize.bodyBase,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  toggleSubtitle: {
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
    fontSize: FontSize.subheading,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  emptySubtitle: {
    fontSize: FontSize.bodyBase,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.bodyBase * 1.4,
  },

  // ── Ingredient list ───────────────────────────────────────────────────────
  list: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: Stroke.border,
    borderBottomColor: Colors.border,
  },

  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    flexShrink: 0,
  },

  ingredientText: {
    flex: 1,
    fontSize: FontSize.bodyBase,
    color: Colors.textPrimary,
  },

  // ── Clear all button ──────────────────────────────────────────────────────
  clearButton: {
    alignSelf: 'center',
    marginVertical: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: Stroke.border,
    borderColor: Colors.border,
    minHeight: 44,
    justifyContent: 'center',
  },

  clearButtonText: {
    fontSize: FontSize.bodyBase,
    color: Colors.textSecondary,
  },
});

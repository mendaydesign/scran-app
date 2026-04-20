// ShoppingList — rendered inside the Pantry tab's Shopping List sub-section.
//
// Layout:
//   • Manual-add input at the top
//   • Unchecked items grouped by category (Fresh Produce, Meat & Fish, etc.)
//   • "In your basket" section at the bottom for checked items (strikethrough)
//   • "Clear checked items" button when at least one item is ticked

import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SectionList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useShoppingList } from '@/context/ShoppingListContext';
import type { ShoppingListItem } from '@/context/ShoppingListContext';
import { SHOPPING_CATEGORY_ORDER } from '@/utils/ingredientUtils';
import { Colors, FontFamily, FontSize, FontWeight, Radius } from '@/constants/tokens';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Section {
  title: string;
  data: ShoppingListItem[];
  isCheckedSection?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ShoppingList() {
  const { shoppingList, addManualItem, toggleItem, removeItem, clearChecked } =
    useShoppingList();

  const [inputText, setInputText] = useState('');
  const [inputFocused, setInputFocused] = useState(false);

  // ── Section data ───────────────────────────────────────────────────────────
  // Unchecked items: grouped by category in SHOPPING_CATEGORY_ORDER.
  // Checked items: a single "In your basket" section pinned to the bottom.
  const sections = useMemo<Section[]>(() => {
    const unchecked = shoppingList.filter((i) => !i.checked);
    const checked = shoppingList.filter((i) => i.checked);

    const result: Section[] = [];

    for (const category of SHOPPING_CATEGORY_ORDER) {
      const items = unchecked.filter((i) => i.category === category);
      if (items.length > 0) {
        result.push({ title: category, data: items });
      }
    }

    if (checked.length > 0) {
      result.push({ title: 'In your basket', data: checked, isCheckedSection: true });
    }

    return result;
  }, [shoppingList]);

  const checkedCount = shoppingList.filter((i) => i.checked).length;
  const uncheckedCount = shoppingList.length - checkedCount;

  const handleAdd = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    addManualItem(trimmed);
    setInputText('');
  };

  // ── Renders ────────────────────────────────────────────────────────────────

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View style={[
      styles.sectionHeader,
      section.isCheckedSection && styles.sectionHeaderChecked,
    ]}>
      <Text style={[
        styles.sectionHeaderText,
        section.isCheckedSection && styles.sectionHeaderTextChecked,
      ]}>
        {section.title.toUpperCase()}
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: ShoppingListItem }) => (
    <TouchableOpacity
      style={[styles.itemRow, item.checked && styles.itemRowChecked]}
      onPress={() => toggleItem(item.id)}
      activeOpacity={0.7}
      accessibilityLabel={`${item.checked ? 'Uncheck' : 'Check'} ${item.name}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: item.checked }}
    >
      {/* Checkbox */}
      <Ionicons
        name={item.checked ? 'checkbox' : 'square-outline'}
        size={22}
        color={item.checked ? Colors.primary : Colors.textSecondary}
        style={styles.checkbox}
      />

      {/* Name + optional recipe attribution */}
      <View style={styles.itemContent}>
        <Text
          style={[styles.itemName, item.checked && styles.itemNameChecked]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        {item.recipeName && !item.checked && (
          <Text style={styles.itemRecipe} numberOfLines={1}>
            from {item.recipeName}
          </Text>
        )}
      </View>

      {/* Remove */}
      <TouchableOpacity
        onPress={() => removeItem(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel={`Remove ${item.name}`}
        accessibilityRole="button"
      >
        <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Header rendered above all sections inside the SectionList scroll area
  const listHeader = (
    <>
      {/* Manual-add input */}
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, inputFocused && styles.inputFocused]}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleAdd}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          placeholder="Add an item…"
          placeholderTextColor={Colors.textSecondary}
          returnKeyType="done"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Add item to shopping list"
        />
        <TouchableOpacity
          style={[styles.addButton, !inputText.trim() && styles.addButtonDisabled]}
          onPress={handleAdd}
          disabled={!inputText.trim()}
          accessibilityLabel="Add item"
          accessibilityRole="button"
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Summary count — only shown when the list has items */}
      {shoppingList.length > 0 && (
        <Text style={styles.countLabel}>
          {uncheckedCount} remaining
          {checkedCount > 0 ? ` · ${checkedCount} checked` : ''}
        </Text>
      )}
    </>
  );

  // Footer rendered below all sections — shows "Clear checked" button
  const listFooter = checkedCount > 0 ? (
    <TouchableOpacity
      style={styles.clearButton}
      onPress={clearChecked}
      accessibilityLabel={`Clear ${checkedCount} checked item${checkedCount !== 1 ? 's' : ''}`}
      accessibilityRole="button"
    >
      <Ionicons name="trash-outline" size={16} color={Colors.textSecondary} />
      <Text style={styles.clearButtonText}>
        Clear {checkedCount} checked item{checkedCount !== 1 ? 's' : ''}
      </Text>
    </TouchableOpacity>
  ) : null;

  // ── Empty state ────────────────────────────────────────────────────────────

  if (shoppingList.length === 0) {
    return (
      <View style={styles.container}>
        {listHeader}
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>Your shopping list is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add items manually above, or tap "Add to Shopping List" on any saved recipe.
          </Text>
        </View>
      </View>
    );
  }

  // ── Populated state ────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Input row ─────────────────────────────────────────────────────────────
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 12,
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

  // ── Count summary ─────────────────────────────────────────────────────────
  countLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodySmall,
    color: Colors.textSecondary,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },

  // ── Section list content ──────────────────────────────────────────────────
  listContent: {
    paddingBottom: 24,
  },

  // ── Category section headers ──────────────────────────────────────────────
  sectionHeader: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },

  sectionHeaderChecked: {
    paddingTop: 28,
  },

  sectionHeaderText: {
    fontFamily: FontFamily.headingSemibold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: Colors.primary,
  },

  sectionHeaderTextChecked: {
    color: Colors.textSecondary,
  },

  // ── Item rows ─────────────────────────────────────────────────────────────
  // Items sit in surface cards with horizontal margin so the category header
  // text aligns with them.
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 6,
    borderRadius: Radius.r400,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },

  itemRowChecked: {
    opacity: 0.6,
  },

  checkbox: {
    flexShrink: 0,
  },

  itemContent: {
    flex: 1,
    gap: 2,
  },

  itemName: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodyBase,
    color: Colors.textPrimary,
  },

  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },

  itemRecipe: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.textSecondary,
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

  // ── Clear checked button ──────────────────────────────────────────────────
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceHigh,
    minHeight: 44,
    gap: 8,
  },

  clearButtonText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodyBase,
    color: Colors.textSecondary,
  },
});

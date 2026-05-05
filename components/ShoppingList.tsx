// ShoppingList — accordion-based multi-list shopping UI.
//
// Layout:
//   • "Create a new shopping list" CTA at the top
//   • Name-entry modal appears when the CTA is tapped
//   • Each ShoppingListGroup renders as an accordion card:
//       collapsed → title + item count + chevron
//       expanded  → manual-add input, items grouped by category, clear-checked button
//   • Empty state when no lists exist

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Keyboard,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

import { useShoppingList } from '@/context/ShoppingListContext';
import type { ShoppingListItem, ShoppingListGroup } from '@/context/ShoppingListContext';
import { SHOPPING_CATEGORY_ORDER } from '@/utils/ingredientUtils';
import { Colors, FontFamily, FontSize, Radius, Stroke } from '@/constants/tokens';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Accordion list card ──────────────────────────────────────────────────────

function ListAccordion({ list }: { list: ShoppingListGroup }) {
  const { addManualItemToList, toggleItem, removeItem, clearChecked, deleteList, renameList } =
    useShoppingList();

  const [expanded, setExpanded] = useState(true);
  const [inputText, setInputText] = useState('');
  const [inputFocused, setInputFocused] = useState(false);

  // Rename modal state — same keyboard/opacity pattern as the create modal
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameText, setRenameText]       = useState('');
  const [renameKbHeight, setRenameKbHeight] = useState(0);
  const renameOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!renameVisible) renameOpacity.setValue(0);
  }, [renameVisible]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = Keyboard.addListener(showEvent, (e) => {
      setRenameKbHeight(e.endCoordinates.height);
      Animated.timing(renameOpacity, {
        toValue: 1, duration: 180, useNativeDriver: true,
      }).start();
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setRenameKbHeight(0);
      renameOpacity.setValue(0);
    });
    return () => { onShow.remove(); onHide.remove(); };
  }, []);

  const openRename = () => {
    setRenameText(list.name);
    setRenameVisible(true);
  };

  const handleRename = () => {
    renameList(list.id, renameText);
    setRenameVisible(false);
  };

  const uncheckedCount = list.items.filter((i) => !i.checked).length;
  const checkedCount   = list.items.length - uncheckedCount;

  // Items grouped by category for the expanded view
  const sections = useMemo(() => {
    const unchecked = list.items.filter((i) => !i.checked);
    const checked   = list.items.filter((i) => i.checked);
    const result: { title: string; data: ShoppingListItem[]; isChecked?: boolean }[] = [];

    for (const cat of SHOPPING_CATEGORY_ORDER) {
      const items = unchecked.filter((i) => i.category === cat);
      if (items.length > 0) result.push({ title: cat, data: items });
    }
    // Catch items in categories not listed in SHOPPING_CATEGORY_ORDER
    const categorised = new Set(SHOPPING_CATEGORY_ORDER);
    const other = unchecked.filter((i) => !categorised.has(i.category));
    if (other.length > 0) result.push({ title: 'Other', data: other });

    if (checked.length > 0) {
      result.push({ title: 'In your basket', data: checked, isChecked: true });
    }
    return result;
  }, [list.items]);

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  const handleAdd = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    addManualItemToList(trimmed, list.id);
    setInputText('');
  };

  return (
    <View style={styles.accordion}>
      {/* ── Header row ─────────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={handleToggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${list.name}, ${list.items.length} items, ${expanded ? 'collapse' : 'expand'}`}
      >
        <View style={styles.accordionHeaderLeft}>
          <Text style={styles.accordionTitle} numberOfLines={1}>{list.name}</Text>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); openRename(); }}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            accessibilityLabel={`Rename ${list.name}`}
            accessibilityRole="button"
          >
            <MaterialIcons name="edit" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
          {list.items.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {uncheckedCount > 0 ? uncheckedCount : list.items.length}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.accordionHeaderRight}>
          {/* Delete list */}
          <TouchableOpacity
            onPress={() => deleteList(list.id)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 4 }}
            accessibilityLabel={`Delete ${list.name}`}
            accessibilityRole="button"
          >
            <Ionicons name="trash-outline" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={Colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {/* ── Expanded content ───────────────────────────────────────────────── */}
      {expanded && (
        <View style={styles.accordionBody}>
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
            />
            <TouchableOpacity
              style={[styles.addButton, !inputText.trim() && styles.addButtonDisabled]}
              onPress={handleAdd}
              disabled={!inputText.trim()}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Empty list state */}
          {list.items.length === 0 && (
            <View style={styles.listEmptyState}>
              <Text style={styles.listEmptyText}>
                No items yet — add one above or tap "Add to Shopping List" on a saved recipe.
              </Text>
            </View>
          )}

          {/* Items grouped by category */}
          {sections.map((section) => (
            <View key={section.title}>
              <Text style={[
                styles.categoryLabel,
                section.isChecked && styles.categoryLabelChecked,
              ]}>
                {section.title.toUpperCase()}
              </Text>
              {section.data.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemRow, item.checked && styles.itemRowChecked]}
                  onPress={() => toggleItem(list.id, item.id)}
                  activeOpacity={0.7}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: item.checked }}
                  accessibilityLabel={`${item.checked ? 'Uncheck' : 'Check'} ${item.name}`}
                >
                  <Ionicons
                    name={item.checked ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={item.checked ? Colors.primary : Colors.textSecondary}
                  />
                  <View style={styles.itemContent}>
                    <Text style={[styles.itemName, item.checked && styles.itemNameChecked]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.recipeName && !item.checked && (
                      <Text style={styles.itemRecipe} numberOfLines={1}>
                        from {item.recipeName}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => removeItem(list.id, item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel={`Remove ${item.name}`}
                  >
                    <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* Clear checked button */}
          {checkedCount > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => clearChecked(list.id)}
              accessibilityLabel={`Clear ${checkedCount} checked item${checkedCount !== 1 ? 's' : ''}`}
            >
              <Ionicons name="trash-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.clearButtonText}>
                Clear {checkedCount} checked item{checkedCount !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Rename modal ────────────────────────────────────────────────────── */}
      <Modal
        visible={renameVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameVisible(false)}
      >
        <TouchableOpacity
          style={[StyleSheet.absoluteFill, styles.modalOverlay]}
          activeOpacity={1}
          onPress={() => setRenameVisible(false)}
        />
        <Animated.View
          style={[styles.modalKav, { bottom: renameKbHeight + 20, opacity: renameOpacity }]}
          pointerEvents="box-none"
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rename list</Text>
            <TextInput
              style={styles.modalInput}
              value={renameText}
              onChangeText={setRenameText}
              placeholder="List name…"
              placeholderTextColor={Colors.textSecondary}
              autoFocus
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleRename}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setRenameVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={handleRename}
              >
                <Text style={styles.modalConfirmText}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ShoppingList() {
  const { lists, createList } = useShoppingList();

  const [modalVisible, setModalVisible] = useState(false);
  const [newListName, setNewListName]   = useState('');

  // Card is invisible until the keyboard height is known — then it snaps
  // to the correct position and fades in. No Y-axis movement ever.
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const cardOpacity = useRef(new Animated.Value(0)).current;

  // Reset opacity whenever the modal closes so it's hidden on next open
  useEffect(() => {
    if (!modalVisible) cardOpacity.setValue(0);
  }, [modalVisible]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });

    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      cardOpacity.setValue(0);
    });

    return () => { onShow.remove(); onHide.remove(); };
  }, []);

  const handleCreateList = () => {
    const name = newListName.trim();
    createList(name || 'New list');
    setNewListName('');
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Create new list CTA ──────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.createCta}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Create a new shopping list"
        >
          <Ionicons name="add" size={20} color={Colors.primary} />
          <Text style={styles.createCtaText}>Create a new shopping list</Text>
        </TouchableOpacity>

        {/* ── Accordion list cards ─────────────────────────────────────────── */}
        {lists.length > 0 ? (
          lists.map((list) => <ListAccordion key={list.id} list={list} />)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No shopping lists yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap "Create a new shopping list" above to get started.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── New list name modal ──────────────────────────────────────────────── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        {/* Dimming overlay — always covers full screen, never shrinks */}
        <TouchableOpacity
          style={[StyleSheet.absoluteFill, styles.modalOverlay]}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        />
        {/* Card — fixed position above keyboard, fades in only, no Y movement */}
        <Animated.View
          style={[styles.modalKav, { bottom: keyboardHeight + 20, opacity: cardOpacity }]}
          pointerEvents="box-none"
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <Text style={styles.modalTitle}>New shopping list</Text>
            <TextInput
              style={styles.modalInput}
              value={newListName}
              onChangeText={setNewListName}
              placeholder="e.g. Weekly shop, Date night…"
              placeholderTextColor={Colors.textSecondary}
              autoFocus
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleCreateList}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => { setModalVisible(false); setNewListName(''); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={handleCreateList}
              >
                <Text style={styles.modalConfirmText}>Create</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 32,
    gap: 12,
  },

  // ── Create CTA ──────────────────────────────────────────────────────────────
  createCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 4,
    paddingVertical: 16,
    borderRadius: Radius.full,
    backgroundColor: '#D5FB2A',
    gap: 8,
    shadowColor: '#383834',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  createCtaText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.bodyBase,
    color: Colors.primary,
  },

  // ── Accordion card ───────────────────────────────────────────────────────────
  accordion: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: Radius.r400,
    overflow: 'hidden',
  },

  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },

  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },

  accordionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  accordionTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.subheading,
    color: Colors.textPrimary,
    flexShrink: 1,
  },

  countBadge: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },

  countBadgeText: {
    fontFamily: FontFamily.heading,
    fontSize: 11,
    color: '#ffffff',
  },

  // ── Accordion body ───────────────────────────────────────────────────────────
  accordionBody: {
    paddingBottom: 16,
  },

  // ── Manual-add input ─────────────────────────────────────────────────────────
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  input: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radius.r200,
    paddingHorizontal: 14,
    fontSize: FontSize.bodyBase,
    fontFamily: FontFamily.body,
    color: Colors.textPrimary,
    borderBottomWidth: Stroke.focusRing,
    borderBottomColor: 'transparent',
  },

  inputFocused: {
    borderBottomColor: Colors.primary,
  },

  addButton: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addButtonDisabled: {
    opacity: 0.4,
  },

  addButtonText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.bodyBase,
    color: Colors.onPrimary,
  },

  // ── Empty list state ─────────────────────────────────────────────────────────
  listEmptyState: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  listEmptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodySmall,
    color: Colors.textSecondary,
    lineHeight: FontSize.bodySmall * 1.5,
  },

  // ── Category labels ──────────────────────────────────────────────────────────
  categoryLabel: {
    fontFamily: FontFamily.headingSemibold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: Colors.primary,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },

  categoryLabelChecked: {
    color: Colors.textSecondary,
    paddingTop: 20,
  },

  // ── Item rows ────────────────────────────────────────────────────────────────
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHigh,
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: Radius.r400,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },

  itemRowChecked: {
    opacity: 0.6,
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

  // ── Clear checked button ─────────────────────────────────────────────────────
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    minHeight: 44,
    gap: 8,
  },

  clearButtonText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodySmall,
    color: Colors.textSecondary,
  },

  // ── Global empty state ───────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 48,
    gap: 12,
  },

  emptyTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.subheading,
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

  // ── New list modal ───────────────────────────────────────────────────────────
  // Full-screen dim — absoluteFill, never affected by keyboard
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  // Card positioner — absolutely positioned so `bottom` drives it above the keyboard
  modalKav: {
    position: 'absolute',
    left: 28,
    right: 28,
  },

  modalCard: {
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: Radius.r400,
    padding: 28,
    gap: 20,
  },

  modalTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.heading,
    color: Colors.textPrimary,
  },

  modalInput: {
    height: 52,
    backgroundColor: Colors.surface,
    borderRadius: Radius.r200,
    paddingHorizontal: 16,
    fontSize: FontSize.bodyBase,
    fontFamily: FontFamily.body,
    color: Colors.textPrimary,
    borderBottomWidth: Stroke.focusRing,
    borderBottomColor: Colors.primary,
  },

  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },

  modalCancel: {
    flex: 1,
    height: 52,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalCancelText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.bodyBase,
    color: Colors.textSecondary,
  },

  modalConfirm: {
    flex: 1,
    height: 52,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalConfirmText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.bodyBase,
    color: Colors.onPrimary,
  },
});

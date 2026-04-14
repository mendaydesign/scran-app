// CategoryFilter — horizontal scrollable row of pill-shaped filter chips.
// Receives the full category list and the currently selected category from the
// parent. Calls onSelect when the user taps a chip.

import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import {
  Colors,
  FontSize,
  FontWeight,
  Radius,
  Stroke,
} from '@/constants/tokens';

interface CategoryFilterProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

export default function CategoryFilter({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles.row}
    >
      {categories.map((cat) => {
        const isActive = cat === selected;
        return (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(cat)}
            accessibilityLabel={`Filter by ${cat}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Prevent the ScrollView from growing to fill flex space — it must only
  // ever be as tall as its chip content.
  scrollView: {
    flexGrow: 0,
    flexShrink: 0,
  },

  // Horizontal flex row with horizontal padding so first/last chips don't sit
  // flush against the screen edge. Vertical padding is kept minimal because
  // spacing above/below the strip is owned by the parent (index.tsx margins).
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
    alignItems: 'center',
  },

  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: Stroke.border,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    // Ensure the touch target meets the 44px minimum even for short labels
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Active chip uses the accent colour for both background and border
  chipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },

  chipText: {
    fontSize: FontSize.bodySmall,
    // Single-line variant — line height = font size so the chip stays compact
    lineHeight: FontSize.bodySmall,
    fontWeight: FontWeight.regular,
    color: Colors.textSecondary,
  },

  chipTextActive: {
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
});

// CategoryFilter — horizontal scrollable row of pill-shaped filter chips.
// Receives the full category list and the currently selected category from the
// parent. Calls onSelect when the user taps a chip.

import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import {
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Radius,
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    // Ambient shadow — just enough to lift chips off the background
    shadowColor: '#383834',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  // Active chip: solid primary green fill, no stroke
  chipActive: {
    backgroundColor: Colors.primary,
    borderWidth: 0,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },

  chipText: {
    fontFamily: FontFamily.headingSemibold,
    fontSize: FontSize.bodySmall,
    // Single-line variant — line height = font size so the chip stays compact
    lineHeight: FontSize.bodySmall,
    fontWeight: FontWeight.regular,
    color: Colors.primary,
  },

  chipTextActive: {
    fontFamily: FontFamily.heading,
    fontWeight: FontWeight.bold,
    color: Colors.onPrimary,
  },
});

/**
 * Design system tokens for SCRAN
 * All values sourced from CLAUDE.md — do not hardcode these elsewhere.
 */

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const FontSize = {
  titleHero: 72,
  titlePage: 48,
  subtitle: 32,
  heading: 24,
  subheading: 20,
  bodyBase: 16,
  bodyStrong: 16,
  bodyEmphasis: 16,
  bodyLink: 16,
  bodyCode: 16,
  bodySmall: 14,
  bodySmallStrong: 14,
} as const;

// Line heights expressed as multipliers (e.g. 1.2 = 120%)
export const LineHeight = {
  tight: 1.0,   // Single-line variants — labels, buttons, chips
  heading: 1.2, // Title Hero, Title Page, Subtitle, Heading, Subheading
  body: 1.4,    // All body styles
  code: 1.3,    // Body Code
} as const;

export const FontWeight = {
  regular: '400' as const,
  bold: '700' as const,
} as const;

// ---------------------------------------------------------------------------
// Border radius
// ---------------------------------------------------------------------------

export const Radius = {
  r100: 4,    // Subtle rounding — inputs, small elements
  r200: 8,    // Cards, containers
  r400: 16,   // Modals, larger elements
  full: 9999, // Pills, circular buttons, tags
} as const;

// ---------------------------------------------------------------------------
// Stroke / border widths
// ---------------------------------------------------------------------------

export const Stroke = {
  border: 1,     // Default borders
  focusRing: 2,  // Focus / active states
} as const;

// ---------------------------------------------------------------------------
// Blur
// ---------------------------------------------------------------------------

export const Blur = {
  subtle: 4, // blur-100 — subtle background blur
} as const;

// ---------------------------------------------------------------------------
// Icon sizes
// ---------------------------------------------------------------------------

export const IconSize = {
  small: 24,
  medium: 32,
  large: 40,
} as const;

// ---------------------------------------------------------------------------
// Colours — TODO: replace with Figma tokens when design is finalised
// ---------------------------------------------------------------------------

export const Colors = {
  // Temporary values — update once Figma colour system is ready
  background: '#1A1A1A',
  surface: '#2A2A2A',
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA',
  accent: '#FF6B35',
  border: '#333333',
} as const;

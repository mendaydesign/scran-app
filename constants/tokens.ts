/**
 * Design system tokens for SCRAN
 * Visual direction: "The Graphic Editorial" — see DESIGN.md.
 * Typography font families are unchanged (Clash Grotesk Bold / NeueHaasDisplay-Light).
 */

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

// Font family names must match the keys passed to useFonts() in app/_layout.tsx
export const FontFamily = {
  heading: 'ClashGrotesk-Bold',       // Used for: Title Hero, Title Page, Subtitle, Heading, Subheading
  body:    'NeueHaasDisplay-Light',   // Used for: Body Base, Body Strong, Body Emphasis, Body Link, Body Small, Body Code
} as const;

export const FontSize = {
  titleHero:       72,
  titlePage:       48,
  subtitle:        32,
  heading:         24,
  subheading:      20,
  bodyBase:        16,
  bodyStrong:      16,
  bodyEmphasis:    16,
  bodyLink:        16,
  bodyCode:        16,
  bodySmall:       14,
  bodySmallStrong: 14,
} as const;

// Line heights expressed as multipliers (e.g. 1.2 = 120%)
export const LineHeight = {
  tight:   1.0, // Single-line variants — labels, buttons, chips
  heading: 1.2, // Title Hero, Title Page, Subtitle, Heading, Subheading
  body:    1.4, // All body styles
  code:    1.3, // Body Code
} as const;

export const FontWeight = {
  regular: '400' as const,
  bold:    '700' as const,
} as const;

// ---------------------------------------------------------------------------
// Border radius
// ---------------------------------------------------------------------------
// "The Graphic Editorial" uses oversized rounding as a signature shape language.
// Avoid r100 / r200 except for technical micro-elements.

export const Radius = {
  r100: 4,    // Micro elements only — avoid in main UI
  r200: 8,    // Small rounding (inputs, small UI elements)
  r400: 32,   // lg (2rem) — cards, containers
  full: 9999, // xl pills — chips, pill buttons, tags
} as const;

// ---------------------------------------------------------------------------
// Stroke / border widths
// ---------------------------------------------------------------------------
// DESIGN RULE: no 1px solid borders for sectioning or containment.
// Borders are reserved for focus/active interactive states only.

export const Stroke = {
  focusRing: 2, // Focus / active states (e.g. focused input underline)
} as const;

// ---------------------------------------------------------------------------
// Blur
// ---------------------------------------------------------------------------
// Glassmorphism: surface colors at 70% opacity with 20px backdrop-blur.

export const Blur = {
  subtle: 4,   // blur-100 — subtle background blur
  glass:  20,  // Glassmorphism — floating headers / navigation overlays
} as const;

// ---------------------------------------------------------------------------
// Icon sizes
// ---------------------------------------------------------------------------

export const IconSize = {
  small:  24,
  medium: 32,
  large:  40,
} as const;

// ---------------------------------------------------------------------------
// Colours — "The Graphic Editorial" palette
// Light, warm off-white surfaces layered with deep forest green + pink + yellow.
// NO 1px solid borders — depth comes from surface-tier shifts instead.
// ---------------------------------------------------------------------------

export const Colors = {
  // ── Surfaces (warm off-white tonal hierarchy) ────────────────────────────
  background:    '#fffcf6', // Level 1 — the canvas
  surface:       '#f6f3ed', // Level 2 — layout blocks / chip backgrounds
  surfaceHigh:   '#f0eee6', // Level 3 — card backgrounds / nested modules

  // ── Primary green ────────────────────────────────────────────────────────
  primary:       '#317055', // Deep forest green — buttons, active states, accent
  primaryDim:    '#236349', // Pressed / hover variant of primary
  onPrimary:     '#ffffff', // Text / icons on a primary background

  // ── Secondary pink ───────────────────────────────────────────────────────
  secondary:            '#B0255A', // Vivid secondary — interactive elements, nope button ring
  onSecondary:          '#ffffff',
  secondaryContainer:   '#ffd7e4', // Soft pink container
  onSecondaryContainer: '#3e001e', // Text on pink container

  // ── Tertiary yellow ──────────────────────────────────────────────────────
  tertiaryContainer:   '#f4e645', // Sharp yellow container
  onTertiaryContainer: '#1f1c00', // Text on yellow container

  // ── Text ─────────────────────────────────────────────────────────────────
  textPrimary:   '#383834', // on-surface — main readable text
  textSecondary: '#66635d', // on-surface-variant — captions, metadata

  // ── Accent alias (maps to primary — kept for existing references) ────────
  accent:        '#317055',

  // ── Ghost border (15% opacity outline-variant — accessibility fallback) ──
  // Use sparingly; prefer surface-tier shifts over explicit borders.
  border: 'rgba(56, 56, 52, 0.15)',
} as const;

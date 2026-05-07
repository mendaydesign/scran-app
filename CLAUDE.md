# CLAUDE.md — Project Instructions

> Claude Code: read this file before every task. Follow these rules strictly.

---

## Project Overview

**App Name:** [TBD — to be decided]
**What it is:** A Tinder-style mobile app for discovering new recipes. Users swipe through recipe cards — swipe right to save, swipe left to skip.
**Target platform:** Mobile (iOS and Android)
**Who it's for:** Home cooks who want an easy, fun way to find new meals.

---

## Core Features

### 1. Recipe Swiping
- Users see one recipe card at a time (image, title, cook time, difficulty)
- Swipe right = save to favourites
- Swipe left = skip
- Smooth, Tinder-style swipe animation

### 2. Category Filters
- Users can filter recipes by cuisine/category before swiping
- Categories include: Asian, Burgers, Pizza, Pasta, Mexican, Salads, Desserts, and more
- Multiple categories can be selected at once

### 3. Pantry Feature
- Users input ingredients they have at home
- Recipes are filtered to show meals that can be made with those ingredients
- Show a match percentage (e.g., "You have 8/10 ingredients")
- Allow filtering by "exact match only" or "close match"
- Ingredient text input uses `Radius.r400` (32px)

### 3b. Shopping List
- Lives on the Pantry tab (Shopping List sub-tab)
- Multiple named lists; each renders as an accordion card
- Lists can be renamed: `MaterialIcons edit` icon (16px, `Colors.textSecondary`) sits next to the list title and opens a rename modal
- **"New list" and "Rename" modals — keyboard pattern:** use `Keyboard.addListener('keyboardWillShow')` to get keyboard height, then snap the card to `bottom: keyboardHeight + 20` (no Y animation) and fade opacity `0 → 1` over 180ms. The full-screen dim overlay uses `StyleSheet.absoluteFill` so it is never affected by the keyboard. `KeyboardAvoidingView` is intentionally not used inside transparent modals on iOS as it causes glitches.
- `renameList(listId, name)` is exposed on `ShoppingListContext`
- `uncheckAll(listId)` resets all items to unchecked — used by the "Reuse List" CTA
- **Basket action buttons** (shown when ≥1 item is checked) — stacked vertically in this order:
  1. **"Add ingredients to pantry"** — lime (`#D5FB2A`) background, `Colors.primary` text/icon, full-width pill
  2. **"Reuse List"** — `Colors.primary` background, `Colors.onPrimary` text/icon, full-width pill
  3. **"Clear N checked items"** — destructive style (see Destructive CTAs below)
- **Success toast** fires after "Add ingredients to pantry" — same style and animation as the recipe detail toast (see Success Toast pattern below)

### 4. Saved Recipes
- A collection of all right-swiped recipes grouped by cuisine category
- Each category with ≥1 saved recipe renders as a named section (category heading + horizontal scroll row of cards)
- The page scrolls vertically; each category row scrolls independently and horizontally
- Category order follows `CATEGORIES` from `constants/mockRecipes.ts` (minus `'All'`)
- Cards are `160 × 248px` (`Radius.r300`), portrait ratio, with the same gradient overlay and title style as swipe cards

### 5. Onboarding
- 3-slide first-launch flow shown only once (persisted via `AsyncStorage` key `'onboarding_complete'`)
- All slides share a `#04492B` forest-green background with a `#FDFAF4` cream panel covering the top 60% of the screen (30px bottom corner radius)
- Persistent overlays: app logomark (SVG, centred at top of cream panel) and Skip CTA (top-right, `#04492B` text)
- Navigation is button-only (`scrollEnabled={false}` on FlatList) — Next pill advances slides, GO! completes onboarding
- **Back button animation:** on leaving slide 1, a Back button animates in from the left (width 0 → 50% of row) while Next shrinks to the remaining 50%. Easing: `Easing.bezier(0.92, -0.35, 0, 1.33)` over 500ms. Back button fades from 0→100% opacity over the first half of the animation. Reverses when returning to slide 1. Both button wrappers have a fixed `height: 56` to prevent any Y-axis movement during the transition.
- **Back button style:** `Colors.primary` (`#04492B`) background, 2px `#D5FB2A` lime border, lime text — inverse of the lime Next button
- **Animation implementation:** `react-native-reanimated` `useSharedValue` + `withTiming` + `interpolate` with `Extrapolation.CLAMP` (prevents the bezier overshoot from producing negative widths)
- Slide assets live in `assets/onboarding assets/` and must be supplied at 1×, @2×, @3× for sharp rendering (see image density rules below)
- **Image density rule:** export at 393px (1×), 786px (2×), 1179px (3×) width. Name files `image.png`, `image@2x.png`, `image@3x.png` — Metro auto-selects the correct variant
- `app/index.tsx` checks AsyncStorage on launch and routes to `/onboarding` (first time) or `/discover` (returning user). During active development the check is bypassed so onboarding always shows — restore it before release

---

## Tech Stack

- **Framework:** React Native with Expo SDK 54 (for cross-platform mobile)
- **Language:** TypeScript
- **Styling:** Use the design system tokens defined below — keep styling inline or in StyleSheet.create()
- **Navigation:** Expo Router (file-based routing)
- **State management:** Keep it simple — React useState/useContext. No Redux.
- **Data:** Local JSON files for MVP. No backend database needed yet.
- **Key installed packages:** `expo-image`, `expo-linear-gradient`, `expo-blur`, `react-native-reanimated`, `react-native-gesture-handler`, `react-native-svg`, `react-native-svg-transformer`
- **SVG support:** `metro.config.js` routes `.svg` files through `react-native-svg-transformer`. Import SVGs as React components: `import Logo from '@/assets/onboarding assets/Logo.svg'` then render as `<Logo width={x} height={y} />`

---

## Design System — Follow These Tokens Exactly

The visual direction is **"The Graphic Editorial"** — bold, fashion-forward, premium digital magazine aesthetic. See `DESIGN.md` for the full creative brief.

### Typography

> **Heading font:** Clash Grotesk Bold (`ClashGrotesk-Bold`) — Title Hero, Title Page, Subtitle, Heading, Subheading
> **Heading Semibold font:** Clash Grotesk Semibold (`ClashGrotesk-Semibold`) — Medium-weight headings, filter chip labels (inactive)
> **Body font:** Neue Haas Display Medium (`NeueHaasDisplay-Medium`) — Body Base, Body Strong, Body Emphasis, Body Link, Body Small, Body Code

Font files live in `assets/fonts/`. All three are registered in `app/_layout.tsx` via `useFonts` and exposed as `FontFamily.heading`, `FontFamily.headingSemibold`, and `FontFamily.body` in `constants/tokens.ts`.

| Token | Size (px) | Line Height (%) | Usage |
|-------|-----------|-----------------|-------|
| Title Hero | 72 | 120% | Splash/hero screens only |
| Title Page | 48 | 120% | Page titles |
| Subtitle | 32 | 120% | Section titles |
| Heading | 24 | 120% | Card headings, recipe titles |
| Subheading | 20 | 120% | Secondary headings |
| Body Base | 16 | 140% | Default body text |
| Body Strong | 16 (bold) | 140% | Emphasised body text |
| Body Emphasis | 16 (italic) | 140% | Italic body text |
| Body Link | 16 (underline) | 140% | Tappable links |
| Body Small | 14 | 140% | Captions, metadata |
| Body Small Strong | 14 (bold) | 140% | Emphasised small text |
| Body Code | 16 | 130% | Code or monospaced text |

**Single Line variants** (line height 100%): Use for labels, buttons, and chips where text must not wrap.

**Negative letter spacing in React Native:** RN applies `letterSpacing` as trailing space after every character including the last, so negative values clip the final glyph. Fix by adding `paddingRight` equal to the absolute value of the letter spacing on the `Text` element (e.g. `letterSpacing: -4.8` requires `paddingRight: 4.8`).

### Colours

The palette is a curated combination of deep forest green, warm off-white surfaces, punchy secondary pinks, and sharp tertiary yellows.

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#fffcf6` | Level 1 — the canvas, page background |
| `surface` | `#f6f3ed` | Level 2 — layout blocks, cards, chip backgrounds |
| `surfaceHigh` | `#f0eee6` | Level 3 — nested modules, alternative sections |
| `primary` | `#04492B` | Deep forest green — buttons, active states, accent |
| `primaryDim` | `#236349` | Pressed/hover variant of primary |
| `onPrimary` | `#ffffff` | Text and icons placed on a primary background |
| `secondary` | `#B0255A` | Vivid pink — interactive elements (e.g. nope button ring) |
| `onSecondary` | `#ffffff` | Text on secondary background |
| `secondaryContainer` | `#ffd7e4` | Soft pink container background |
| `onSecondaryContainer` | `#3e001e` | Text on secondary container |
| `tertiaryContainer` | `#f4e645` | Sharp yellow container background |
| `onTertiaryContainer` | `#1f1c00` | Text on tertiary container |
| `textPrimary` | `#383834` | Main readable text (on-surface) |
| `textSecondary` | `#66635d` | Captions, metadata (on-surface-variant) |
| `accent` | `#04492B` | Alias for primary — kept for backwards compatibility |
| `border` | `rgba(56, 56, 52, 0.15)` | Ghost border — accessibility fallback only, use sparingly |

### Border Radius

The signature shape language uses oversized rounding. Avoid `r100` in main UI. `r200` is used sparingly for tighter card shapes.

| Token | Value | Usage |
|-------|-------|-------|
| `r100` | 4px | Micro elements only — avoid in main UI |
| `r200` | 8px | Tight card shapes, inputs |
| `r300` | 20px | Medium rounding — saved recipe category row cards |
| `r400` | 32px | lg (2rem) — cards, containers, section blocks, pantry input |
| `full` | 9999px | xl pills — chips, pill buttons, tags |

### Stroke

Borders are **only** for interactive focus/active states. Never use them for sectioning or containment — use surface-tier colour shifts instead.

| Token | Value | Usage |
|-------|-------|-------|
| `focusRing` | 2px | Focus/active states (e.g. focused input underline) |

### Elevation & Depth

Depth is achieved through **tonal layering** and **ambient shadows** — not divider lines or heavy drop shadows.

**Tonal layering:** Stack `background` → `surface` → `surfaceHigh` to create natural lift between sections. A `surface` card on a `background` page needs no border — the colour shift defines the edge.

**Ambient shadows** (use only on floating elements — cards, buttons, modals):
- Colour: `#383834` (tinted on-surface) — never pure black
- Swipe cards: `shadowOpacity: 0.10`, `shadowRadius: 32`, `offset: { width: 0, height: 20 }`, `elevation: 8`
- Action buttons: `shadowOpacity: 0.12`, `shadowRadius: 20`, `offset: { width: 0, height: 6 }`, `elevation: 6`
- Filter chips: `shadowOpacity: 0.08`, `shadowRadius: 8`, `offset: { width: 0, height: 2 }`, `elevation: 2`

**Critical iOS rule — `backgroundColor` is required for shadows:**  iOS only renders a shadow on a view that has a solid `backgroundColor`. A view with `backgroundColor: 'transparent'` or no background colour will cast no shadow regardless of shadow props. Always set a background colour on the shadow-owning view.

**Shadow + overflow:hidden:** React Native clips shadows when a view has `overflow: 'hidden'`. Always apply the shadow to a *parent wrapper* view and put `overflow: 'hidden'` on the inner child. The wrapper owns the shadow and `borderRadius`; the inner view owns `overflow: 'hidden'` for image/content clipping.

### Blur

| Token | Value | Usage |
|-------|-------|-------|
| `subtle` | 4px | Subtle background blur |
| `glass` | 20px | Glassmorphism — floating headers/navigation overlays at 70% surface opacity |

**Glassmorphism implementation** (e.g. recipe card badges): use `BlurView` from `expo-blur` as the container instead of a plain `View`. Set `intensity={60}`, `tint="light"`, `backgroundColor: 'rgba(255,255,255,0.30)'`, and `borderWidth: 1, borderColor: 'rgba(255,255,255,0.30)'` on the style. Always add `overflow: 'hidden'` to the `BlurView` style so `borderRadius` clips the blur correctly.

### Icon Sizes

| Token | Value |
|-------|-------|
| `icon-small` | 24px |
| `icon-medium` | 32px |
| `icon-large` | 40px |

---

## Component Guidelines

### The "No-Line" Rule
**Never use 1px solid borders for sectioning or containment.** Boundaries must be defined solely through background colour shifts. The only exceptions are:
- `focusRing` (2px) on focused input fields
- Decorative button rings (e.g. the nope button's secondary-coloured ring) — these are interactive design elements, not structural lines
- Inactive filter chips — 1px `Colors.primary` stroke that communicates interactivity
- Glassmorphism pantry match badge pill — 1px `rgba(255,255,255,0.30)` stroke to define the pill edge against the image (standard metadata badges are solid-coloured, not glassmorphism)

### Buttons
- **Primary:** `primary` background (`#04492B`), `onPrimary` text (`#ffffff`), `Radius.full` (pill shape), ambient shadow
- **Secondary / Ghost:** `surface` or `surfaceHigh` background, `textPrimary` text, `Radius.full`
- **Nope action button:** 72×72px circle, `background` fill with a 2px `secondary` coloured ring, `secondary` coloured icon — decorative ring communicates the action, not a structural border
- **Like action button:** 72×72px circle, `primary` background, `onPrimary` (white) heart icon
- Minimum touch target: 44px height

### Chips & Filter Tags
- **Inactive:** transparent fill, 1px `Colors.primary` stroke (`borderWidth: 1, borderColor: Colors.primary`), `Colors.primary` text, `FontFamily.headingSemibold`, `Radius.full`, subtle ambient shadow (`shadowOpacity: 0.08`)
- **Active:** solid `Colors.primary` (`#04492B`) fill, no border (`borderWidth: 0`), `#D5FB2A` (lime) text, `FontFamily.heading` (ClashGrotesk-Bold), `Radius.full`, slightly stronger shadow
- Horizontal padding: 20px minimum

### Input Fields
- Background: `surface`
- No border by default
- On focus: 2px bottom-weighted line in `primary` colour (`borderBottomWidth: 2, borderBottomColor: Colors.primary`)
- Use `onFocus`/`onBlur` state to toggle the active bottom line

### Recipe Detail Screen
- **Hero image:** no scrim/overlay — the photo is shown clean with no darkening layer at the bottom
- **Back button (top-left):** 40×40px circle, `Colors.primary` (`#04492B`) background, `Colors.onPrimary` (white) chevron icon — same pill style as primary buttons
- **Save button (top-right):** same 40×40px circle with `Colors.primary` background

### Recipe Cards (swipe + grid)
- Shape: `Radius.r400` (32px), `overflow: 'hidden'` on inner card, shadow on outer wrapper (see Elevation rules)
- **Image overlay:** `LinearGradient` from `expo-linear-gradient`, not a plain dark `View`
  - Colour: `#004B33` (deep forest green)
  - Stops: `['rgba(0,75,51,0)', 'rgba(0,75,51,0.40)', 'rgba(0,75,51,0.95)']`
  - Locations: `[0, 0.6, 1]` — transparent at top, 40% opacity at 60% down, 95% at bottom
  - Direction: `start={{ x:0, y:0 }}` → `end={{ x:0, y:1 }}`
- **Card title:** uppercase (`toUpperCase()`), `fontSize: 36`, `fontWeight: bold`, `ClashGrotesk-Bold`, white (`#ffffff`), `lineHeight: 36 * 1.1`
- **Metadata badges (cook time, difficulty, serves):** solid-coloured pill badges — NOT glassmorphism. Use `Radius.full`, `paddingHorizontal: 12`, `paddingVertical: 7`, `FontFamily.heading` (ClashGrotesk-Bold) at `fontSize: 12`, uppercase text. Colour spec:
  - **Cook / Prep time:** background `#B8F9D7`, icon & text `#226248`, clock icon (`Ionicons time-outline`)
  - **Easy:** background `#D5FB2A`, icon & text `#3A5500`, 1× `MaterialIcons bolt` icon
  - **Medium:** background `#FBA42A`, icon & text `#4C310C`, 2× `MaterialIcons bolt` icons (second has `marginLeft: -5` to overlap)
  - **Hard:** background `#FB2A2A`, icon & text `#FFE2E2`, 3× `MaterialIcons bolt` icons
  - **Serves:** background `#F9B8F5`, icon & text `#4A3849`, people icon (`Ionicons people-outline`), label format `SERVES {n}`
- **Pantry match badge** (shown automatically when pantry has ≥1 item — no manual toggle): positioned absolutely at `top: 20, left: 20` on the card. Renders as a row: glassmorphism badge (`BlurView intensity={60}`, `tint="light"`, `rgba(255,255,255,0.30)` bg + border, white icon/text) followed by a `"Matched Ingredients"` label in `FontFamily.headingSemibold`, `FontSize.bodySmall`, `rgba(255,255,255,0.85)`. The standard badges (cook time, difficulty, serves) remain in the bottom overlay and are unaffected.
- No divider lines between sections — use `surface` vs `surfaceHigh` containers or 32–48px vertical spacing instead

### Destructive CTAs
- **No background** — destructive actions (e.g. "Clear All" on pantry, "Clear N checked items" on shopping list) use no container colour
- Text and icon both use `#D00F0F` (red)
- Font: `FontFamily.heading` (Clash Grotesk Bold)
- Layout: icon (`trash-outline`, 16px) + label, centred, `minHeight: 44`

### Success Toast
Used after actions that add items to another list (e.g. "Add to Shopping List", "Add ingredients to pantry").
- **Background:** `#D5FB2A` (lime)
- **Text:** `FontFamily.heading`, `FontSize.bodyBase`, `Colors.primary` (forest green)
- **Icon:** 36×36px circle, `Colors.primary` background, `checkmark-sharp` icon at 22px in `#D5FB2A`
- **Layout:** full-width pill (`Radius.full`), `paddingLeft: 24`, `paddingRight: 12`, `paddingVertical: 16`, text `flex: 1`, icon on the right
- **Animation:** `react-native-reanimated` `useSharedValue(200)` → `withTiming(0, 380ms, Easing.out(Easing.cubic))` on show; `withTiming(200, 300ms, Easing.in(Easing.cubic))` on hide, then `runOnJS(setToast)(null)`
- **Always mounted** (no conditional render) — translateY drives visibility so the slide-out animation plays before text clears
- **Positioning on recipe detail screen** (no tab bar): `bottom: insets.bottom + 24`
- **Positioning inside tab screens** (e.g. Shopping List on Pantry tab): `bottom: 12` — the tab navigator already offsets content above the tab bar, so no extra offset is needed

### Tab Bar
- Background: `Colors.surface`
- Labels: hidden (`tabBarShowLabel: false`)
- Active tab: solid `Colors.primary` circle (44×44px, `borderRadius: 22`) behind the icon, white icon
- Inactive tab: plain icon in `Colors.textSecondary`, no background
- Height: `80` on iOS (accounts for home indicator), `60` on Android
- Bottom padding: `20` on iOS, `8` on Android
- No top border (`borderTopWidth: 0`)

### Section Blocks
- Wrap distinct content sections (e.g. Ingredients, Method) in rounded containers (`Radius.r400`) with `surface` or `surfaceHigh` backgrounds
- Alternate between `surface` and `surfaceHigh` for adjacent sections to create tonal contrast without lines

---

## Code Rules

1. **Keep it simple.** This is an MVP. Do not over-engineer.
2. **One component per file.** Name files in PascalCase (e.g., `RecipeCard.tsx`).
3. **Use TypeScript** for all files. Define types/interfaces for data structures.
4. **No external state libraries.** Use React hooks (useState, useContext, useEffect).
5. **Comment your code.** Add brief comments explaining what each section does — the developer is learning.
6. **Use the design tokens above.** Do not hardcode font sizes, radii, or colours — reference the design system.
7. **Mobile-first.** Everything should look and feel native on a phone screen.
8. **Accessibility matters.** Use proper labels, sufficient contrast, and touch targets of at least 44px.

---

## Folder Structure

```
/app                  → Screens and navigation (Expo Router)
/components           → Reusable UI components (RecipeCard, SwipeStack, PantryInput, etc.)
/constants            → Design tokens, category lists, mock data
/assets/fonts         → Custom font files (ClashGrotesk-Bold.otf, ClashGrotesk-Semibold.otf, NeueHaasDisplayMediu.ttf)
/assets/onboarding assets → Onboarding screen images (1×/2×/3× PNGs) and SVG logomark
/assets/images        → App icons and splash assets
/assets/Recipe-images → Recipe photography
/types                → TypeScript type definitions
/context              → React Context providers (e.g., PantryContext, SavedRecipesContext)
```

---

## When In Doubt

- Prioritise working over perfect.
- Ask before adding new dependencies.
- If a feature feels complex, build the simplest version first.
- Keep the user informed — explain what you're building and why.

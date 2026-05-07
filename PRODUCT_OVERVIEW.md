# SCRAN — Product Overview

> This document is written for a marketing/creative agent. It describes what SCRAN is, how it works, what each screen looks like, and the key user interactions. Use this to understand the product deeply before writing copy, creating visuals, or building campaigns.

---

## What SCRAN Is

SCRAN is a **Tinder-style recipe discovery app** for home cooks. Instead of searching through endless recipe lists, users swipe through recipe cards one at a time:

- **Swipe right** → save the recipe to your collection
- **Swipe left** → skip it

The mechanic turns recipe discovery from a chore into something playful. The app is built for iOS and Android using React Native/Expo.

---

## Core Value Propositions

1. **Discovery without overwhelm** — one recipe at a time, no decision paralysis
2. **Your pantry, your recipes** — filter recipes by ingredients you already have at home
3. **Your collection, always with you** — saved recipes live in one place, fully accessible offline
4. **Shopping made easy** — add missing ingredients directly to a named shopping list from any saved recipe

---

## The Five Screens

### 1. Onboarding (first launch only)

Three-slide introduction shown once. After completion, users go straight to the discover feed.

**Visual:** Deep forest green screen (`#04492B`) with a warm cream panel (`#FDFAF4`) covering the top 60%. The app's "S" logomark floats at the top of the cream panel. Slide illustrations sit inside the cream panel; headline and body copy sit below on the green.

**Slides:**
- **Slide 1 — "Swipe to Discover":** Introduces the swipe mechanic. Illustration shows the recipe card swiping experience. Full-width lime CTA button: "Next"
- **Slide 2 — "Use Your Pantry":** Introduces pantry filtering. Illustration shows the pantry ingredient input. Back + Next buttons appear side by side (animated in).
- **Slide 3 — "You're All Set!":** Confirmation slide. CTA becomes "GO!" which launches the app.

Navigation is button-only (no swipe gesture on the onboarding itself). A persistent "Skip" link sits top-right throughout.

---

### 2. Discover (main tab)

The core swiping experience. This is where users spend most of their time.

**Visual:** The app's warm off-white background with a stack of recipe cards filling the centre of the screen. Above the cards: a horizontal scrolling row of category filter chips. Below the cards: two circular action buttons (like and nope).

**Recipe Card anatomy:**
- Full-bleed food photograph fills the card
- Deep forest green gradient overlay rises from the bottom (~60% up) to make the text legible
- Recipe title in large bold white uppercase type (Clash Grotesk Bold, 36px)
- Metadata badges sit above the title in a row — pill-shaped, colour-coded:
  - **Cook time:** mint green (`#B8F9D7`) background, clock icon
  - **Difficulty:** Easy = lime (`#D5FB2A`), Medium = amber (`#FBA42A`), Hard = red (`#FB2A2A`) — bolt icon count matches level (1/2/3)
  - **Serves:** pink (`#F9B8F5`) background, people icon
- Cards have a 32px border radius and ambient shadow — they feel like physical cards

**Swipe actions:**
- Drag right / tap heart button → saves recipe, card flies off right with green tint overlay
- Drag left / tap × button → skips, card flies off left
- The × (nope) button: white circle with a vivid pink ring and pink icon
- The ♥ (like) button: forest green circle with white heart icon

**Category filters:** Horizontal pill chips above the cards. Inactive chips have a forest green 1px border; active chip is solid forest green with lime text.

**Pantry mode:** When pantry items are set, each recipe card shows an additional glassmorphism badge (frosted glass effect) indicating how many ingredients the user already has.

---

### 3. Saved Recipes (second tab)

A grid of all right-swiped recipes.

**Visual:** Two-column grid of recipe cards on the warm off-white background. Cards use a tighter 8px border radius (distinct from the swipe cards). Each card shows the food photo with the recipe name overlaid.

Tapping a card opens the Recipe Detail screen.

---

### 4. Recipe Detail Screen

Full recipe information, accessed from Saved Recipes.

**Visual:** The food photo fills the top ~300px of the screen (clean, no overlay). A floating forest green back button (top-left, circle) and a heart save/unsave button (top-right, circle) float over the image.

Below the image, on the warm off-white background:
- Recipe title in large bold type (Clash Grotesk, 32px)
- Row of metadata badges (same colour-coded pills as the swipe card)
- Description paragraph
- Three-tab segmented control: **Ingredients / Method / Nutrition**
  - The tab bar is a pill container in `surfaceHigh` tone; the active tab lifts to a lighter `surface` background — no borders, purely tonal
- **Ingredients tab:** bulleted list. If the recipe is saved, an "Add to Shopping List" button appears at the bottom — forest green pill button with a cart icon.
- **Method tab:** numbered steps in rounded `surfaceHigh` containers
- **Nutrition tab:** per-serving macros in a clean list

**Add to Shopping List flow:**
Tapping "Add to Shopping List" opens a bottom sheet modal:
- The sheet slides up; the background dims
- If lists exist: scrollable list of named lists with item counts — tap to add ingredients to that list
- "Create New List" lime pill button always visible at the bottom of the sheet
- Tapping "Create New List" transitions in-place to a text input for naming the list
- After confirming: a toast notification appears at the bottom — forest green pill, white Clash Grotesk text, lime circle with a forest green tick icon

---

### 5. Pantry (third tab, split into two sub-tabs)

#### My Pantry sub-tab
Users add ingredients they have at home. The text input field uses a large 32px border radius. Ingredients appear as removable pill tags.

When pantry items are set, the discover feed filters to prioritise recipes that use those ingredients, and each recipe card shows a pantry match badge.

#### Shopping List sub-tab
Named shopping lists displayed as accordion cards. Each list:
- Shows list name + item count badge
- `MaterialIcons edit` icon next to the name — taps to open a rename modal
- Expands to show items grouped by shopping category (Meat & Fish, Fresh Produce, Dairy, etc.)
- Manual add input at the top of each expanded list
- Items can be checked off (checkbox toggles); checked items move to an "In your basket" section at the bottom
- "Clear checked items" button appears when items are ticked
- Trash icon to delete the entire list

**Creating a new list:** Lime pill CTA at the top. Tapping it opens a modal — the card appears above the keyboard with a fade-in animation (no sliding movement). Naming the list and tapping "Create" adds it.

**Renaming a list:** Tapping the edit icon pre-fills the current name in the same modal pattern.

---

## Key Interactions Summary

| Interaction | Result |
|-------------|--------|
| Swipe right on recipe card | Recipe saved to collection |
| Swipe left on recipe card | Recipe skipped |
| Tap category chip | Filters the swipe deck to that category |
| Tap saved recipe card | Opens full recipe detail |
| Tap "Add to Shopping List" | Bottom sheet to select or create a list |
| Tap edit icon on list name | Rename modal appears |
| Check off shopping item | Item moves to "In your basket" |
| Tap pantry ingredient | Removes it from pantry |

---

## App Icon & Presence

- **Icon:** Forest green rounded square, bold lime "S" lettermark
- **App name on device:** SCRAN
- **Bundle ID:** com.harrymenday.scran
- **Platform:** iOS (TestFlight) and Android
- **Status:** MVP — live on TestFlight

---

## What Makes SCRAN Different

1. **The swipe mechanic** — nobody else applies this to recipe discovery. It's immediately intuitive.
2. **The pantry filter** — reduces food waste and answers "what can I make tonight?" instantly.
3. **The visual design** — most recipe apps look like spreadsheets. SCRAN looks like a magazine. That's a deliberate, ownable difference.
4. **Focused scope** — no social features, no ratings, no comments. Just: discover, save, cook.

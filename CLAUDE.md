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

### 4. Saved Recipes
- A collection of all right-swiped recipes
- Users can view full recipe details from here

---

## Tech Stack

- **Framework:** React Native with Expo (for cross-platform mobile)
- **Language:** TypeScript
- **Styling:** Use the design system tokens defined below — keep styling inline or in StyleSheet.create()
- **Navigation:** Expo Router or React Navigation
- **State management:** Keep it simple — React useState/useContext. No Redux.
- **Data:** Local JSON files for MVP. No backend database needed yet.

---

## Design System — Follow These Tokens Exactly

### Typography

> **Heading font:** Clash Grotesk Bold (`ClashGrotesk-Bold`) — Title Hero, Title Page, Subtitle, Heading, Subheading
> **Body font:** NeueHaasDisplay-Light (`NeueHaasDisplay-Light`) — Body Base, Body Strong, Body Emphasis, Body Link, Body Small, Body Code

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

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| radius-100 | 4px | Subtle rounding — inputs, small elements |
| radius-200 | 8px | Cards, containers |
| radius-400 | 16px | Modals, larger elements |
| radius-full | 9999px | Pills, circular buttons, tags |

### Stroke

| Token | Value | Usage |
|-------|-------|-------|
| border | 1px | Default borders |
| focus-ring | 2px | Focus/active states |

### Blur

| Token | Value | Usage |
|-------|-------|-------|
| blur-100 | 4px | Subtle background blur |

### Icon Sizes

| Token | Value |
|-------|-------|
| icon-small | 24px |
| icon-medium | 32px |
| icon-large | 40px |

### Colours

> [TODO: Add colour tokens from Figma design system when ready]

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
/assets               → Images, icons, fonts
/types                → TypeScript type definitions
/context              → React Context providers (e.g., PantryContext, SavedRecipesContext)
```

---

## When In Doubt

- Prioritise working over perfect.
- Ask before adding new dependencies.
- If a feature feels complex, build the simplest version first.
- Keep the user informed — explain what you're building and why.

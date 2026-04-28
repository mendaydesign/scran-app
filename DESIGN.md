# Design System Strategy: The Graphic Editorial

## 1. Overview & Creative North Star
This design system is anchored by a Creative North Star we call **"The Graphic Editorial."** It rejects the sterile, "software-as-a-service" aesthetic in favor of a bold, fashion-forward visual identity that feels like a premium digital magazine.

The system breaks the "template" look through **intentional maximalism**. We use hyper-bold typography as a structural element rather than just a way to deliver information. By combining eclectic, high-saturation color blocks with oversized rounded corners (`3rem` / `xl`), we create a "pill-and-poster" layout that feels energetic, digitally native, and authoritative.

---

## 2. Colors: Tonal Architecture
The palette is a curated clash of deep forest greens, punchy secondary pinks, and sharp tertiary yellows. 

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section sitting against a `background` provides all the edge definition needed. 

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. We use Material-style tiers to define nesting:
- **Level 1 (Foundation):** `surface` (#fffcf6) - The canvas.
- **Level 2 (Sectioning):** `surface-container` (#f6f3ed) - Large layout blocks.
- **Level 3 (Interaction):** `surface-container-high` (#f0eee6) - Card backgrounds or nested modules.

### Glass & Gradient (The Polish)
To avoid a flat, "cheap" look, use **Glassmorphism** for floating headers or navigation overlays. Use `surface` colors at 70% opacity with a `20px` backdrop-blur. 
- **Signature Textures:** For primary CTAs, apply a subtle linear gradient from `primary` (#04492B) to `primary-dim` (#236349) at a 135-degree angle. This adds "soul" and depth to the high-contrast elements.
- **Glassmorphism scope:** Applied only to contextual overlay badges (e.g. pantry match indicator on recipe cards). Standard metadata badges (cook time, difficulty, serves) use solid-coloured pills — see the Metadata Badges spec below.

---

## 3. Typography: The Expressive Voice
Typography is the primary visual driver of this system. We utilize two distinct personalities:

- **The Display Voice (Clash Grotesk Bold):** Used for `display` and `headline` tiers (`FontFamily.heading`). This is a heavy, grotesque-inspired face that should feel "too big" for the container. It conveys confidence and a fashion-forward edge. Use tight letter-spacing (-0.02em) for `display-lg`.
- **The Semibold Voice (Clash Grotesk Semibold):** Used for medium-weight headings and inactive filter chip labels (`FontFamily.headingSemibold`). Provides weight between Bold and body copy.
- **The Functional Voice (Neue Haas Display Medium):** Used for `title`, `body`, and `labels` (`FontFamily.body`). Provides a clean, geometric balance to the loud headlines. Ensures that even in an eclectic environment, the core information remains legible and accessible.

---

## 4. Elevation & Depth
In this system, depth is achieved through **Tonal Layering** rather than structural lines or heavy drop shadows.

### The Layering Principle
Stack containers to create "natural lift." A `surface-container-lowest` card placed on a `surface-container-low` section creates a sophisticated, soft-touch elevation. 

### Ambient Shadows
If a floating element (like a FAB or Menu) requires a shadow, it must be **Ambient**:
- **Blur:** 40px - 60px
- **Opacity:** 4% - 6%
- **Color:** Use a tinted version of `on-surface` (#383834). Never use pure black (#000) for shadows.

### The "Ghost Border" Fallback
If accessibility requirements demand a container edge, use a **Ghost Border**: the `outline-variant` token at 15% opacity. Never use 100% opaque borders.

---

## 5. Components

### Buttons
- **Primary:** `primary` background with `on-primary` text. Apply the `xl` (3rem) roundedness for a "pill" shape.
- **Secondary:** `secondary_container` background with `on-secondary_container` text.
- **Interaction:** On hover, shift background to the `_dim` variant of the color.

### Metadata Badge Pills (cook time, difficulty, serves)
Solid-coloured pill badges used on recipe cards and the recipe detail page. Each badge type has a fixed background and foreground colour pairing. Font: `FontFamily.heading` (ClashGrotesk-Bold), `fontSize: 12`, uppercase text. Shape: `Radius.full`, `paddingHorizontal: 12`, `paddingVertical: 7`.

| Badge | Background | Icon & Text | Icon |
|-------|-----------|-------------|------|
| Cook / Prep time | `#B8F9D7` | `#226248` | `Ionicons time-outline` / `hourglass-outline` |
| Easy | `#D5FB2A` | `#3A5500` | 1× `MaterialIcons bolt` |
| Medium | `#FBA42A` | `#4C310C` | 2× `MaterialIcons bolt` (second overlaps: `marginLeft: -5`) |
| Hard | `#FB2A2A` | `#FFE2E2` | 3× `MaterialIcons bolt` |
| Serves | `#F9B8F5` | `#4A3849` | `Ionicons people-outline` |

Pantry match badges remain glassmorphism (`BlurView intensity={60}`, white text/icons) as they overlay the recipe card image.

### Chips & Tags
Inspired by the reference image's "Sophisticated" and "Ethical" tags:
- Use high-contrast pairings like `tertiary_container` (Yellow) with `on-tertiary_container`.
- **Styling:** Extra large border-radius (`full`), horizontal padding of `1.5rem`, and `label-md` typography.

### Input Fields
- **Container:** `surface-container-highest` background.
- **Border:** No border. Use a 2px bottom-weighted "active" state in `primary` color when focused.
- **Typography:** Labels should use `label-md` in `on-surface-variant`.

### Cards & Lists
- **Rule:** Absolute prohibition of divider lines. 
- **Separation:** Use vertical white space (32px or 48px) or alternating background colors (`surface-container-low` vs `surface-container-high`).
- **Layout:** Use "Graphic Shapes" – experiment with placing images inside `lg` (2rem) rounded containers that clip the content, creating an editorial mask effect.

---

## 7. Onboarding Screen Pattern

Full-screen first-launch flow. Key layout rules:
- **Background:** `primary` (`#04492B`) forest green fills the entire screen
- **Cream panel:** `#FDFAF4`, top 60% of screen height, `borderBottomLeftRadius: 30`, `borderBottomRightRadius: 30` — static, never slides
- **Illustration images:** bottom-justified within the cream panel, 88% screen width, `contentFit="contain"`. Supply all assets at 1×/2×/3× density
- **Logomark:** SVG centred at the top of the cream panel — static across all slides
- **Skip CTA:** top-right, `#04492B` text (legible against the cream panel)
- **Headline:** `FontFamily.heading`, 36px, white — below the cream panel
- **Body copy:** `FontFamily.body`, 16px, `rgba(255,255,255,0.70)` — below headline
- **CTA button:** `#D5FB2A` lime full-width pill, `Radius.full`, dark green text — pinned to bottom
- **Dot indicators:** `#D5FB2A` active pill (24px wide), `rgba(255,255,255,0.30)` inactive — below CTA button

---

## 8. Do's and Don'ts

### Do:
- **Embrace Asymmetry:** Offset text blocks or let images bleed off one side of the container.
- **Over-scale Typography:** Let headlines be the largest visual element on the screen.
- **Use High-Contrast Color Blocking:** Pair `primary` (Green) and `secondary_container` (Pink) in the same view to create energy.

### Don't:
- **Don't use 1px dividers:** It breaks the "Graphic Editorial" immersion. Use space and color instead.
- **Don't use standard shadows:** If a shadow is visible at first glance, it’s too heavy.
- **Don't crowd the content:** High contrast requires significant "breathing room" (white space) to prevent visual fatigue.
- **Don't use small border radii:** Avoid `none` or `sm` unless for technical micro-elements. Stay within `lg` to `xl` for the signature look.
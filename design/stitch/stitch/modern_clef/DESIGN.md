# Design System Specification: Editorial Resonance

## 1. Overview & Creative North Star
### The Creative North Star: "The Digital Curator"
This design system moves beyond the utility of a standard sheet music reader to become a high-end editorial experience. We are transitioning from a heavy "nocturne" aesthetic to a luminous, "bright-gallery" feel. The goal is to treat every piece of music not just as data, but as a curated artifact.

To break the "template" look, we employ **Intentional Asymmetry**. We avoid rigid, center-aligned grids in favor of left-heavy editorial layouts, overlapping elements (e.g., a score preview bleeding over a container edge), and dramatic shifts in typographic scale. The interface should feel like a premium music journal—spacious, authoritative, and breathable.

---

## 2. Colors & Tonal Surface Theory
Our palette is anchored by `primary` (#00236F) and `surface` (#F8F9FB), creating a high-contrast, professional environment that mimics high-quality bleached paper and deep indigo ink.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders for sectioning or containment. Boundaries must be defined exclusively through background color shifts.
- Use `surface-container-low` (#F3F4F6) to define a sidebar or a secondary content area against the `surface` background.
- This creates a sophisticated, "borderless" UI that feels architectural rather than boxed-in.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—stacked sheets of fine paper.
- **Base Level:** `surface` (#F8F9FB).
- **Secondary Sections:** `surface-container-low` (#F3F4F6).
- **Embedded Cards:** `surface-container-lowest` (#FFFFFF) to provide a subtle "pop" of brightness.

### The "Glass & Signature Texture" Rule
To add visual "soul":
- **Glassmorphism:** Use `surface-container-lowest` at 80% opacity with a `backdrop-blur` of 12px for floating navigation bars or playback controllers.
- **Signature Gradients:** For primary CTAs or Hero backgrounds, use a linear gradient from `primary` (#00236F) to `primary-container` (#1E3A8A) at a 135-degree angle. This adds a subtle depth that flat hex codes cannot achieve.

---

## 3. Typography
We use a pairing of **Plus Jakarta Sans** (Display) and **Inter** (Functional) to balance character with legibility.

| Level | Token | Font | Size | Weight | Intent |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Plus Jakarta Sans | 3.5rem | 700 | Hero headers/Composition titles. |
| **Headline** | `headline-md` | Plus Jakarta Sans | 1.75rem | 600 | Section titles, Album names. |
| **Title** | `title-md` | Inter | 1.125rem | 500 | Card titles, Navigation items. |
| **Body** | `body-lg` | Inter | 1.0rem | 400 | Lyrics, descriptions, long-form text. |
| **Label** | `label-md` | Inter | 0.75rem | 600 | Metadata (Key, Tempo, Instrument). |

**Editorial Note:** Always maintain a high contrast between `display` and `body` sizes to establish a clear narrative hierarchy.

---

## 4. Elevation & Depth
We eschew traditional drop shadows in favor of **Tonal Layering**.

- **The Layering Principle:** Depth is achieved by "stacking" tokens. A `surface-container-lowest` card placed on a `surface-container-low` background creates a natural, soft lift without a single pixel of shadow.
- **Ambient Shadows:** For high-level floating elements (e.g., a "New Composition" modal), use an ultra-diffused shadow: `offset-y: 20px`, `blur: 40px`, `color: rgba(0, 35, 111, 0.06)`. This mimics natural light filtered through a window.
- **The "Ghost Border" Fallback:** If a divider is functionally required, use `outline-variant` (#C5C5D3) at **15% opacity**. Never use a 100% opaque border.

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary-container`), `xl` radius (1.5rem), `on-primary` text. Use for the main action (e.g., "Start Practice").
- **Secondary:** `surface-container-high` background with `primary` text. No border.
- **Tertiary:** Ghost style. `primary` text, background appears as `surface-container-lowest` only on hover.

### Cards & Lists
- **Rule:** Forbid divider lines.
- **Implementation:** Use `spacing-6` (1.5rem) to separate list items. Use a subtle `surface-container-low` background on hover to indicate interactivity.
- **Radius:** All cards must use `xl` (1.5rem / 24px) for a soft, friendly, and contemporary feel.

### Sheet Music Preview (Custom Component)
- **Style:** Place the score on a `surface-container-lowest` card with a `md` (0.75rem) radius.
- **Layering:** Overlap the bottom-right corner with a `primary` action chip (e.g., "Play Audio") to create three-dimensional interest.

### Input Fields
- **Default State:** `surface-container-highest` background, no border.
- **Focus State:** `surface-container-lowest` background with a 1px `primary` ghost-border (20% opacity).

---

## 6. Do’s and Don’ts

### Do
- **Do** use whitespace as a functional tool. If a section feels crowded, increase spacing to `spacing-12` or `spacing-16`.
- **Do** use `on-surface-variant` (#444651) for secondary metadata like "Updated 2 days ago" to maintain hierarchy.
- **Do** ensure all interactive elements have a minimum touch target of 44px, even if the visual "chip" is smaller.

### Don’t
- **Don’t** use black (#000000). Use `on-background` (#191C1E) for all "black" text to keep the palette soft.
- **Don’t** use hard-edged 90-degree corners. Everything from buttons to inputs must adhere to the `rounded-xl` or `rounded-md` scale.
- **Don’t** use "Alert Red" for everything. Use `tertiary` (#4B1C00) for sophisticated warnings and `error` (#BA1A1A) only for critical system failures.
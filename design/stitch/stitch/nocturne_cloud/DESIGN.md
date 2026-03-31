# Design System: The Ethereal Nocturne

## 1. Overview & Creative North Star: "The Digital Manuscript"
This design system is built to honor the tactile elegance of sheet music while embracing the limitless depth of the nocturnal sky. Our Creative North Star, **"The Digital Manuscript,"** moves away from rigid, "boxy" SaaS layouts in favor of an editorial, layered experience. 

To achieve a premium, custom feel, we prioritize **intentional asymmetry** and **tonal depth**. Elements should feel like they are floating in a dark, atmospheric space—mimicking a musician’s focus under a single spotlight. We reject the "template" look by using high-contrast typography scales and overlapping elements that break the traditional grid, creating a sense of rhythm and movement across the screen.

---

## 2. Colors: The Midnight Palette
The color strategy utilizes deep, ink-like blues and purples to create a "dark mode" that feels expensive rather than just "black."

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts. Use `surface-container-low` sections against a `surface` background to define areas. If a container needs to stand out, use a tonal shift, not a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of frosted glass.
*   **Base:** `surface` (#131313) for the primary background.
*   **Level 1:** `surface_container_low` (#1c1b1b) for secondary content areas.
*   **Level 2:** `surface_container_high` (#2a2a2a) for interactive cards.
*   **Level 3:** `surface_container_highest` (#353534) for floating menus or active states.

### The "Glass & Gradient" Rule
To evoke the "cloud" motif, use **Glassmorphism** for navigation bars and floating players. Apply `surface_variant` at 60% opacity with a `24px` backdrop blur. Use a subtle linear gradient (from `primary` #bac3ff to `primary_container` #14267a) for main CTAs to provide a "soulful" glow that flat colors cannot replicate.

---

## 3. Typography: Rhythmic Contrast
We pair a sophisticated serif for emotional resonance with a high-performance sans-serif for functional clarity.

*   **Display & Headlines (Noto Serif):** These are our "Sheet Music" elements. Use `display-lg` and `headline-md` for landing moments and section headers. The serif conveys authority and the timeless nature of music.
*   **UI & Body (Manrope):** Use `body-lg` for readability. Manrope’s geometric nature ensures that even in dense musical metadata, the UI remains "clean" and "modern."
*   **Labels:** Use `label-md` in all-caps with `0.05rem` letter-spacing for a technical, precise feel that balances the flowy serif headings.

---

## 4. Elevation & Depth
We convey hierarchy through **Tonal Layering** rather than structural lines.

*   **The Layering Principle:** Place a `surface_container_lowest` (#0e0e0e) card on a `surface_container_low` (#1c1b1b) section to create a soft, natural "recessed" look.
*   **Ambient Shadows:** For "floating" elements like sheet music previews, use extra-diffused shadows: `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);`. The shadow should feel like a soft glow of darkness rather than a hard edge.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline_variant` (#454652) at **15% opacity**. Never use 100% opaque borders.
*   **Musical Gold:** Use the `tertiary` (#e9c349) accent sparingly—only for high-value interactions or "Pro" features—to mimic the brass of an instrument or the gold leaf on vintage scores.

---

## 5. Components

### Cards (Sheet Music & Albums)
*   **Style:** No borders. Use `surface_container_high`. 
*   **Interaction:** On hover, the card should lift slightly and the `outline` should subtly glow using `primary_fixed_dim`.
*   **Content:** Forbid divider lines. Separate title from composer using `spacing-3` (1rem) of vertical white space.

### Buttons
*   **Primary:** A gradient from `primary` to `primary_container`. Roundedness `full`. This represents the "Cloud" aspect—soft but prominent.
*   **Secondary:** Ghost style. No background, `outline_variant` ghost border (20% opacity). Typography in `on_surface`.
*   **Tertiary (The "Notation" Button):** High-contrast `on_surface` text with no container. Used for low-priority actions like "Cancel" or "View More."

### Inputs & Search
*   **Field:** Use `surface_container_lowest`. The focus state should not be a thick border, but a subtle `primary` outer glow and the label shifting to `tertiary` (Gold).

### Signature Component: The "Score Scrubber"
A custom progress bar for music playback. The background track is `surface_variant`, and the progress fill is a gradient of `primary` to `secondary`. The scrubber head should be a `tertiary` gold dot, glowing when active.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical margins. A headline can be offset to the left while the body text sits centered to create a "composed" look.
*   **Do** use `spacing-16` (5.5rem) and `spacing-20` (7rem) to let high-level sections breathe. Music needs silence; UI needs white space.
*   **Do** use `backdrop-filter: blur(12px)` on all modal overlays to maintain the ethereal "cloud" atmosphere.

### Don't
*   **Don't** use pure black (#000000). Always use `surface` (#131313) to keep the depth "soft."
*   **Don't** use dividers or horizontal rules. If you feel the need to separate content, use a background color shift to `surface_container_low`.
*   **Don't** use standard "Error Red" for everything. Use `error_container` (#93000a) with a subtle `error` (#ffb4ab) text to keep the palette sophisticated and muted.
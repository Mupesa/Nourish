---
name: Vibrant Hearth
colors:
  surface: '#fbf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae8e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#424841'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0f0'
  outline: '#737970'
  outline-variant: '#c2c8be'
  surface-tint: '#456646'
  primary: '#436444'
  on-primary: '#ffffff'
  primary-container: '#5b7d5b'
  on-primary-container: '#f7fff2'
  inverse-primary: '#abd0a9'
  secondary: '#94492c'
  on-secondary: '#ffffff'
  secondary-container: '#fe9d7a'
  on-secondary-container: '#773318'
  tertiary: '#715c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c7a938'
  on-tertiary-container: '#4d3e00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c6edc4'
  primary-fixed-dim: '#abd0a9'
  on-primary-fixed: '#012108'
  on-primary-fixed-variant: '#2e4e30'
  secondary-fixed: '#ffdbcf'
  secondary-fixed-dim: '#ffb59b'
  on-secondary-fixed: '#380d00'
  on-secondary-fixed-variant: '#763217'
  tertiary-fixed: '#ffe17a'
  tertiary-fixed-dim: '#e4c451'
  on-tertiary-fixed: '#231b00'
  on-tertiary-fixed-variant: '#554500'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  container-margin: 20px
  gutter: 16px
---

## Brand & Style
The design system is centered on a "Modern Organic" aesthetic, balancing the precision of health tracking with the sensory warmth of home cooking. It targets health-conscious individuals who view food as nourishment rather than just data. 

The visual style utilizes **Minimalism** with a **Tactile** edge. Heavy whitespace ensures the interface feels breathable and easy to navigate during active cooking, while vibrant, appetizing accents prevent the experience from feeling clinical. The emotional response should be one of motivation, freshness, and culinary inspiration.

## Colors
The palette is rooted in nature and the kitchen. 
- **Primary (Sage Green):** Used for growth, health, and primary actions like "Save Recipe" or "Start Log."
- **Secondary (Terracotta):** Applied to interactive elements related to eating and appetite, such as "Add Meal."
- **Accents:** Lemon Yellow is reserved for highlights and nutritional achievements, while Tomato Red is used strictly for alerts or "at limit" calorie warnings.
- **Backgrounds:** A Warm White (`#FDFCFB`) serves as the canvas, with a soft stone gray (`#F7F5F2`) used for secondary surface containers to create subtle depth without harsh contrast.

## Typography
The typographic hierarchy creates an editorial feel. **Playfair Display** is used for headings to evoke the quality of a premium cookbook; it should be set with tighter letter-spacing in larger sizes. **Inter** handles all functional data and body copy, ensuring maximum legibility for ingredients and calorie counts. 

Use `label-md` for button text and `label-sm` (all caps) for category tags or "over-line" text above headings. Deep Charcoal (`#333333`) is the exclusive color for text to ensure high contrast against warm backgrounds.

## Layout & Spacing
This design system utilizes a **fluid grid** for mobile devices with a standard 4-column layout and a **fixed max-width** for tablet/desktop viewports. 

A 4px baseline grid governs all vertical rhythm. Standard page margins are set to 20px on mobile to provide more "breathing room" than the typical 16px. Elements within cards should use the `sm` (16px) spacing unit for internal padding, while sections on a page are separated by `lg` (32px) or `xl` (48px) to maintain the minimalist, airy feel.

## Elevation & Depth
Depth is communicated through **Ambient Shadows** and **Tonal Layers**. 
- **Level 0 (Background):** Warm White.
- **Level 1 (Secondary Surface):** Soft Gray shapes for grouping items without shadows.
- **Level 2 (Cards):** White surfaces with a very soft, diffused shadow (Blur: 20px, Y: 4px, Opacity: 6% of Deep Charcoal).
- **Level 3 (Modals/Floating Actions):** Higher elevation with a more pronounced shadow (Blur: 30px, Y: 10px, Opacity: 10% of Deep Charcoal) to indicate immediate priority.

Avoid heavy borders; use subtle shifts in surface color to define boundaries.

## Shapes
The shape language is consistently **Rounded**, reflecting the organic nature of food. 
- **Buttons and Inputs:** Use a 0.5rem (8px) radius for a modern, friendly feel.
- **Cards:** Use `rounded-lg` (16px) to create soft framing for food photography.
- **Progress Indicators:** Use perfect circles for nutritional trackers (Protein/Carbs/Fats) to suggest completeness and balance.
- **Images:** All food photography should feature `rounded-lg` corners unless they are full-bleed headers.

## Components
- **Buttons:** Primary buttons use Sage Green with white text. Secondary buttons use an outline of Terracotta with Terracotta text. Both should have 16px vertical padding.
- **Calorie Badges:** Small, high-contrast capsules using Lemon Yellow with Charcoal text. These should be placed in the top-right corner of recipe cards.
- **Nutritional Progress:** Circular rings with a 4px stroke width. Use Sage for "under limit" and Tomato Red for "over limit."
- **Input Fields:** Soft Gray (`surface_hex`) background with no border, transitioning to a 2px Sage Green bottom-border on focus.
- **Cards:** White background, 16px padding, and 16px corner radius. Image should take up the top half of the card with a subtle gradient overlay at the bottom if text is placed on top.
- **Lists:** Ingredient lists should use custom Sage Green checkboxes (circular) rather than standard square boxes to maintain the friendly aesthetic.
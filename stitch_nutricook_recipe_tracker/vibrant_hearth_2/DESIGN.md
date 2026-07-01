---
name: Vibrant Hearth
colors:
  surface: '#f5fbf2'
  surface-dim: '#d6dcd3'
  surface-bright: '#f5fbf2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f5ec'
  surface-container: '#eaf0e6'
  surface-container-high: '#e4eae1'
  surface-container-highest: '#dee4db'
  on-surface: '#171d18'
  on-surface-variant: '#424841'
  inverse-surface: '#2c322c'
  inverse-on-surface: '#edf2e9'
  outline: '#737970'
  outline-variant: '#c2c8be'
  surface-tint: '#456646'
  primary: '#436444'
  on-primary: '#ffffff'
  primary-container: '#5b7d5b'
  on-primary-container: '#f7fff2'
  inverse-primary: '#abd0a9'
  secondary: '#9f402d'
  on-secondary: '#ffffff'
  secondary-container: '#fd876f'
  on-secondary-container: '#732010'
  tertiary: '#5d5c57'
  on-tertiary: '#ffffff'
  tertiary-container: '#76756f'
  on-tertiary-container: '#fdffdd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c6edc4'
  primary-fixed-dim: '#abd0a9'
  on-primary-fixed: '#012108'
  on-primary-fixed-variant: '#2e4e30'
  secondary-fixed: '#ffdad3'
  secondary-fixed-dim: '#ffb4a5'
  on-secondary-fixed: '#3e0500'
  on-secondary-fixed-variant: '#802918'
  tertiary-fixed: '#e5e2db'
  tertiary-fixed-dim: '#c9c6c0'
  on-tertiary-fixed: '#1c1c18'
  on-tertiary-fixed-variant: '#474742'
  background: '#f5fbf2'
  on-background: '#171d18'
  surface-variant: '#dee4db'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  button-text:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 640px
  gutter: 24px
---

## Brand & Style
The design system is built on the philosophy of "Nurtured Growth." It aims to evoke a sense of calm productivity and welcoming warmth, specifically tailored for an onboarding experience that feels like a guided conversation rather than a technical setup. 

The aesthetic is a blend of **Minimalism** and **Tactile** design. It prioritizes heavy whitespace to reduce cognitive load during data entry, while using soft, organic textures and warm tones to maintain an approachable, non-formal atmosphere. The emotional response should be one of encouragement and clarity, ensuring the user feels supported at every step of their journey.

## Colors
This design system utilizes a palette inspired by nature and the home.
- **Primary (Sage Green):** Used for progress indicators, primary actions, and success states. It represents growth and stability.
- **Secondary (Terracotta):** Used sparingly for accent elements, celebratory moments, and interactive highlights to provide warmth.
- **Tertiary (Cream/Alabaster):** The primary surface color. It is softer than pure white, reducing eye strain and feeling more "organic."
- **Neutral (Charcoal Green):** A very dark, desaturated green used for text to maintain high legibility while appearing softer than pure black.

## Typography
The typography strategy relies on a high-contrast pairing. **Playfair Display** provides a literary, authoritative, yet warm presence for headlines, making onboarding questions feel like personal inquiries. **Plus Jakarta Sans** is used for all functional text; its soft, rounded terminals complement the friendly brand voice and ensure high readability for instructions and labels.

For mobile layouts, headline sizes are aggressively stepped down to ensure that "above the fold" real estate is preserved for input fields and navigation buttons.

## Layout & Spacing
The onboarding experience follows a **fixed-width, centered column** approach. By capping the content width at 640px, we ensure focus and prevent eye fatigue on large displays. 

A 12-column grid is used internally within the container for form layouts, but the primary rhythm is vertical. We use a generous 80px (xl) spacer between the progress indicator and the main headline to create a sense of breathing room. On mobile, margins are reduced to 24px (gutter) to maximize touch targets for inputs.

## Elevation & Depth
This design system avoids harsh drop shadows. Instead, it uses **Tonal Layers** and **Soft Ambient Occlusion**.
- **Base Layer:** The tertiary cream color (#F4F1EA) serves as the page background.
- **Card Layer:** Interactive elements and form containers sit on pure white (#FFFFFF) surfaces with a subtle 1px border in a lightened Sage tint.
- **Elevation:** High-priority buttons use a soft, tinted shadow (Sage #6B8E6B at 15% opacity) to suggest clickability without breaking the organic feel.

## Shapes
The shape language is consistently **Rounded**. The 0.5rem (8px) base radius is applied to input fields and cards to maintain the friendly aesthetic. For buttons and progress chips, we use the `rounded-xl` (1.5rem) setting to create a softer, more inviting interface that encourages interaction.

## Components
- **Primary Buttons:** Solid Sage Green (#6B8E6B) with white text. High-contrast and accessible. These use large vertical padding (16px) to ensure they are easy to tap on all devices.
- **Secondary/Back Buttons:** Ghost style with a Sage Green border or simple underlined text using the Label-Caps style.
- **Progress Indicator:** A horizontal track of "pills." The active step is a solid Sage pill, completed steps are Sage outlines, and upcoming steps are soft Alabaster.
- **Input Fields:** Generous height (56px) with a subtle cream background that shifts to white on focus. The focus state uses a 2px Sage Green border.
- **Choice Chips:** Large, selectable cards used for "Which best describes you?" questions. On selection, the card border thickens and the background shifts to a very pale Sage tint.
- **Success Toasts:** Small Terracotta-colored icons paired with Sage text to celebrate the completion of an onboarding section.
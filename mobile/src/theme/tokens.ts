/**
 * Design tokens — the "Vibrant Hearth" system from DESIGN.md, translated to a
 * typed object for React Native styles. Single source of truth for colour,
 * spacing, radius, and typography so screens stay visually consistent.
 */

export const colors = {
  // Surfaces
  background: "#f5fbf2",
  surface: "#f5fbf2",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f0f5ec",
  surfaceContainer: "#eaf0e6",
  surfaceContainerHigh: "#e4eae1",
  surfaceContainerHighest: "#dee4db",
  surfaceVariant: "#dee4db",
  surfaceDim: "#d6dcd3",

  // Text / on-colours
  onBackground: "#171d18",
  onSurface: "#171d18",
  onSurfaceVariant: "#424841",
  outline: "#737970",
  outlineVariant: "#c2c8be",

  // Primary (Sage green)
  primary: "#436444",
  onPrimary: "#ffffff",
  primaryContainer: "#5b7d5b",
  onPrimaryContainer: "#f7fff2",
  primaryFixed: "#c6edc4",
  primaryFixedDim: "#abd0a9",
  onPrimaryFixed: "#012108",
  onPrimaryFixedVariant: "#2e4e30",

  // Secondary (Terracotta)
  secondary: "#9f402d",
  onSecondary: "#ffffff",
  secondaryContainer: "#fd876f",
  onSecondaryContainer: "#732010",

  // Tertiary
  tertiary: "#5d5c57",
  onTertiary: "#ffffff",
  tertiaryFixed: "#e5e2db",

  // Status
  error: "#ba1a1a",
  onError: "#ffffff",
  errorContainer: "#ffdad6",
  onErrorContainer: "#93000a",
} as const;

/** Base-8 spacing scale (matching DESIGN.md). */
export const spacing = {
  xs: 4,
  base: 8,
  sm: 12,
  md: 24,
  gutter: 24,
  lg: 48,
  xl: 80,
} as const;

export const radius = {
  sm: 4,
  default: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

/** Font family keys — loaded in App via @expo-google-fonts. */
export const fonts = {
  display: "PlayfairDisplay_700Bold",
  headline: "PlayfairDisplay_600SemiBold",
  body: "PlusJakartaSans_400Regular",
  bodyMedium: "PlusJakartaSans_500Medium",
  bodySemiBold: "PlusJakartaSans_600SemiBold",
  bodyBold: "PlusJakartaSans_700Bold",
} as const;

/** Type scale (size + lineHeight) from DESIGN.md. */
export const typography = {
  displayLg: { fontSize: 32, lineHeight: 40 }, // mobile display
  headlineMd: { fontSize: 24, lineHeight: 32 },
  bodyLg: { fontSize: 18, lineHeight: 28 },
  bodyMd: { fontSize: 16, lineHeight: 24 },
  button: { fontSize: 16, lineHeight: 20 },
  labelCaps: { fontSize: 12, lineHeight: 16, letterSpacing: 0.6 },
} as const;

export const maxContentWidth = 640;

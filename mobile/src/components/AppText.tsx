/**
 * Themed Text. Picks the right font family + size for a typographic variant so
 * callers never hand-wire fonts. Falls back gracefully before fonts load.
 */
import React from "react";
import { StyleSheet, Text, TextProps, TextStyle } from "react-native";
import { colors, fonts, typography } from "../theme/tokens";

type Variant =
  | "display"
  | "headline"
  | "bodyLg"
  | "body"
  | "bodySemiBold"
  | "button"
  | "label";

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  center?: boolean;
}

const variantStyle: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.display, ...typography.displayLg },
  headline: { fontFamily: fonts.headline, ...typography.headlineMd },
  bodyLg: { fontFamily: fonts.body, ...typography.bodyLg },
  body: { fontFamily: fonts.body, ...typography.bodyMd },
  bodySemiBold: { fontFamily: fonts.bodySemiBold, ...typography.bodyMd },
  button: { fontFamily: fonts.bodySemiBold, ...typography.button },
  label: {
    fontFamily: fonts.bodyBold,
    ...typography.labelCaps,
    textTransform: "uppercase",
  },
};

export function AppText({
  variant = "body",
  color = colors.onSurface,
  center,
  style,
  ...rest
}: Props) {
  return (
    <Text
      style={[
        variantStyle[variant],
        { color },
        center && styles.center,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  center: { textAlign: "center" },
});

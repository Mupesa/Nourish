/** Round avatar — shows a photo, or the first letter of a name as a fallback. */
import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { colors } from "../theme/tokens";
import { AppText } from "./AppText";

export function Avatar({
  uri,
  label,
  size = 44,
}: {
  uri: string | null;
  label: string;
  size?: number;
}) {
  const dim = { width: size, height: size, borderRadius: size / 2 };
  if (uri) return <Image source={{ uri }} style={dim} />;
  const letter = label.replace("@", "").charAt(0).toUpperCase() || "?";
  return (
    <View style={[styles.fallback, dim]}>
      <AppText variant="bodySemiBold" color={colors.onPrimary}>
        {letter}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});

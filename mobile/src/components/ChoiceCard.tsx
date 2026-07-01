/**
 * Selectable choice card used across onboarding (goal, activity, dietary).
 * Thickens its border and tints when selected, per DESIGN.md.
 */
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { AppText } from "./AppText";

interface Props {
  title: string;
  description?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  selected: boolean;
  onPress: () => void;
  /** "row" for list-style (activity), "tile" for grid (dietary). */
  layout?: "row" | "tile";
  style?: ViewStyle;
}

export function ChoiceCard({
  title,
  description,
  icon,
  selected,
  onPress,
  layout = "row",
  style,
}: Props) {
  const isTile = layout === "tile";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isTile ? styles.tile : styles.row,
        selected && styles.selected,
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon && (
        <View style={[styles.iconWrap, isTile && styles.iconWrapTile]}>
          <MaterialIcons
            name={icon}
            size={isTile ? 32 : 24}
            color={colors.primary}
          />
        </View>
      )}
      <View style={isTile ? styles.tileText : styles.rowText}>
        <AppText variant="button" center={isTile}>
          {title}
        </AppText>
        {description && (
          <AppText variant="body" color={colors.onSurfaceVariant}>
            {description}
          </AppText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  tile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    gap: spacing.base,
    minHeight: 120,
  },
  selected: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.onPrimaryContainer,
  },
  pressed: { opacity: 0.9 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapTile: { backgroundColor: "transparent", width: 40, height: 40 },
  rowText: { flex: 1, gap: 2 },
  tileText: { alignItems: "center" },
});

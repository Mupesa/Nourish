/**
 * Recipe card — image with kcal badge, title, and time. Used in horizontal
 * rails (featured) and grids (discover). Falls back to an icon when imageless.
 */
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { AppText } from "./AppText";

interface Props {
  title: string;
  imageUrl: string | null;
  kcal: number;
  cookMins?: number;
  reason?: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function RecipeCard({
  title,
  imageUrl,
  kcal,
  cookMins,
  reason,
  onPress,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
    >
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <MaterialIcons name="restaurant" size={36} color={colors.outline} />
          </View>
        )}
        <View style={styles.badge}>
          <AppText variant="label" color={colors.onSurface}>
            {kcal} kcal
          </AppText>
        </View>
      </View>
      <View style={styles.body}>
        <AppText variant="bodySemiBold" numberOfLines={1}>
          {title}
        </AppText>
        {cookMins != null && cookMins > 0 && (
          <View style={styles.metaRow}>
            <MaterialIcons name="schedule" size={14} color={colors.outline} />
            <AppText variant="label" color={colors.outline}>
              {cookMins} min
            </AppText>
          </View>
        )}
        {reason && (
          <AppText
            variant="label"
            color={colors.primary}
            numberOfLines={1}
            style={styles.reason}
          >
            {reason}
          </AppText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
  },
  pressed: { opacity: 0.9 },
  imageWrap: { position: "relative" },
  image: { width: "100%", height: 140 },
  placeholder: {
    backgroundColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: spacing.base,
    right: spacing.base,
    backgroundColor: colors.tertiaryFixed,
    borderRadius: radius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: 2,
  },
  body: { padding: spacing.sm, gap: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  reason: { textTransform: "none" },
});

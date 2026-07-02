/**
 * Recipe card - image-forward card used in home rails and discover grids.
 * Falls back to an icon when imageless.
 */
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { RecipeDifficulty, RecipeMealType } from "../types/domain";
import { AppText } from "./AppText";

interface Props {
  title: string;
  imageUrl: string | null;
  kcal: number;
  cookMins?: number;
  difficulty?: RecipeDifficulty;
  mealTypes?: RecipeMealType[];
  tag?: string;
  reason?: string;
  variant?: "compact" | "feature";
  showSaveAction?: boolean;
  onPress: () => void;
  onSavePress?: () => void;
  style?: ViewStyle;
}

export function RecipeCard({
  title,
  imageUrl,
  kcal,
  cookMins,
  difficulty,
  mealTypes,
  tag,
  reason,
  variant = "compact",
  showSaveAction = false,
  onPress,
  onSavePress,
  style,
}: Props) {
  const feature = variant === "feature";
  const mealLabel = mealTypes?.[0] ? formatMealType(mealTypes[0]) : null;
  const confidenceLabel = difficulty ? formatDifficulty(difficulty) : null;
  const usefulTag = tag ?? confidenceLabel;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        feature && styles.featureCard,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={[styles.image, feature && styles.featureImage]}
          />
        ) : (
          <View
            style={[
              styles.image,
              feature && styles.featureImage,
              styles.placeholder,
            ]}
          >
            <MaterialIcons name="restaurant" size={36} color={colors.outline} />
          </View>
        )}

        {usefulTag && (
          <View style={styles.tagBadge}>
            <AppText variant="label" color={colors.onPrimaryContainer}>
              {usefulTag}
            </AppText>
          </View>
        )}

        {showSaveAction && (
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onSavePress?.();
            }}
            accessibilityRole="button"
            accessibilityLabel={`Save ${title}`}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.saveButtonPressed,
            ]}
          >
            <MaterialIcons
              name="bookmark-border"
              size={20}
              color={colors.onSurface}
            />
          </Pressable>
        )}
      </View>

      <View style={styles.body}>
        <AppText
          variant={feature ? "headline" : "bodySemiBold"}
          numberOfLines={feature ? 2 : 1}
          style={feature && styles.featureTitle}
        >
          {title}
        </AppText>

        <View style={styles.metaRow}>
          {cookMins != null && cookMins > 0 && (
            <View style={styles.metaItem}>
              <MaterialIcons name="schedule" size={14} color={colors.outline} />
              <AppText variant="label" color={colors.outline}>
                {cookMins} min
              </AppText>
            </View>
          )}

          {mealLabel && (
            <View style={styles.metaItem}>
              <MaterialIcons
                name="local-dining"
                size={14}
                color={colors.outline}
              />
              <AppText variant="label" color={colors.outline}>
                {mealLabel}
              </AppText>
            </View>
          )}

          <View style={styles.kcalPill}>
            <AppText variant="label" color={colors.onSurfaceVariant}>
              {kcal} kcal
            </AppText>
          </View>
        </View>

        {reason && (
          <AppText
            variant={feature ? "body" : "label"}
            color={colors.primary}
            numberOfLines={feature ? 2 : 1}
            style={styles.reason}
          >
            {reason}
          </AppText>
        )}
      </View>
    </Pressable>
  );
}

function formatMealType(mealType: RecipeMealType): string {
  return mealType === "snack"
    ? "Snack"
    : mealType.charAt(0).toUpperCase() + mealType.slice(1);
}

function formatDifficulty(difficulty: RecipeDifficulty): string {
  if (difficulty === "easy") return "Easy win";
  if (difficulty === "medium") return "Steady cook";
  return "Weekend cook";
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.default,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  featureCard: {
    backgroundColor: colors.surfaceContainerLowest,
  },
  pressed: { opacity: 0.9 },
  imageWrap: { position: "relative" },
  image: { width: "100%", height: 140 },
  featureImage: { height: 230 },
  placeholder: {
    backgroundColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  tagBadge: {
    position: "absolute",
    top: spacing.base,
    left: spacing.base,
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: 2,
  },
  saveButton: {
    position: "absolute",
    top: spacing.base,
    right: spacing.base,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonPressed: { opacity: 0.82 },
  body: { padding: spacing.sm, gap: spacing.xs },
  featureTitle: { fontSize: 22, lineHeight: 28 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  kcalPill: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: 2,
  },
  reason: { textTransform: "none" },
});

/**
 * Inline (non-full-screen) error message with a retry action, for lists/rails
 * embedded within an otherwise-loaded screen (Home, Discover, ...) where a
 * full-screen ErrorScreen would be too heavy-handed.
 */
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { AppText } from "./AppText";

interface Props {
  message: string;
  onRetry: () => void;
}

export function InlineError({ message, onRetry }: Props) {
  return (
    <View style={styles.root}>
      <AppText variant="body" color={colors.error} center>
        {message}
      </AppText>
      <Pressable style={styles.retry} onPress={onRetry}>
        <AppText variant="button" color={colors.primary}>
          Retry
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: "center", gap: spacing.sm, marginTop: 24 },
  retry: {
    alignItems: "center",
    borderColor: colors.primary,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});

/**
 * Full-screen error state with a retry action. Use this instead of letting a
 * failed fetch/load silently hang on a spinner or fall through to the wrong
 * screen (e.g. profile fetch failing must not look like "not onboarded yet").
 */
import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme/tokens";
import { AppText } from "./AppText";
import { Button } from "./Button";

interface Props {
  title?: string;
  message: string;
  onRetry: () => void;
  retryLabel?: string;
  /** Optional escape hatch for screens reached via navigation (e.g. "Go back"). */
  onSecondaryAction?: () => void;
  secondaryLabel?: string;
}

export function ErrorScreen({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
  onSecondaryAction,
  secondaryLabel = "Go back",
}: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.root}>
        <AppText variant="headline" color={colors.onSurface} center>
          {title}
        </AppText>
        <AppText
          variant="body"
          color={colors.onSurfaceVariant}
          center
          style={styles.message}
        >
          {message}
        </AppText>
        <Button label={retryLabel} onPress={onRetry} style={styles.button} />
        {onSecondaryAction && (
          <Button
            label={secondaryLabel}
            variant="ghost"
            onPress={onSecondaryAction}
            style={styles.button}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.gutter,
    gap: spacing.sm,
  },
  message: { marginBottom: spacing.md },
  button: { alignSelf: "stretch" },
});

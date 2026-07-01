/**
 * Onboarding progress indicator — a row of pills. Completed steps are filled,
 * the current step is filled+highlighted, upcoming steps are faint.
 */
import React from "react";
import { StyleSheet, View } from "react-native";
import { colors, radius } from "../theme/tokens";

export function ProgressPills({
  total,
  current,
}: {
  total: number;
  current: number; // 0-based index of the active step
}) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.pill,
            i < current && styles.completed,
            i === current && styles.active,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, width: "100%" },
  pill: {
    flex: 1,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerHighest,
  },
  completed: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  active: { backgroundColor: colors.primary },
});

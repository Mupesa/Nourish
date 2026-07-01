/**
 * Interactive cook mode (FR-3): keeps the screen awake and walks through steps
 * one at a time.
 */
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useKeepAwake } from "expo-keep-awake";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { colors, radius, spacing } from "../theme/tokens";
import { MainStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<MainStackParamList, "CookMode">;

export function CookModeScreen({ route, navigation }: Props) {
  useKeepAwake(); // screen stays on while cooking
  const { title, steps } = route.params;
  const [i, setI] = useState(0);

  const last = i >= steps.length - 1;
  const step = steps[i];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <AppText variant="label" color={colors.outline}>
          {title}
        </AppText>
        <AppText variant="label" color={colors.primary}>
          Step {i + 1} of {steps.length}
        </AppText>
      </View>

      <View style={styles.body}>
        <View style={styles.num}>
          <AppText variant="display" color={colors.onPrimaryFixed}>
            {i + 1}
          </AppText>
        </View>
        <AppText variant="headline" center>
          {step?.title ?? "All done!"}
        </AppText>
        <AppText variant="bodyLg" color={colors.onSurfaceVariant} center>
          {step?.body ?? ""}
        </AppText>
      </View>

      <View style={styles.footer}>
        {i > 0 && (
          <Button
            label="Back"
            variant="secondary"
            onPress={() => setI((n) => n - 1)}
            style={{ flex: 1 }}
          />
        )}
        <Button
          label={last ? "Finish" : "Next"}
          onPress={() => (last ? navigation.goBack() : setI((n) => n + 1))}
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.gutter,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  num: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: { flexDirection: "row", gap: spacing.sm, padding: spacing.gutter },
});

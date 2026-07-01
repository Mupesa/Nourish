/**
 * Shared chrome for onboarding steps: brand header, progress pills, scrollable
 * content, and a sticky bottom Back/Next bar — mirroring the prototypes.
 */
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, maxContentWidth, spacing } from "../theme/tokens";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { ProgressPills } from "./ProgressPills";

interface Props {
  step: number; // 0-based
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
}

export function OnboardingLayout({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = "Next",
  nextDisabled,
  nextLoading,
}: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          disabled={!onBack}
          hitSlop={12}
          style={styles.backBtn}
        >
          {onBack && (
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          )}
        </Pressable>
        <AppText variant="display" color={colors.primary}>
          Nourish
        </AppText>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <ProgressPills total={totalSteps} current={step} />
        <View style={styles.titleBlock}>
          <AppText variant="headline" center>
            {title}
          </AppText>
          {subtitle && (
            <AppText variant="body" color={colors.onSurfaceVariant} center>
              {subtitle}
            </AppText>
          )}
        </View>
        {children}
      </ScrollView>

      {onNext && (
        <View style={styles.footer}>
          <Button
            label={nextLabel}
            onPress={onNext}
            disabled={nextDisabled}
            loading={nextLoading}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.gutter,
    height: 56,
  },
  backBtn: { width: 32, height: 32, justifyContent: "center" },
  content: {
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    width: "100%",
    maxWidth: maxContentWidth,
    alignSelf: "center",
  },
  titleBlock: { gap: spacing.base, marginVertical: spacing.md },
  footer: {
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.sm,
    paddingBottom: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
});

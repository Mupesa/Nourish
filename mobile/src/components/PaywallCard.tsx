/**
 * Premium upsell surface, used wherever a free user hits a gated feature
 * (Meal Planner tab, the recipe-view cap). The "Upgrade" CTA is a placeholder
 * until the RevenueCat purchase flow lands in a later Phase 4 stage — for now
 * it explains the benefit and (in testing) premium is granted via the admin
 * endpoint.
 */
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Alert, StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { AppText } from "./AppText";
import { Button } from "./Button";

interface Props {
  title: string;
  message: string;
  /** Bullet benefits to list (optional). */
  benefits?: string[];
  /** Override the CTA action; defaults to a "coming soon" notice. */
  onUpgrade?: () => void;
}

const DEFAULT_BENEFITS = [
  "Unlimited recipe library",
  "Weekly meal planner",
  "Ad-free experience",
];

export function PaywallCard({ title, message, benefits, onUpgrade }: Props) {
  const items = benefits ?? DEFAULT_BENEFITS;
  const onPress =
    onUpgrade ??
    (() =>
      Alert.alert(
        "Coming soon",
        "In-app purchases arrive in the next update. Hang tight!",
      ));

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <MaterialIcons name="workspace-premium" size={40} color={colors.primary} />
      </View>
      <AppText variant="headline" center>
        {title}
      </AppText>
      <AppText variant="body" color={colors.onSurfaceVariant} center>
        {message}
      </AppText>

      <View style={styles.benefits}>
        {items.map((b) => (
          <View key={b} style={styles.benefitRow}>
            <MaterialIcons name="check-circle" size={20} color={colors.primary} />
            <AppText variant="body">{b}</AppText>
          </View>
        ))}
      </View>

      <Button label="Upgrade to Premium" onPress={onPress} style={styles.cta} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: "center",
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  benefits: {
    alignSelf: "stretch",
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  cta: { alignSelf: "stretch", marginTop: spacing.xs },
});

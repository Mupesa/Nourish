/**
 * Landing screen shown when there is no active session.
 * New users tap "Get started" (anonymous → onboarding).
 * Returning users tap "Sign in" to reclaim their account.
 */
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../AuthContext";
import { AppText } from "../../components/AppText";
import { Button } from "../../components/Button";
import { colors, spacing } from "../../theme/tokens";
import { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "AuthWelcome">;

export function AuthWelcomeScreen({ navigation }: Props) {
  const { continueAsGuest } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetStarted = async () => {
    setLoading(true);
    setError(null);
    try {
      await continueAsGuest();
      // onAuthStateChanged clears needsAuthDecision → RootNavigator switches to Onboarding
    } catch {
      setError("Couldn't get started. Check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.root}>

        {/* Brand */}
        <View style={styles.brandSection}>
          <AppText variant="display" color={colors.primary} center>
            Nourish
          </AppText>
          <View style={styles.accent} />
          <AppText variant="bodyLg" color={colors.onSurfaceVariant} center style={styles.tagline}>
            Your personal nutrition{"\n"}companion
          </AppText>
        </View>

        {/* Illustration */}
        <View style={styles.illustrationSection}>
          <View style={styles.plateOuter}>
            <View style={styles.plateInner}>
              {/* Abstract food items */}
              <View style={[styles.foodDot, { backgroundColor: colors.secondary, width: 48, height: 48, top: 24, left: 30 }]} />
              <View style={[styles.foodDot, { backgroundColor: colors.primaryFixed, width: 36, height: 36, top: 50, right: 28, borderRadius: 8 }]} />
              <View style={[styles.foodDot, { backgroundColor: colors.primaryFixedDim, width: 28, height: 28, bottom: 30, left: 44 }]} />
              <View style={[styles.foodDot, { backgroundColor: colors.secondaryContainer, width: 22, height: 22, bottom: 36, right: 40 }]} />
              <View style={[styles.foodDot, { backgroundColor: colors.tertiaryFixed, width: 18, height: 18, top: 36, right: 56 }]} />
            </View>
          </View>

          {/* Floating stats cards */}
          <View style={[styles.statCard, styles.statLeft]}>
            <AppText variant="bodySemiBold" color={colors.primary}>2,100</AppText>
            <AppText variant="label" color={colors.onSurfaceVariant}>kcal / day</AppText>
          </View>
          <View style={[styles.statCard, styles.statRight]}>
            <AppText variant="bodySemiBold" color={colors.secondary}>🥗 Recipes</AppText>
            <AppText variant="label" color={colors.onSurfaceVariant}>Personalised</AppText>
          </View>
        </View>

        {/* CTAs */}
        <View style={styles.ctaSection}>
          <AppText variant="body" color={colors.onSurfaceVariant} center style={styles.ctaHint}>
            Track meals, hit your goals, and build healthy habits.
          </AppText>
          <Button
            label="Get started"
            onPress={handleGetStarted}
            loading={loading}
          />
          <Button
            label="I have an account — Sign in"
            variant="secondary"
            onPress={() => navigation.navigate("SignIn")}
            disabled={loading}
          />
          {error && (
            <AppText variant="body" color={colors.error} center>
              {error}
            </AppText>
          )}
        </View>

        {loading && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  root: { flex: 1, justifyContent: "space-between", paddingHorizontal: spacing.gutter },

  brandSection: {
    alignItems: "center",
    paddingTop: spacing.lg,
    gap: spacing.base,
  },
  accent: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.secondary,
  },
  tagline: { marginTop: spacing.xs },

  illustrationSection: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  plateOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
  },
  plateInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.surfaceContainerLowest,
    position: "relative",
  },
  foodDot: {
    position: "absolute",
    borderRadius: 12,
  },

  statCard: {
    position: "absolute",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.base,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 2,
    alignItems: "center",
  },
  statLeft: { left: 0, bottom: "25%" },
  statRight: { right: 0, top: "25%" },

  ctaSection: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  ctaHint: { marginBottom: spacing.xs },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});

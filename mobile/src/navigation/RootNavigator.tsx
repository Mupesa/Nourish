/**
 * Decides which experience to show:
 *   - no active session (needsAuthDecision) → Auth screens (welcome / sign-in)
 *   - still resolving auth / profile          → splash spinner
 *   - profile with onboarding done            → main app
 *   - otherwise                               → onboarding flow
 */
import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "../auth/AuthContext";
import { AuthNavigator } from "../auth/AuthNavigator";
import { useProfile } from "../profile/ProfileContext";
import { colors } from "../theme/tokens";
import { MainNavigator } from "./MainNavigator";
import { OnboardingNavigator } from "./OnboardingNavigator";

export function RootNavigator() {
  const { initializing, needsAuthDecision } = useAuth();
  const { profile, loading } = useProfile();

  // Auth decision screen has its own NavigationContainer so no nested nav issues.
  if (needsAuthDecision) {
    return (
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  if (initializing || loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const onboarded = profile?.onboardingCompleted === true;

  return (
    <NavigationContainer>
      {onboarded ? <MainNavigator /> : <OnboardingNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});

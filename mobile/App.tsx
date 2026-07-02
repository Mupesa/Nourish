/**
 * App root. Loads brand fonts, then wires the provider stack:
 *   SafeArea -> ErrorBoundary -> Auth -> Profile -> RootNavigator
 *
 * `mountKey` lets a font-load failure retry cleanly: bumping it remounts
 * AppInner, which re-runs useFonts from scratch (hooks can't be "retried"
 * in place).
 */
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/auth/AuthContext";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { ErrorScreen } from "./src/components/ErrorScreen";
import { env } from "./src/config/env";
import { ProfileProvider } from "./src/profile/ProfileContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { colors } from "./src/theme/tokens";

export default function App() {
  const [mountKey, setMountKey] = useState(0);
  return <AppInner key={mountKey} onRetryFonts={() => setMountKey((k) => k + 1)} />;
}

function AppInner({ onRetryFonts }: { onRetryFonts: () => void }) {
  const [fontWaitElapsed, setFontWaitElapsed] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    const timer = setTimeout(() => setFontWaitElapsed(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log("[startup]", {
      apiBaseUrl: env.apiBaseUrl,
      useFirebaseEmulator: env.useFirebaseEmulator,
      projectId: env.firebase.projectId,
    });

    fetch(`${env.apiBaseUrl}/api/v1/meta/health`)
      .then(async (response) => {
        const text = await response.text();
        console.log("[startup] API health", response.status, text);
      })
      .catch((error) => {
        console.warn("[startup] API health failed", error);
      });
  }, []);

  let content: React.ReactNode;
  if (fontError) {
    // A real failure, not just slow loading — surface it instead of silently
    // rendering the app with broken/fallback fonts forever.
    content = (
      <ErrorScreen
        title="Couldn't load fonts"
        message="Nourish couldn't load its fonts. Try again, or restart the app if this keeps happening."
        onRetry={onRetryFonts}
      />
    );
  } else if (!fontsLoaded && !fontWaitElapsed) {
    content = (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  } else {
    // Either fonts loaded, or we've waited long enough and are proceeding
    // with the system-font fallback (AppText degrades gracefully) rather
    // than blocking the whole app on a slow font load.
    content = (
      <ErrorBoundary>
        <AuthProvider>
          <ProfileProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </ProfileProvider>
        </AuthProvider>
      </ErrorBoundary>
    );
  }

  return <SafeAreaProvider>{content}</SafeAreaProvider>;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});

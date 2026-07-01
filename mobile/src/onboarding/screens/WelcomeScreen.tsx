import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "../../components/AppText";
import { Button } from "../../components/Button";
import { colors, maxContentWidth, spacing } from "../../theme/tokens";
import { OnboardingStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Welcome">;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <AppText variant="display" color={colors.primary} center>
            Nourish
          </AppText>
          <AppText
            variant="bodyLg"
            color={colors.onSurfaceVariant}
            center
            style={styles.tagline}
          >
            Your supportive kitchen friend. Cook well, track gently, and grow
            with friends.
          </AppText>
        </View>
        <View style={styles.actions}>
          <Button
            label="Get Started"
            onPress={() => navigation.navigate("Goal")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: maxContentWidth,
    alignSelf: "center",
    paddingHorizontal: spacing.gutter,
    justifyContent: "space-between",
    paddingVertical: spacing.xl,
  },
  hero: { flex: 1, justifyContent: "center", gap: spacing.md },
  tagline: { paddingHorizontal: spacing.base },
  actions: { gap: spacing.sm },
});

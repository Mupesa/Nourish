import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ChoiceCard } from "../../components/ChoiceCard";
import { OnboardingLayout } from "../../components/OnboardingLayout";
import { spacing } from "../../theme/tokens";
import { OnboardingStackParamList } from "../../navigation/types";
import { useOnboarding } from "../OnboardingContext";
import { DIET_OPTIONS, ONBOARDING_STEPS } from "../labels";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Dietary">;

export function DietaryScreen({ navigation }: Props) {
  const { draft, toggleDiet } = useOnboarding();

  // Render diet tiles two-per-row.
  const rows = [];
  for (let i = 0; i < DIET_OPTIONS.length; i += 2) {
    rows.push(DIET_OPTIONS.slice(i, i + 2));
  }

  return (
    <OnboardingLayout
      step={3}
      totalSteps={ONBOARDING_STEPS}
      title="Any dietary preferences?"
      subtitle="We'll tailor your recipes to match. Optional — pick any that apply."
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate("SaveProgress")}
    >
      <View style={styles.grid}>
        {rows.map((row, idx) => (
          <View key={idx} style={styles.row}>
            {row.map((opt) => (
              <ChoiceCard
                key={opt.value}
                title={opt.label}
                icon={opt.icon}
                layout="tile"
                selected={draft.dietaryPreferences.includes(opt.value)}
                onPress={() => toggleDiet(opt.value)}
              />
            ))}
          </View>
        ))}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  grid: { gap: spacing.sm },
  row: { flexDirection: "row", gap: spacing.sm },
});

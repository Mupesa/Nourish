import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ChoiceCard } from "../../components/ChoiceCard";
import { OnboardingLayout } from "../../components/OnboardingLayout";
import { spacing } from "../../theme/tokens";
import { OnboardingStackParamList } from "../../navigation/types";
import { useOnboarding } from "../OnboardingContext";
import { GOAL_OPTIONS, ONBOARDING_STEPS } from "../labels";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Goal">;

export function GoalScreen({ navigation }: Props) {
  const { draft, setGoal } = useOnboarding();

  return (
    <OnboardingLayout
      step={0}
      totalSteps={ONBOARDING_STEPS}
      title="What's your main goal?"
      subtitle="We'll tailor your kitchen journey to your priority."
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate("BodyMetrics")}
      nextDisabled={!draft.goal}
    >
      <View style={styles.list}>
        {GOAL_OPTIONS.map((opt) => (
          <ChoiceCard
            key={opt.value}
            title={opt.label}
            description={opt.description}
            icon={opt.icon}
            selected={draft.goal === opt.value}
            onPress={() => setGoal(opt.value)}
          />
        ))}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
});

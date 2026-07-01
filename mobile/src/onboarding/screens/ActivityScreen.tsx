import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ChoiceCard } from "../../components/ChoiceCard";
import { OnboardingLayout } from "../../components/OnboardingLayout";
import { spacing } from "../../theme/tokens";
import { OnboardingStackParamList } from "../../navigation/types";
import { useOnboarding } from "../OnboardingContext";
import { ACTIVITY_OPTIONS, ONBOARDING_STEPS } from "../labels";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Activity">;

export function ActivityScreen({ navigation }: Props) {
  const { draft, setActivity } = useOnboarding();

  return (
    <OnboardingLayout
      step={2}
      totalSteps={ONBOARDING_STEPS}
      title="How active are you?"
      subtitle="This helps us get your calorie target just right."
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate("Dietary")}
      nextDisabled={!draft.activityLevel}
    >
      <View style={styles.list}>
        {ACTIVITY_OPTIONS.map((opt) => (
          <ChoiceCard
            key={opt.value}
            title={opt.label}
            description={opt.description}
            icon={opt.icon}
            selected={draft.activityLevel === opt.value}
            onPress={() => setActivity(opt.value)}
          />
        ))}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
});

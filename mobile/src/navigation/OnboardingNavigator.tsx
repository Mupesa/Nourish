import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { OnboardingProvider } from "../onboarding/OnboardingContext";
import { WelcomeScreen } from "../onboarding/screens/WelcomeScreen";
import { GoalScreen } from "../onboarding/screens/GoalScreen";
import { BodyMetricsScreen } from "../onboarding/screens/BodyMetricsScreen";
import { ActivityScreen } from "../onboarding/screens/ActivityScreen";
import { DietaryScreen } from "../onboarding/screens/DietaryScreen";
import { SaveProgressScreen } from "../onboarding/screens/SaveProgressScreen";
import { OnboardingStackParamList } from "./types";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <OnboardingProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Goal" component={GoalScreen} />
        <Stack.Screen name="BodyMetrics" component={BodyMetricsScreen} />
        <Stack.Screen name="Activity" component={ActivityScreen} />
        <Stack.Screen name="Dietary" component={DietaryScreen} />
        <Stack.Screen name="SaveProgress" component={SaveProgressScreen} />
      </Stack.Navigator>
    </OnboardingProvider>
  );
}

/**
 * Holds the in-progress onboarding answers as the user moves through the steps,
 * and submits them to the backend at the end.
 */
import React, { createContext, useContext, useMemo, useState } from "react";
import { submitOnboarding } from "../api/profile";
import {
  ActivityLevel,
  BodyMetrics,
  DietaryPreference,
  Goal,
  OnboardingPayload,
} from "../types/domain";

interface OnboardingDraft {
  goal?: Goal;
  metrics?: Partial<BodyMetrics>;
  activityLevel?: ActivityLevel;
  dietaryPreferences: DietaryPreference[];
}

interface OnboardingContextValue {
  draft: OnboardingDraft;
  setGoal: (g: Goal) => void;
  setMetrics: (m: Partial<BodyMetrics>) => void;
  setActivity: (a: ActivityLevel) => void;
  toggleDiet: (d: DietaryPreference) => void;
  /** Validate completeness and POST to the backend. Returns the new profile. */
  submit: () => Promise<OnboardingPayload>;
  isComplete: boolean;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined,
);

function metricsComplete(m?: Partial<BodyMetrics>): m is BodyMetrics {
  return (
    !!m &&
    typeof m.ageYears === "number" &&
    typeof m.heightCm === "number" &&
    typeof m.weightKg === "number" &&
    (m.biologicalSex === "male" || m.biologicalSex === "female")
  );
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>({
    dietaryPreferences: [],
  });

  const setGoal = (goal: Goal) => setDraft((d) => ({ ...d, goal }));
  const setMetrics = (m: Partial<BodyMetrics>) =>
    setDraft((d) => ({ ...d, metrics: { ...d.metrics, ...m } }));
  const setActivity = (activityLevel: ActivityLevel) =>
    setDraft((d) => ({ ...d, activityLevel }));
  const toggleDiet = (diet: DietaryPreference) =>
    setDraft((d) => ({
      ...d,
      dietaryPreferences: d.dietaryPreferences.includes(diet)
        ? d.dietaryPreferences.filter((x) => x !== diet)
        : [...d.dietaryPreferences, diet],
    }));

  const isComplete =
    !!draft.goal && !!draft.activityLevel && metricsComplete(draft.metrics);

  const submit = async (): Promise<OnboardingPayload> => {
    if (!draft.goal || !draft.activityLevel || !metricsComplete(draft.metrics)) {
      throw new Error("Onboarding is incomplete");
    }
    const payload: OnboardingPayload = {
      goal: draft.goal,
      activityLevel: draft.activityLevel,
      dietaryPreferences: draft.dietaryPreferences,
      metrics: draft.metrics,
    };
    await submitOnboarding(payload);
    return payload;
  };

  const value = useMemo<OnboardingContextValue>(
    () => ({
      draft,
      setGoal,
      setMetrics,
      setActivity,
      toggleDiet,
      submit,
      isComplete,
    }),
    [draft, isComplete],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx)
    throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}

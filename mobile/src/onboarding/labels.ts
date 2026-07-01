/**
 * Display metadata for the onboarding enums — labels, descriptions, and icons
 * (lifted from the prototypes). Keeps screen JSX declarative.
 */
import { MaterialIcons } from "@expo/vector-icons";
import {
  ActivityLevel,
  DietaryPreference,
  Goal,
} from "../types/domain";

type Icon = keyof typeof MaterialIcons.glyphMap;

interface Option<T> {
  value: T;
  label: string;
  description?: string;
  icon: Icon;
}

export const GOAL_OPTIONS: Option<Goal>[] = [
  {
    value: "lose_weight",
    label: "Lose Weight",
    description: "A balanced deficit with nutrient-dense meals.",
    icon: "monitor-weight",
  },
  {
    value: "maintain_tone",
    label: "Maintain & Tone",
    description: "Long-term wellness and energy stability.",
    icon: "spa",
  },
  {
    value: "gain_muscle",
    label: "Gain Muscle",
    description: "Strength-focused meals with a healthy surplus.",
    icon: "fitness-center",
  },
  {
    value: "healthy_habits",
    label: "Healthy Habits",
    description: "Master better cooking and diverse ingredients.",
    icon: "restaurant",
  },
];

export const ACTIVITY_OPTIONS: Option<ActivityLevel>[] = [
  {
    value: "sedentary",
    label: "Sedentary",
    description: "Office job, very little exercise",
    icon: "event-seat",
  },
  {
    value: "lightly_active",
    label: "Lightly Active",
    description: "Daily walks, light chores",
    icon: "directions-walk",
  },
  {
    value: "moderately_active",
    label: "Moderately Active",
    description: "Gym 3-4x weekly, active hobbies",
    icon: "fitness-center",
  },
  {
    value: "very_active",
    label: "Very Active",
    description: "Physical job or high-intensity training daily",
    icon: "sports-gymnastics",
  },
];

export const DIET_OPTIONS: Option<DietaryPreference>[] = [
  { value: "vegetarian", label: "Vegetarian", icon: "eco" },
  { value: "vegan", label: "Vegan", icon: "spa" },
  { value: "keto", label: "Keto", icon: "bolt" },
  { value: "gluten_free", label: "Gluten-Free", icon: "no-meals" },
  { value: "mediterranean", label: "Mediterranean", icon: "waves" },
  { value: "paleo", label: "Paleo", icon: "outdoor-grill" },
];

/** Total data-collection steps (Welcome is excluded from the progress bar). */
export const ONBOARDING_STEPS = 5;

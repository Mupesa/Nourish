/** Navigation param lists — typed routes for the whole app. */
import { NavigatorScreenParams } from "@react-navigation/native";
import { RecipeCuisineRegion, RecipeMealType } from "../types/domain";

export type AuthStackParamList = {
  AuthWelcome: undefined;
  SignIn: undefined;
  ForgotPassword: { prefillEmail?: string };
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  Goal: undefined;
  BodyMetrics: undefined;
  Activity: undefined;
  Dietary: undefined;
  SaveProgress: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Discover:
    | {
        mealType?: RecipeMealType;
        cuisineRegion?: RecipeCuisineRegion;
      }
    | undefined;
  Diary: undefined;
  Planner: undefined;
  Community: undefined;
};

export type MainStackParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList>;
  LogMeal: { date: string };
  RecipeDetail: { recipeId: string; source: "recipe" | "spoonacular" };
  CookMode: {
    title: string;
    steps: { title: string; body: string; icon: string | null }[];
  };
  Friends: undefined;
  Profile: undefined;
  CreatePost: undefined;
  UserProfile: { uid: string };
};

export type RootStackParamList = {
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

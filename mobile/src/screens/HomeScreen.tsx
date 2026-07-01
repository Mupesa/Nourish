/**
 * Home / Discover landing (home_discover mockup): calorie ring for today,
 * featured recipes rail, and category tiles.
 */
import { useFocusEffect } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchDay } from "../api/diary";
import { getRecommendedRecipes } from "../api/recipes";
import { AppText } from "../components/AppText";
import { CalorieRing } from "../components/CalorieRing";
import { InlineError } from "../components/InlineError";
import { RecipeCard } from "../components/RecipeCard";
import { colors, radius, spacing } from "../theme/tokens";
import { MainStackParamList, MainTabParamList } from "../navigation/types";
import { RecipeMealType, RecipeRecommendation } from "../types/domain";
import { todayLocal } from "../utils/date";

type Props = BottomTabScreenProps<MainTabParamList, "Home">;

const CATEGORIES: { label: string; mealType: RecipeMealType }[] = [
  { label: "Breakfast", mealType: "breakfast" },
  { label: "Lunch", mealType: "lunch" },
  { label: "Dinner", mealType: "dinner" },
  { label: "Snacks", mealType: "snack" },
];

export function HomeScreen({ navigation }: Props) {
  const [consumed, setConsumed] = useState(0);
  const [goal, setGoal] = useState(0);
  const [recommended, setRecommended] = useState<RecipeRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parent =
    navigation.getParent<NativeStackNavigationProp<MainStackParamList>>();

  const load = useCallback(async () => {
    setError(null);
    try {
      const [day, recipes] = await Promise.all([
        fetchDay(todayLocal()),
        getRecommendedRecipes({ limit: 10 }),
      ]);
      setConsumed(day.entry.totals.kcal);
      setGoal(day.goalKcal);
      setRecommended(recipes.recipes);
    } catch (e) {
      console.warn("[home] load failed", e);
      setError("Couldn't load your dashboard. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <InlineError message={error} onRetry={() => void load()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="display" color={colors.primary}>
          Nourish
        </AppText>

        <View style={styles.ringCard}>
          <CalorieRing consumed={consumed} goal={goal} />
          <AppText variant="body" color={colors.onSurfaceVariant} center>
            {consumed.toLocaleString()} of {goal.toLocaleString()} kcal eaten today
          </AppText>
        </View>

        {/* Recommended */}
        <View style={styles.sectionHead}>
          <AppText variant="headline">Recommended for you</AppText>
          <AppText
            variant="bodySemiBold"
            color={colors.primary}
            onPress={() => navigation.navigate("Discover")}
          >
            View all
          </AppText>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
        >
          {recommended.map(({ recipe: r, reasons }) => (
            <RecipeCard
              key={r.id}
              title={r.title}
              imageUrl={r.imageUrl}
              kcal={r.kcal}
              cookMins={r.cookMins}
              reason={reasons[0]?.text}
              style={styles.railCard}
              onPress={() =>
                parent?.navigate("RecipeDetail", {
                  recipeId: r.id,
                  source: "recipe",
                })
              }
            />
          ))}
        </ScrollView>

        {/* Categories */}
        <AppText variant="headline">Categories</AppText>
        <View style={styles.catGrid}>
          {CATEGORIES.map((c) => (
            <View
              key={c.mealType}
              style={styles.catTile}
              onTouchEnd={() =>
                navigation.navigate("Discover", { mealType: c.mealType })
              }
            >
              <AppText variant="bodySemiBold" color={colors.onPrimaryContainer}>
                {c.label}
              </AppText>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 100 },
  ringCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rail: { gap: spacing.sm, paddingRight: spacing.gutter },
  railCard: { width: 240 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  catTile: {
    flexGrow: 1,
    flexBasis: "45%",
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
});

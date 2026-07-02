/**
 * Warm home feed: opens on food, confidence, and gentle nutrition context.
 */
import { useFocusEffect } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
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
import {
  Recipe,
  RecipeMealType,
  RecipeRecommendation,
} from "../types/domain";
import { todayLocal } from "../utils/date";

type Props = BottomTabScreenProps<MainTabParamList, "Home">;

interface HomeSection {
  key: string;
  title: string;
  subtitle: string;
  recipes: RecipeRecommendation[];
}

const warmColors = {
  background: "#fff9f0",
  panel: "#fffdf8",
  peach: "#f6d7b8",
  peachSoft: "#fbead8",
  berry: "#7d2f3b",
} as const;

const CATEGORIES: {
  label: string;
  mealType: RecipeMealType;
  icon: keyof typeof MaterialIcons.glyphMap;
}[] = [
  { label: "Breakfast", mealType: "breakfast", icon: "wb-sunny" },
  { label: "Lunch", mealType: "lunch", icon: "lunch-dining" },
  { label: "Dinner", mealType: "dinner", icon: "dinner-dining" },
  { label: "Snacks", mealType: "snack", icon: "bakery-dining" },
];

export function HomeScreen({ navigation }: Props) {
  const [consumed, setConsumed] = useState(0);
  const [goal, setGoal] = useState(0);
  const [recommended, setRecommended] = useState<RecipeRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parent =
    navigation.getParent<NativeStackNavigationProp<MainStackParamList>>();

  const openRecipe = useCallback(
    (recipe: Recipe) => {
      parent?.navigate("RecipeDetail", {
        recipeId: recipe.id,
        source: "recipe",
      });
    },
    [parent],
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      const [day, recipes] = await Promise.all([
        fetchDay(todayLocal()),
        getRecommendedRecipes({ limit: 18, includeReasons: true }),
      ]);
      setConsumed(day.entry.totals.kcal);
      setGoal(day.goalKcal);
      setRecommended(recipes.recipes);
    } catch (e) {
      console.warn("[home] load failed", e);
      setError("Couldn't load your home feed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const { todayPick, sections } = useMemo(
    () => buildHomeFeed(recommended),
    [recommended],
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
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <AppText variant="label" color={warmColors.berry}>
              Today in your kitchen
            </AppText>
            <AppText variant="display" color={colors.onSurface}>
              What sounds good?
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Discover"
            style={({ pressed }) => [
              styles.discoverButton,
              pressed && styles.pressed,
            ]}
            onPress={() => navigation.navigate("Discover")}
          >
            <MaterialIcons name="search" size={22} color={colors.onPrimary} />
          </Pressable>
        </View>

        <View style={styles.rhythmPanel}>
          <View style={styles.ringWrap}>
            <CalorieRing consumed={consumed} goal={goal} />
          </View>
          <View style={styles.rhythmCopy}>
            <AppText variant="bodySemiBold">Today's rhythm</AppText>
            <AppText variant="body" color={colors.onSurfaceVariant}>
              {consumed.toLocaleString()} of {goal.toLocaleString()} kcal logged.
              Keep cooking around what feels doable.
            </AppText>
          </View>
        </View>

        {todayPick && (
          <View style={styles.featureSection}>
            <View style={styles.sectionHead}>
              <View>
                <AppText variant="label" color={warmColors.berry}>
                  Today's pick
                </AppText>
                <AppText variant="headline">Start here</AppText>
              </View>
            </View>
            <RecipeCard
              variant="feature"
              title={todayPick.recipe.title}
              imageUrl={todayPick.recipe.imageUrl}
              kcal={todayPick.recipe.kcal}
              cookMins={todayPick.recipe.cookMins}
              difficulty={todayPick.recipe.difficulty}
              mealTypes={todayPick.recipe.mealTypes}
              reason={todayPick.reasons[0]?.text}
              onPress={() => openRecipe(todayPick.recipe)}
            />
          </View>
        )}

        {sections.map((section) => (
          <View key={section.key} style={styles.feedSection}>
            <View style={styles.sectionHead}>
              <View style={styles.sectionCopy}>
                <AppText variant="headline">{section.title}</AppText>
                <AppText variant="body" color={colors.onSurfaceVariant}>
                  {section.subtitle}
                </AppText>
              </View>
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
              {section.recipes.map(({ recipe, reasons }) => (
                <RecipeCard
                  key={`${section.key}-${recipe.id}`}
                  title={recipe.title}
                  imageUrl={recipe.imageUrl}
                  kcal={recipe.kcal}
                  cookMins={recipe.cookMins}
                  difficulty={recipe.difficulty}
                  mealTypes={recipe.mealTypes}
                  tag={getPrimaryTag(recipe)}
                  reason={reasons[0]?.text}
                  style={styles.railCard}
                  onPress={() => openRecipe(recipe)}
                />
              ))}
            </ScrollView>
          </View>
        ))}

        <View style={styles.categoryBand}>
          <View style={styles.sectionCopy}>
            <AppText variant="headline">Browse by mood</AppText>
            <AppText variant="body" color={colors.onSurfaceVariant}>
              Jump straight into the meal you are trying to solve.
            </AppText>
          </View>
          <View style={styles.catGrid}>
            {CATEGORIES.map((category) => (
              <Pressable
                key={category.mealType}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.catTile,
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  navigation.navigate("Discover", {
                    mealType: category.mealType,
                  })
                }
              >
                <MaterialIcons
                  name={category.icon}
                  size={22}
                  color={colors.primary}
                />
                <AppText variant="bodySemiBold" color={colors.onSurface}>
                  {category.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function buildHomeFeed(recommended: RecipeRecommendation[]) {
  const todayPick = recommended[0] ?? null;
  const afterPick = todayPick
    ? recommended.filter(({ recipe }) => recipe.id !== todayPick.recipe.id)
    : recommended;

  const tonightRecipes = pickDistinctRecipes(
    afterPick.filter(({ recipe }) => recipeMatchesMealType(recipe, "dinner")),
    afterPick,
    6,
  );
  const quickComfortRecipes = pickDistinctRecipes(
    afterPick.filter(({ recipe }) => recipe.cookMins > 0 && recipe.cookMins <= 30),
    afterPick,
    6,
  );
  const seasonalRecipes = pickDistinctRecipes(
    afterPick.filter(({ recipe }) =>
      recipe.dietaryTags.some((tag) =>
        ["mediterranean", "vegetarian", "gluten_free"].includes(tag),
      ),
    ),
    afterPick,
    6,
  );
  const savedInspiredRecipes = pickDistinctRecipes(afterPick.slice(6), afterPick, 6);

  const sections: HomeSection[] = [
    {
      key: "tonight",
      title: "Tonight",
      subtitle: "Dinner ideas with enough structure to make the evening easier.",
      recipes: tonightRecipes,
    },
    {
      key: "quick-comfort",
      title: "Quick comfort meals",
      subtitle: "Warm, practical picks that do not ask too much of you.",
      recipes: quickComfortRecipes,
    },
    {
      key: "seasonal",
      title: "Fresh right now",
      subtitle: "Lighter, colorful recipes for a more generous plate.",
      recipes: seasonalRecipes,
    },
    {
      key: "saved-inspired",
      title: "For another night",
      subtitle: "A few more ideas to keep nearby when dinner needs a softer landing.",
      recipes: savedInspiredRecipes,
    },
  ];

  return {
    todayPick,
    sections: sections.filter((section) => section.recipes.length > 0),
  };
}

function pickDistinctRecipes(
  preferred: RecipeRecommendation[],
  fallback: RecipeRecommendation[],
  limit: number,
) {
  const selected = new Map<string, RecipeRecommendation>();
  for (const item of [...preferred, ...fallback]) {
    if (selected.size >= limit) break;
    selected.set(item.recipe.id, item);
  }
  return Array.from(selected.values());
}

function recipeMatchesMealType(recipe: Recipe, mealType: RecipeMealType) {
  return recipe.mealTypes.includes(mealType);
}

function getPrimaryTag(recipe: Recipe) {
  const tag = recipe.dietaryTags[0];
  if (!tag) return undefined;
  return tag
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: warmColors.background },
  center: {
    flex: 1,
    backgroundColor: warmColors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 112 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  headerCopy: { flex: 1, gap: spacing.xs },
  discoverButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.85 },
  rhythmPanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: warmColors.panel,
    borderRadius: radius.default,
    borderWidth: 1,
    borderColor: warmColors.peach,
    padding: spacing.sm,
  },
  ringWrap: { width: 96, alignItems: "center" },
  rhythmCopy: { flex: 1, gap: spacing.xs },
  featureSection: { gap: spacing.sm },
  feedSection: { gap: spacing.sm },
  sectionHead: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  sectionCopy: { flex: 1, gap: spacing.xs },
  rail: { gap: spacing.sm, paddingRight: spacing.gutter },
  railCard: { width: 238 },
  categoryBand: {
    gap: spacing.sm,
    backgroundColor: warmColors.peachSoft,
    borderRadius: radius.default,
    padding: spacing.sm,
  },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  catTile: {
    flexGrow: 1,
    flexBasis: "45%",
    minHeight: 76,
    borderRadius: radius.default,
    backgroundColor: warmColors.panel,
    borderWidth: 1,
    borderColor: warmColors.peach,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
});

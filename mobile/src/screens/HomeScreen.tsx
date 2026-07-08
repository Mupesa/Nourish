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
import { getRecommendedRecipes } from "../api/recipes";
import { AppText } from "../components/AppText";
import { InlineError } from "../components/InlineError";
import { RecipeCard } from "../components/RecipeCard";
import { colors, radius, spacing } from "../theme/tokens";
import { MainStackParamList, MainTabParamList } from "../navigation/types";
import {
  Recipe,
  RecipeMealType,
  RecipeRecommendation,
} from "../types/domain";

type Props = BottomTabScreenProps<MainTabParamList, "Home">;

interface HomeSection {
  key: string;
  title: string;
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
      const recipes = await getRecommendedRecipes({
        limit: 14,
        includeReasons: true,
      });
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
              Nourish
            </AppText>
            <AppText variant="display" color={colors.onSurface}>
              What should we cook?
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

        {todayPick && (
          <View style={styles.featureSection}>
            <View style={styles.sectionHead}>
              <AppText variant="headline">Today's pick</AppText>
            </View>
            <RecipeCard
              variant="feature"
              title={todayPick.recipe.title}
              imageUrl={todayPick.recipe.imageUrl}
              kcal={todayPick.recipe.kcal}
              cookMins={todayPick.recipe.cookMins}
              difficulty={todayPick.recipe.difficulty}
              mealTypes={todayPick.recipe.mealTypes}
              onPress={() => openRecipe(todayPick.recipe)}
            />
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRail}
        >
          {CATEGORIES.map((category) => (
            <Pressable
              key={category.mealType}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.categoryPill,
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
                size={18}
                color={colors.primary}
              />
              <AppText variant="bodySemiBold" color={colors.onSurface}>
                {category.label}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>

        {sections.map((section) => (
          <View key={section.key} style={styles.feedSection}>
            <View style={styles.sectionHead}>
              <AppText variant="headline">{section.title}</AppText>
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
                  style={styles.railCard}
                  onPress={() => openRecipe(recipe)}
                />
              ))}
            </ScrollView>
          </View>
        ))}
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

  const sections: HomeSection[] = [
    {
      key: "tonight",
      title: "Tonight",
      recipes: tonightRecipes,
    },
    {
      key: "quick-comfort",
      title: "Quick comfort",
      recipes: quickComfortRecipes,
    },
    {
      key: "seasonal",
      title: "Fresh picks",
      recipes: seasonalRecipes,
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
  content: { padding: spacing.gutter, gap: spacing.sm, paddingBottom: 112 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.xs,
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
  featureSection: { gap: spacing.sm },
  feedSection: { gap: spacing.base, marginTop: spacing.base },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  rail: { gap: spacing.sm, paddingRight: spacing.gutter },
  railCard: { width: 238 },
  categoryRail: {
    gap: spacing.base,
    paddingVertical: spacing.xs,
    paddingRight: spacing.gutter,
  },
  categoryPill: {
    minWidth: 118,
    minHeight: 44,
    borderRadius: radius.default,
    backgroundColor: warmColors.panel,
    borderWidth: 1,
    borderColor: warmColors.peach,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
});

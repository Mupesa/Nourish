import { MaterialIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getRecommendedRecipes } from "../api/recipes";
import { AppText } from "../components/AppText";
import { InlineError } from "../components/InlineError";
import { MainStackParamList } from "../navigation/types";
import { colors, radius, spacing } from "../theme/tokens";
import {
  Recipe,
  RecipeCuisineRegion,
  RecipeMealType,
  RecipeRecommendation,
} from "../types/domain";

type Props = NativeStackScreenProps<MainStackParamList, "CuisineDetail">;
type MealFilter = RecipeMealType | "all";

const editorial = {
  background: "#fffaf2",
  surface: "#fffdf8",
  sage: "#254630",
  sageSoft: "#e8eadb",
  terracotta: "#d76545",
  terracottaDark: "#b84d34",
  cream: "#f2ead8",
  inkSoft: "#5d675f",
  border: "#eadfca",
  overlay: "rgba(12, 18, 14, 0.22)",
  overlayDeep: "rgba(12, 18, 14, 0.56)",
} as const;

const CUISINE_COPY: Record<
  RecipeCuisineRegion,
  {
    title: string;
    subtitle: string;
    story: string;
    accent: string;
  }
> = {
  southern_africa: {
    title: "Southern Africa",
    subtitle: "Braai smoke, maize bowls, bright relishes",
    story: "Warm plates built around fire, spice, and family-table comfort.",
    accent: "Peri-peri, pap, chakalaka, bobotie",
  },
  west_africa: {
    title: "West Africa",
    subtitle: "Deep stews, bold rice, spice-forward comfort",
    story: "Big color and bigger flavor, from jollof rice to peanut-rich bowls.",
    accent: "Jollof, egusi, suya, plantains",
  },
  east_africa: {
    title: "East Africa",
    subtitle: "Fragrant rice, stews, grilled plates",
    story: "A gentle mix of spice, grain, greens, and slow-cooked comfort.",
    accent: "Pilau, injera, ugali, nyama choma",
  },
  asian: {
    title: "Asian",
    subtitle: "Fast heat, noodles, rice bowls, bright aromatics",
    story: "Quick-moving recipes with layered sauces, herbs, and satisfying texture.",
    accent: "Thai curry, ramen, bibimbap, fried rice",
  },
  indian: {
    title: "Indian",
    subtitle: "Layered spices, creamy curries, hearty legumes",
    story: "Cozy dishes with spice depth, soft breads, fragrant rice, and bright herbs.",
    accent: "Biryani, dal, chana masala, paneer",
  },
  western: {
    title: "Western",
    subtitle: "Weeknight classics with familiar comfort",
    story: "Easy dinners, roasted plates, pasta bowls, and practical family staples.",
    accent: "Pasta, roast chicken, salmon, meatballs",
  },
};

const MEAL_FILTERS: {
  label: string;
  value: MealFilter;
  icon: keyof typeof MaterialIcons.glyphMap;
}[] = [
  { label: "All", value: "all", icon: "auto-awesome" },
  { label: "Breakfast", value: "breakfast", icon: "wb-sunny" },
  { label: "Lunch", value: "lunch", icon: "lunch-dining" },
  { label: "Dinner", value: "dinner", icon: "dinner-dining" },
  { label: "Snacks", value: "snack", icon: "bakery-dining" },
];

export function CuisineDetailScreen({ route, navigation }: Props) {
  const { cuisineRegion } = route.params;
  const copy = CUISINE_COPY[cuisineRegion];
  const [recipes, setRecipes] = useState<RecipeRecommendation[]>([]);
  const [mealFilter, setMealFilter] = useState<MealFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await getRecommendedRecipes({
        cuisineRegion,
        limit: 48,
        includeReasons: true,
      });
      setRecipes(page.recipes);
    } catch (e) {
      console.warn("[cuisine-detail] load failed", e);
      setError("Couldn't load these recipes. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [cuisineRegion]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRecipes = useMemo(() => {
    if (mealFilter === "all") return recipes;
    return recipes.filter(({ recipe }) => recipe.mealTypes.includes(mealFilter));
  }, [mealFilter, recipes]);

  const visibleRecipes = filteredRecipes.length > 0 ? filteredRecipes : recipes;
  const featured = visibleRecipes[0]?.recipe ?? recipes[0]?.recipe ?? null;
  const gridRecipes = featured
    ? visibleRecipes.filter(({ recipe }) => recipe.id !== featured.id)
    : visibleRecipes;

  const openRecipe = useCallback(
    (recipe: Recipe) => {
      navigation.navigate("RecipeDetail", {
        recipeId: recipe.id,
        source: "recipe",
      });
    },
    [navigation],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
        <ActivityIndicator color={editorial.sage} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
        <InlineError message={error} onRetry={() => void load()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.navRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <MaterialIcons name="arrow-back" size={23} color={editorial.sage} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Discover"
            onPress={() =>
              navigation.navigate("Tabs", {
                screen: "Discover",
                params: { cuisineRegion },
              })
            }
            style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}
          >
            <MaterialIcons name="search" size={22} color={colors.onPrimary} />
          </Pressable>
        </View>

        <View style={styles.heroCopy}>
          <AppText variant="display" color={editorial.sage} style={styles.title}>
            {copy.title}
          </AppText>
          <AppText variant="bodySemiBold" color={editorial.terracotta}>
            {copy.subtitle}
          </AppText>
          <AppText variant="body" color={editorial.inkSoft} style={styles.story}>
            {copy.story}
          </AppText>
        </View>

        {featured && (
          <Pressable
            onPress={() => openRecipe(featured)}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <ImageBackground
              source={featured.imageUrl ? { uri: featured.imageUrl } : undefined}
              style={styles.featuredImage}
              imageStyle={styles.featuredRadius}
            >
              {!featured.imageUrl && <View style={styles.imageFallback} />}
              <View style={styles.featuredOverlay} />
              <View style={styles.featuredBadge}>
                <MaterialIcons name="local-dining" size={16} color={editorial.sage} />
                <AppText variant="label" color={editorial.sage}>
                  Featured
                </AppText>
              </View>
              <View style={styles.featuredBody}>
                <AppText
                  variant="headline"
                  color={colors.onPrimary}
                  style={styles.featuredTitle}
                >
                  {featured.title}
                </AppText>
                <AppText variant="bodySemiBold" color="#f9e6c5">
                  {formatRecipeMeta(featured)}
                </AppText>
              </View>
            </ImageBackground>
          </Pressable>
        )}

        <View style={styles.accentStrip}>
          <MaterialIcons name="restaurant-menu" size={20} color={editorial.terracotta} />
          <AppText variant="bodySemiBold" color={editorial.sage} style={styles.accentText}>
            {copy.accent}
          </AppText>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {MEAL_FILTERS.map((filter) => {
            const active = mealFilter === filter.value;
            return (
              <Pressable
                key={filter.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setMealFilter(filter.value)}
                style={({ pressed }) => [
                  styles.filter,
                  active && styles.filterActive,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialIcons
                  name={filter.icon}
                  size={17}
                  color={active ? colors.onPrimary : editorial.sage}
                />
                <AppText
                  variant="bodySemiBold"
                  color={active ? colors.onPrimary : editorial.sage}
                  style={styles.filterText}
                >
                  {filter.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHead}>
          <View>
            <AppText variant="headline" color={editorial.sage} style={styles.sectionTitle}>
              Recipes
            </AppText>
            <AppText variant="body" color={editorial.inkSoft}>
              {filteredRecipes.length > 0
                ? `${filteredRecipes.length} ${mealFilter === "all" ? "recipes" : `${formatMealType(mealFilter)} picks`}`
                : `No ${formatMealType(mealFilter).toLowerCase()} picks yet`}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`See all ${copy.title} recipes in Discover`}
            onPress={() =>
              navigation.navigate("Tabs", {
                screen: "Discover",
                params: { cuisineRegion },
              })
            }
            style={({ pressed }) => [styles.linkPill, pressed && styles.pressed]}
          >
            <AppText variant="label" color={editorial.terracotta}>
              See all
            </AppText>
            <MaterialIcons name="chevron-right" size={19} color={editorial.terracotta} />
          </Pressable>
        </View>

        {filteredRecipes.length === 0 && mealFilter !== "all" && (
          <View style={styles.empty}>
            <MaterialIcons name="filter-alt-off" size={24} color={editorial.terracotta} />
            <AppText variant="bodySemiBold" color={editorial.sage}>
              Showing all {copy.title} recipes instead.
            </AppText>
          </View>
        )}

        <View style={styles.grid}>
          {gridRecipes.map(({ recipe }) => (
            <RecipeTile
              key={recipe.id}
              recipe={recipe}
              onPress={() => openRecipe(recipe)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RecipeTile({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.recipeCard, pressed && styles.pressed]}
    >
      <ImageBackground
        source={recipe.imageUrl ? { uri: recipe.imageUrl } : undefined}
        style={styles.recipeImage}
        imageStyle={styles.recipeImageRadius}
      >
        {!recipe.imageUrl && <View style={styles.imageFallback} />}
        <View style={styles.saveButton}>
          <MaterialIcons name="bookmark-border" size={19} color={colors.onPrimary} />
        </View>
      </ImageBackground>
      <View style={styles.recipeBody}>
        <AppText variant="bodySemiBold" color={editorial.sage} numberOfLines={2}>
          {recipe.title}
        </AppText>
        <View style={styles.metaRow}>
          <Meta icon="schedule" text={recipe.cookMins > 0 ? `${recipe.cookMins} min` : "Recipe"} />
          <Meta icon="signal-cellular-alt" text={formatDifficulty(recipe.difficulty)} />
        </View>
      </View>
    </Pressable>
  );
}

function Meta({
  icon,
  text,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.meta}>
      <MaterialIcons name={icon} size={14} color={editorial.inkSoft} />
      <AppText variant="label" color={editorial.inkSoft}>
        {text}
      </AppText>
    </View>
  );
}

function formatRecipeMeta(recipe: Recipe) {
  const time = recipe.cookMins > 0 ? `${recipe.cookMins} min` : null;
  return [time, formatDifficulty(recipe.difficulty), formatMealType(recipe.mealTypes[0])]
    .filter(Boolean)
    .join(" - ");
}

function formatDifficulty(difficulty: Recipe["difficulty"]) {
  if (difficulty === "easy") return "Easy";
  if (difficulty === "medium") return "Medium";
  return "Weekend";
}

function formatMealType(mealType?: MealFilter) {
  if (!mealType || mealType === "all") return "Recipe";
  return mealType === "snack"
    ? "Snack"
    : mealType.charAt(0).toUpperCase() + mealType.slice(1);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: editorial.background },
  center: {
    flex: 1,
    backgroundColor: editorial.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.gutter,
  },
  content: {
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.sm,
    paddingBottom: 96,
    gap: spacing.sm,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: editorial.cream,
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: editorial.sage,
  },
  heroCopy: { gap: spacing.xs },
  title: { fontSize: 40, lineHeight: 46 },
  story: { maxWidth: 330 },
  featuredImage: {
    height: 340,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  featuredRadius: { borderRadius: 30 },
  imageFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: editorial.sageSoft,
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: editorial.overlayDeep,
  },
  featuredBadge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: "#fff4df",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  featuredBody: { padding: spacing.sm, gap: spacing.xs },
  featuredTitle: { fontSize: 27, lineHeight: 33 },
  accentStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: editorial.surface,
    borderWidth: 1,
    borderColor: editorial.border,
    padding: spacing.sm,
  },
  accentText: { flex: 1 },
  filters: {
    gap: spacing.base,
    paddingRight: spacing.gutter,
    paddingVertical: spacing.xs,
  },
  filter: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "#ded2bf",
    backgroundColor: editorial.surface,
    paddingHorizontal: spacing.sm,
  },
  filterActive: {
    backgroundColor: editorial.sage,
    borderColor: editorial.sage,
  },
  filterText: { fontSize: 14, lineHeight: 18 },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionTitle: { fontSize: 24, lineHeight: 30 },
  linkPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderRadius: radius.full,
    backgroundColor: "#fff0e8",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  empty: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: "#fff0e8",
    padding: spacing.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  recipeCard: {
    width: "47.8%",
    minWidth: 150,
    flexGrow: 1,
    borderRadius: radius.default,
    overflow: "hidden",
    backgroundColor: editorial.surface,
    borderWidth: 1,
    borderColor: editorial.border,
  },
  recipeImage: { height: 142 },
  recipeImageRadius: {
    borderTopLeftRadius: radius.default,
    borderTopRightRadius: radius.default,
  },
  saveButton: {
    position: "absolute",
    top: spacing.base,
    right: spacing.base,
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: "rgba(37, 70, 48, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  recipeBody: { padding: spacing.sm, gap: spacing.base },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.base },
  meta: { flexDirection: "row", alignItems: "center", gap: 3 },
  pressed: { opacity: 0.86 },
});

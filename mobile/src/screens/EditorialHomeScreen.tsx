/**
 * Experimental editorial Home variant. Kept separate from HomeScreen so the
 * classic home can remain available behind EXPO_PUBLIC_HOME_VARIANT.
 */
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useMemo, useState } from "react";
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
import { MainStackParamList, MainTabParamList } from "../navigation/types";
import { colors, radius, spacing } from "../theme/tokens";
import {
  Recipe,
  RecipeCuisineRegion,
  RecipeMealType,
  RecipeRecommendation,
} from "../types/domain";

type Props = BottomTabScreenProps<MainTabParamList, "Home">;
type MealFilter = RecipeMealType | "all";

interface CuisineCard {
  key: string;
  title: string;
  subtitle: string;
  cuisineRegion: RecipeCuisineRegion;
  imageUrl: string | null;
}

interface RecipeShelf {
  key: string;
  title: string;
  recipes: RecipeRecommendation[];
}

const editorial = {
  background: "#fffaf2",
  surface: "#fffdf8",
  sage: "#254630",
  sageSoft: "#e8eadb",
  terracotta: "#d76545",
  terracottaDark: "#b84d34",
  cream: "#f2ead8",
  inkSoft: "#5d675f",
  overlay: "rgba(12, 18, 14, 0.28)",
  overlayDeep: "rgba(12, 18, 14, 0.48)",
} as const;

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

const CUISINES = [
  {
    key: "southern-africa",
    title: "Southern Africa",
    subtitle: "Rich flavors, warm traditions",
    cuisineRegion: "southern_africa",
    match: ["south", "southern", "africa", "african"],
  },
  {
    key: "west-africa",
    title: "West Africa",
    subtitle: "Bold spices, vibrant comfort",
    cuisineRegion: "west_africa",
    match: ["west", "jollof", "africa", "african"],
  },
  {
    key: "east-africa",
    title: "East Africa",
    subtitle: "Fragrant stews and bright plates",
    cuisineRegion: "east_africa",
    match: ["east", "swahili", "ethiopian", "africa", "african"],
  },
  {
    key: "asian",
    title: "Asian",
    subtitle: "Fast heat, deep flavor",
    cuisineRegion: "asian",
    match: ["asian", "thai", "chinese", "korean", "japanese"],
  },
  {
    key: "indian",
    title: "Indian",
    subtitle: "Layered spices, cozy bowls",
    cuisineRegion: "indian",
    match: ["indian", "curry", "masala"],
  },
  {
    key: "western",
    title: "Western",
    subtitle: "Weeknight classics",
    cuisineRegion: "western",
    match: ["western", "american", "european", "italian", "french"],
  },
] as const;

export function EditorialHomeScreen({ navigation }: Props) {
  const [recommended, setRecommended] = useState<RecipeRecommendation[]>([]);
  const [regionalRecipes, setRegionalRecipes] = useState<
    Partial<Record<RecipeCuisineRegion, RecipeRecommendation[]>>
  >({});
  const [activeMealFilter, setActiveMealFilter] = useState<MealFilter>("all");
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
      const [recipes, ...regionPages] = await Promise.all([
        getRecommendedRecipes({
          limit: 24,
          includeReasons: true,
        }),
        ...CUISINES.map((cuisine) =>
          getRecommendedRecipes({
            cuisineRegion: cuisine.cuisineRegion,
            limit: 6,
            includeReasons: false,
          }),
        ),
      ]);
      setRecommended(recipes.recipes);
      setRegionalRecipes(
        Object.fromEntries(
          CUISINES.map((cuisine, index) => [
            cuisine.cuisineRegion,
            regionPages[index]?.recipes ?? [],
          ]),
        ),
      );
    } catch (e) {
      console.warn("[editorial-home] load failed", e);
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

  const { todayPick, cuisineCards, shelves } = useMemo(
    () => buildEditorialFeed(recommended, activeMealFilter, regionalRecipes),
    [recommended, activeMealFilter, regionalRecipes],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={editorial.sage} />
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
            <AppText variant="display" color={editorial.sage} style={styles.logo}>
              Nourish
            </AppText>
            <AppText variant="bodySemiBold" color={editorial.terracotta}>
              Good morning, Anesu
            </AppText>
          </View>
          <View style={styles.headerActions}>
            <CircleButton
              icon="notifications-none"
              label="Notifications"
              onPress={() => undefined}
              muted
            />
            <CircleButton
              icon="search"
              label="Open Discover"
              onPress={() => navigation.navigate("Discover")}
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mealFilters}
        >
          {MEAL_FILTERS.map((filter) => {
            const active = activeMealFilter === filter.value;
            return (
              <Pressable
                key={filter.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setActiveMealFilter(filter.value)}
                style={({ pressed }) => [
                  styles.mealFilter,
                  active && styles.mealFilterActive,
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
                  style={styles.mealFilterText}
                >
                  {filter.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        {todayPick && (
          <View style={styles.section}>
            <SectionHeader
              icon="local-florist"
              title="Today's pick"
              action="View all"
              onAction={() => navigation.navigate("Discover")}
            />
            <HeroRecipeCard
              recipe={todayPick.recipe}
              onPress={() => openRecipe(todayPick.recipe)}
            />
          </View>
        )}

        <View style={styles.section}>
          <SectionHeader
            icon="public"
            title="Cook around the world"
            action="See all"
            onAction={() => navigation.navigate("Discover")}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cuisineRail}
          >
            {cuisineCards.map((cuisine) => (
              <CuisineTile
                key={cuisine.key}
                cuisine={cuisine}
                onPress={() =>
                  navigation.navigate("Discover", {
                    cuisineRegion: cuisine.cuisineRegion,
                  })
                }
              />
            ))}
          </ScrollView>
          <View style={styles.dots}>
            {cuisineCards.slice(0, 5).map((cuisine, index) => (
              <View
                key={cuisine.key}
                style={[styles.dot, index === 0 && styles.dotActive]}
              />
            ))}
          </View>
        </View>

        {shelves.map((shelf) => (
          <View key={shelf.key} style={styles.section}>
            <SectionHeader
              title={shelf.title}
              action="View all"
              onAction={() => navigation.navigate("Discover")}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recipeRail}
            >
              {shelf.recipes.map(({ recipe }) => (
                <SmallRecipeCard
                  key={`${shelf.key}-${recipe.id}`}
                  recipe={recipe}
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

function SectionHeader({
  icon,
  title,
  action,
  onAction,
}: {
  icon?: keyof typeof MaterialIcons.glyphMap;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionTitleRow}>
        {icon && <MaterialIcons name={icon} size={22} color={editorial.terracotta} />}
        <AppText variant="headline" color={editorial.sage} style={styles.sectionTitle}>
          {title}
        </AppText>
      </View>
      {action && onAction && (
        <AppText variant="bodySemiBold" color={editorial.terracotta} onPress={onAction}>
          {action}
        </AppText>
      )}
    </View>
  );
}

function CircleButton({
  icon,
  label,
  onPress,
  muted = false,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  muted?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.circleButton,
        muted ? styles.circleButtonMuted : styles.circleButtonPrimary,
        pressed && styles.pressed,
      ]}
    >
      <MaterialIcons
        name={icon}
        size={23}
        color={muted ? editorial.sage : colors.onPrimary}
      />
    </Pressable>
  );
}

function HeroRecipeCard({
  recipe,
  onPress,
}: {
  recipe: Recipe;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <ImageBackground
        source={recipe.imageUrl ? { uri: recipe.imageUrl } : undefined}
        style={styles.heroImage}
        imageStyle={styles.heroImageRadius}
      >
        {!recipe.imageUrl && <View style={styles.imageFallback} />}
        <View style={styles.heroOverlay} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Save ${recipe.title}`}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons name="bookmark-border" size={24} color={colors.onPrimary} />
        </Pressable>
        <View style={styles.heroContent}>
          <AppText variant="headline" color={colors.onPrimary} style={styles.heroTitle}>
            {recipe.title}
          </AppText>
          <AppText variant="bodySemiBold" color="#f9e6c5">
            {formatRecipeMeta(recipe)}
          </AppText>
          <View style={styles.heroButton}>
            <AppText variant="button" color={colors.onPrimary}>
              View recipe
            </AppText>
            <MaterialIcons name="arrow-forward" size={20} color={colors.onPrimary} />
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

function CuisineTile({
  cuisine,
  onPress,
}: {
  cuisine: CuisineCard;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <ImageBackground
        source={cuisine.imageUrl ? { uri: cuisine.imageUrl } : undefined}
        style={styles.cuisineImage}
        imageStyle={styles.cuisineImageRadius}
      >
        {!cuisine.imageUrl && <View style={styles.imageFallback} />}
        <View style={styles.cuisineOverlay} />
        <View style={styles.cuisineText}>
          <AppText variant="headline" color={colors.onPrimary} style={styles.cuisineTitle}>
            {cuisine.title}
          </AppText>
          <AppText variant="bodySemiBold" color="#f7dfbd" numberOfLines={1}>
            {cuisine.subtitle}
          </AppText>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

function SmallRecipeCard({
  recipe,
  onPress,
}: {
  recipe: Recipe;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.smallCard, pressed && styles.pressed]}
    >
      <ImageBackground
        source={recipe.imageUrl ? { uri: recipe.imageUrl } : undefined}
        style={styles.smallImage}
        imageStyle={styles.smallImageRadius}
      >
        {!recipe.imageUrl && <View style={styles.imageFallback} />}
      </ImageBackground>
      <View style={styles.smallBody}>
        <AppText variant="bodySemiBold" color={editorial.sage} numberOfLines={2}>
          {recipe.title}
        </AppText>
        <AppText variant="label" color={editorial.inkSoft}>
          {formatRecipeMeta(recipe)}
        </AppText>
      </View>
    </Pressable>
  );
}

function buildEditorialFeed(
  recommended: RecipeRecommendation[],
  activeMealFilter: MealFilter,
  regionalRecipes: Partial<Record<RecipeCuisineRegion, RecipeRecommendation[]>>,
) {
  const filtered =
    activeMealFilter === "all"
      ? recommended
      : recommended.filter(({ recipe }) =>
          recipe.mealTypes.includes(activeMealFilter),
        );
  const usable = filtered.length > 0 ? filtered : recommended;
  const todayPick = usable[0] ?? null;
  const pool = todayPick
    ? usable.filter(({ recipe }) => recipe.id !== todayPick.recipe.id)
    : usable;
  const cuisineCards = buildCuisineCards(pool, regionalRecipes);

  const quickRecipes = pickDistinctRecipes(
    pool.filter(({ recipe }) => recipe.cookMins > 0 && recipe.cookMins <= 30),
    pool,
    6,
  );
  const dinnerRecipes = pickDistinctRecipes(
    pool.filter(({ recipe }) => recipe.mealTypes.includes("dinner")),
    pool,
    6,
  );
  const savedStyleRecipes = pickDistinctRecipes(pool.slice(8), pool, 6);

  const shelves: RecipeShelf[] = [
    { key: "quick", title: "Quick inspiration", recipes: quickRecipes },
    { key: "comfort", title: "Tonight's comfort", recipes: dinnerRecipes },
    { key: "saved", title: "Saved for later", recipes: savedStyleRecipes },
  ];

  return {
    todayPick,
    cuisineCards,
    shelves: shelves.filter((shelf) => shelf.recipes.length > 0),
  };
}

function buildCuisineCards(
  pool: RecipeRecommendation[],
  regionalRecipes: Partial<Record<RecipeCuisineRegion, RecipeRecommendation[]>>,
): CuisineCard[] {
  return CUISINES.map((cuisine, index) => {
    const regional = regionalRecipes[cuisine.cuisineRegion]?.[0];
    const matched = pool.find(({ recipe }) => {
      const searchable = [
        recipe.title,
        recipe.description,
        recipe.cuisine,
        ...recipe.mealTypes,
        ...recipe.dietaryTags,
      ]
        .join(" ")
        .toLowerCase();
      return cuisine.match.some((term) => searchable.includes(term));
    });
    const fallback = pool[index % Math.max(pool.length, 1)];

    return {
      key: cuisine.key,
      title: cuisine.title,
      subtitle: cuisine.subtitle,
      cuisineRegion: cuisine.cuisineRegion,
      imageUrl:
        regional?.recipe.imageUrl ??
        matched?.recipe.imageUrl ??
        fallback?.recipe.imageUrl ??
        null,
    };
  });
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

function formatRecipeMeta(recipe: Recipe) {
  const time = recipe.cookMins > 0 ? `${recipe.cookMins} min` : null;
  const difficulty =
    recipe.difficulty === "easy"
      ? "Easy"
      : recipe.difficulty === "medium"
        ? "Medium"
        : "Weekend";
  const meal = formatMealType(recipe.mealTypes[0]);
  return [time, difficulty, meal].filter(Boolean).join(" - ");
}

function formatMealType(mealType?: RecipeMealType) {
  if (!mealType) return "Recipe";
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
  },
  content: {
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.sm,
    paddingBottom: 112,
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerCopy: { flex: 1, gap: spacing.xs },
  logo: { fontSize: 44, lineHeight: 50 },
  headerActions: { gap: spacing.sm, alignItems: "center" },
  circleButton: {
    width: 50,
    height: 50,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  circleButtonMuted: { backgroundColor: editorial.cream },
  circleButtonPrimary: { backgroundColor: editorial.sage },
  mealFilters: {
    gap: spacing.base,
    paddingRight: spacing.gutter,
    paddingVertical: spacing.xs,
  },
  mealFilter: {
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
  mealFilterActive: {
    backgroundColor: editorial.sage,
    borderColor: editorial.sage,
  },
  mealFilterText: { fontSize: 14, lineHeight: 18 },
  section: { gap: spacing.base },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.base },
  sectionTitle: { fontSize: 23, lineHeight: 29 },
  heroImage: {
    height: 355,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  heroImageRadius: { borderRadius: 30 },
  imageFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: editorial.sageSoft,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: editorial.overlay,
  },
  saveButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: editorial.sage,
    alignItems: "center",
    justifyContent: "center",
  },
  heroContent: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  heroTitle: { fontSize: 26, lineHeight: 31 },
  heroButton: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
    backgroundColor: editorial.terracotta,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.base,
  },
  cuisineRail: { gap: spacing.sm, paddingRight: spacing.gutter },
  cuisineImage: {
    width: 275,
    height: 260,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  cuisineImageRadius: { borderRadius: 30 },
  cuisineOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: editorial.overlayDeep,
  },
  cuisineText: { padding: spacing.sm, gap: 2 },
  cuisineTitle: { fontSize: 24, lineHeight: 30 },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.base,
    paddingTop: spacing.xs,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: radius.full,
    backgroundColor: "#d8cfbd",
  },
  dotActive: { backgroundColor: editorial.sage },
  recipeRail: { gap: spacing.sm, paddingRight: spacing.gutter },
  smallCard: {
    width: 205,
    backgroundColor: editorial.surface,
    borderRadius: radius.default,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eadfca",
  },
  smallImage: { height: 132 },
  smallImageRadius: { borderTopLeftRadius: radius.default, borderTopRightRadius: radius.default },
  smallBody: { padding: spacing.sm, gap: spacing.xs },
  pressed: { opacity: 0.86 },
});

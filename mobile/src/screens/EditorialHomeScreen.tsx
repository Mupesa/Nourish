/**
 * Experimental editorial Home variant. Kept separate from HomeScreen so the
 * classic home can remain available behind EXPO_PUBLIC_HOME_VARIANT.
 */
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { getRecommendedRecipes, searchExternalRecipes } from "../api/recipes";
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
const TODAY_PICK_STORAGE_KEY = "nourish.home.todayPick";
const TODAY_PICK_TTL_MS = 24 * 60 * 60 * 1000;

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
  recipes: HomeRecipeCard[];
}

interface HomeRecipeCard {
  id: string;
  title: string;
  imageUrl: string | null;
  kcal: number;
  cookMins?: number;
  source: "recipe" | "spoonacular";
  recipe?: Recipe;
  reason?: string;
}

interface StoredTodayPick {
  recipeId: string;
  expiresAt: number;
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

const WORLD_RECIPE_IDS: Record<RecipeCuisineRegion, string[]> = {
  southern_africa: [
    "world-001",
    "world-002",
    "world-003",
    "world-004",
    "world-005",
    "world-006",
  ],
  west_africa: [
    "world-007",
    "world-008",
    "world-009",
    "world-010",
    "world-011",
    "world-012",
  ],
  east_africa: [
    "world-013",
    "world-014",
    "world-015",
    "world-016",
    "world-017",
    "world-018",
  ],
  asian: [
    "world-019",
    "world-020",
    "world-021",
    "world-022",
    "world-023",
    "world-024",
  ],
  indian: [
    "world-025",
    "world-026",
    "world-027",
    "world-028",
    "world-029",
    "world-030",
  ],
  western: [
    "world-031",
    "world-032",
    "world-033",
    "world-034",
    "world-035",
    "world-036",
  ],
};

const loadExternalHomeInspiration = async (): Promise<HomeRecipeCard[]> => {
  try {
    const [quick, dinner] = await Promise.all([
      searchExternalRecipes("quick healthy meals", 8),
      searchExternalRecipes("easy dinner recipes", 8),
    ]);
    return shuffleHomeCards(
      [...quick, ...dinner].map((recipe) => ({
        id: String(recipe.spoonacularId),
        title: recipe.title,
        imageUrl: recipe.imageUrl,
        kcal: recipe.kcal,
        source: "spoonacular" as const,
        reason: "More recipe ideas from Spoonacular",
      })),
    ).slice(0, 10);
  } catch (e) {
    console.warn("[editorial-home] external inspiration failed", e);
    return [];
  }
};

async function resolveTodayPickId(
  recipes: RecipeRecommendation[],
): Promise<string | null> {
  if (recipes.length === 0) return null;

  try {
    const storedRaw = await AsyncStorage.getItem(TODAY_PICK_STORAGE_KEY);
    const stored = storedRaw
      ? (JSON.parse(storedRaw) as Partial<StoredTodayPick>)
      : null;
    const storedRecipeExists =
      typeof stored?.recipeId === "string" &&
      recipes.some(({ recipe }) => recipe.id === stored.recipeId);

    if (
      storedRecipeExists &&
      typeof stored?.expiresAt === "number" &&
      stored.expiresAt > Date.now()
    ) {
      return stored.recipeId ?? null;
    }

    const nextRecipe = recipes[Math.floor(Math.random() * recipes.length)]?.recipe;
    if (!nextRecipe) return null;
    await AsyncStorage.setItem(
      TODAY_PICK_STORAGE_KEY,
      JSON.stringify({
        recipeId: nextRecipe.id,
        expiresAt: Date.now() + TODAY_PICK_TTL_MS,
      } satisfies StoredTodayPick),
    );
    return nextRecipe.id;
  } catch (e) {
    console.warn("[editorial-home] today pick persistence failed", e);
    return recipes[Math.floor(Math.random() * recipes.length)]?.recipe.id ?? null;
  }
}

export function EditorialHomeScreen({ navigation }: Props) {
  const [recommended, setRecommended] = useState<RecipeRecommendation[]>([]);
  const [externalInspiration, setExternalInspiration] = useState<HomeRecipeCard[]>(
    [],
  );
  const [todayPickId, setTodayPickId] = useState<string | null>(null);
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
      const recipes = await getRecommendedRecipes({
        limit: 24,
        includeReasons: true,
      });
      setRecommended(recipes.recipes);
      setTodayPickId(await resolveTodayPickId(recipes.recipes));
      const external = await loadExternalHomeInspiration();
      setExternalInspiration(external);
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
    () =>
      buildEditorialFeed(
        recommended,
        activeMealFilter,
        externalInspiration,
        todayPickId,
      ),
    [recommended, activeMealFilter, externalInspiration, todayPickId],
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
                  parent?.navigate("CuisineDetail", {
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
              {shelf.recipes.map((recipe) => (
                <SmallRecipeCard
                  key={`${shelf.key}-${recipe.source}-${recipe.id}`}
                  recipe={recipe}
                  onPress={() =>
                    recipe.source === "recipe" && recipe.recipe
                      ? openRecipe(recipe.recipe)
                      : parent?.navigate("RecipeDetail", {
                          recipeId: recipe.id,
                          source: "spoonacular",
                        })
                  }
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
        resizeMode="cover"
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
        resizeMode="cover"
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
  recipe: HomeRecipeCard;
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
          {formatHomeCardMeta(recipe)}
        </AppText>
      </View>
    </Pressable>
  );
}

function buildEditorialFeed(
  recommended: RecipeRecommendation[],
  activeMealFilter: MealFilter,
  externalInspiration: HomeRecipeCard[],
  todayPickId: string | null,
) {
  const todayPick =
    recommended.find(({ recipe }) => recipe.id === todayPickId) ??
    recommended[0] ??
    null;
  const filtered =
    activeMealFilter === "all"
      ? recommended
      : recommended.filter(({ recipe }) =>
          recipe.mealTypes.includes(activeMealFilter),
        );
  const usable = filtered.length > 0 ? filtered : recommended;
  const pool = todayPick
    ? usable.filter(({ recipe }) => recipe.id !== todayPick.recipe.id)
    : usable;
  const cuisineCards = buildCuisineCards(pool);

  const localPool = pool.map(toHomeRecipeCard);
  const quickRecipes = pickRandomHomeCards(
    [
      ...localPool.filter((recipe) => recipe.cookMins != null && recipe.cookMins <= 30),
      ...externalInspiration,
    ],
    localPool,
    6,
  );
  const dinnerRecipes = pickRandomHomeCards(
    [
      ...localPool.filter((recipe) => recipe.recipe?.mealTypes.includes("dinner")),
      ...externalInspiration,
    ],
    localPool,
    6,
  );
  const savedStyleRecipes = pickRandomHomeCards(localPool.slice(8), localPool, 6);

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
): CuisineCard[] {
  return CUISINES.map((cuisine, index) => {
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
        pickRandomWorldImage(cuisine.cuisineRegion) ??
        matched?.recipe.imageUrl ??
        fallback?.recipe.imageUrl ??
        null,
    };
  });
}

function pickRandomWorldImage(cuisineRegion: RecipeCuisineRegion) {
  const ids = WORLD_RECIPE_IDS[cuisineRegion];
  const id = ids[Math.floor(Math.random() * ids.length)];
  return `https://firebasestorage.googleapis.com/v0/b/nourish-22776.firebasestorage.app/o/recipes%2F${id}%2Fhero.webp?alt=media`;
}

function toHomeRecipeCard({ recipe, reasons }: RecipeRecommendation): HomeRecipeCard {
  return {
    id: recipe.id,
    title: recipe.title,
    imageUrl: recipe.imageUrl,
    kcal: recipe.kcal,
    cookMins: recipe.cookMins,
    source: "recipe",
    recipe,
    reason: reasons[0]?.text,
  };
}

function pickRandomHomeCards(
  preferred: HomeRecipeCard[],
  fallback: HomeRecipeCard[],
  limit: number,
) {
  const selected = new Map<string, HomeRecipeCard>();
  for (const item of shuffleHomeCards([...preferred, ...fallback])) {
    if (selected.size >= limit) break;
    selected.set(`${item.source}-${item.id}`, item);
  }
  return Array.from(selected.values());
}

function shuffleHomeCards(cards: HomeRecipeCard[]) {
  return [...cards].sort(() => Math.random() - 0.5);
}

function formatHomeCardMeta(recipe: HomeRecipeCard) {
  const time =
    recipe.cookMins != null && recipe.cookMins > 0 ? `${recipe.cookMins} min` : null;
  const source = recipe.source === "spoonacular" ? "Spoonacular" : null;
  return [time, source, `${recipe.kcal} kcal`].filter(Boolean).join(" - ");
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
    height: 278,
    overflow: "hidden",
    borderRadius: 30,
    backgroundColor: editorial.sageSoft,
    justifyContent: "flex-end",
  },
  heroImageRadius: { borderRadius: 30 },
  imageFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: editorial.sageSoft,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(12, 18, 14, 0.22)",
  },
  saveButton: {
    position: "absolute",
    top: spacing.base,
    right: spacing.base,
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: editorial.sage,
    alignItems: "center",
    justifyContent: "center",
  },
  heroContent: {
    padding: spacing.sm,
    gap: 2,
  },
  heroTitle: { fontSize: 22, lineHeight: 27 },
  heroButton: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
    backgroundColor: editorial.terracotta,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  cuisineRail: { gap: spacing.sm, paddingRight: spacing.gutter },
  cuisineImage: {
    width: 232,
    height: 170,
    overflow: "hidden",
    borderRadius: 28,
    backgroundColor: editorial.sageSoft,
    justifyContent: "flex-end",
  },
  cuisineImageRadius: { borderRadius: 28 },
  cuisineOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(12, 18, 14, 0.38)",
  },
  cuisineText: { padding: spacing.sm, gap: 1 },
  cuisineTitle: { fontSize: 20, lineHeight: 25 },
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

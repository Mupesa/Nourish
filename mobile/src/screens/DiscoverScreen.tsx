/**
 * Discover: browse the local library with dietary-tag filters, or search the
 * web (Spoonacular) by keyword. Tapping a card opens the recipe detail.
 */
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { getRecommendedRecipes, searchExternalRecipes } from "../api/recipes";
import { AppText } from "../components/AppText";
import { InlineError } from "../components/InlineError";
import { RecipeCard } from "../components/RecipeCard";
import { TextField } from "../components/TextField";
import { useProfile } from "../profile/ProfileContext";
import { DIET_OPTIONS } from "../onboarding/labels";
import { colors, radius, spacing } from "../theme/tokens";
import { MainStackParamList, MainTabParamList } from "../navigation/types";
import {
  DietaryPreference,
  RecipeCuisineRegion,
  RecipeMealType,
} from "../types/domain";

type Props = BottomTabScreenProps<MainTabParamList, "Discover">;

interface Card {
  id: string;
  title: string;
  imageUrl: string | null;
  kcal: number;
  cookMins?: number;
  source: "recipe" | "spoonacular";
  reason?: string;
}

const REGION_LABELS: Record<RecipeCuisineRegion, string> = {
  southern_africa: "Southern Africa",
  west_africa: "West Africa",
  east_africa: "East Africa",
  asian: "Asian",
  indian: "Indian",
  western: "Western",
};

export function DiscoverScreen({ navigation, route }: Props) {
  const { isPremium, freeViewsRemaining } = useProfile();
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<DietaryPreference | null>(null);
  const [mealType, setMealType] = useState<RecipeMealType | null>(
    route.params?.mealType ?? null,
  );
  const [cuisineRegion, setCuisineRegion] =
    useState<RecipeCuisineRegion | null>(route.params?.cuisineRegion ?? null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const parent =
    navigation.getParent<NativeStackNavigationProp<MainStackParamList>>();

  const loadLibrary = useCallback(async (nextPage = 1, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getRecommendedRecipes({
        tag: tag ?? undefined,
        mealType: mealType ?? undefined,
        cuisineRegion: cuisineRegion ?? undefined,
        page: nextPage,
        limit: 20,
      });
      const nextCards = result.recipes.map(({ recipe: r, reasons }) => ({
          id: r.id,
          title: r.title,
          imageUrl: r.imageUrl,
          kcal: r.kcal,
          cookMins: r.cookMins,
          source: "recipe" as const,
          reason: reasons[0]?.text,
        }));
      const externalCards =
        append ? [] : await loadExternalDiscoverCards({ mealType, cuisineRegion });
      setCards((current) =>
        append ? [...current, ...nextCards] : [...nextCards, ...externalCards],
      );
      setPage(result.page);
      setTotalPages(result.totalPages);
    } catch (e) {
      console.warn("[discover] library load failed", e);
      if (!append) setCards([]);
      setError("Couldn't load recipes. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [tag, mealType, cuisineRegion]);

  const runSearch = useCallback(async () => {
    if (query.trim().length < 2) {
      void loadLibrary(1);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [local, external] = await Promise.all([
        getRecommendedRecipes({
          q: query.trim(),
          tag: tag ?? undefined,
          mealType: mealType ?? undefined,
          cuisineRegion: cuisineRegion ?? undefined,
          limit: 16,
        }),
        loadExternalDiscoverCards({
          query: query.trim(),
          mealType,
          cuisineRegion,
          limit: 10,
        }),
      ]);
      const localCards = local.recipes.map(({ recipe: r, reasons }) => ({
        id: r.id,
        title: r.title,
        imageUrl: r.imageUrl,
        kcal: r.kcal,
        cookMins: r.cookMins,
        source: "recipe" as const,
        reason: reasons[0]?.text,
      }));
      setCards([...localCards, ...external]);
      setPage(1);
      setTotalPages(1);
    } catch (e) {
      console.warn("[discover] search failed", e);
      setCards([]);
      setError("Search failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [query, loadLibrary]);

  const retry = useCallback(
    () => (query.trim().length >= 2 ? runSearch() : loadLibrary(1)),
    [query, runSearch, loadLibrary],
  );

  useEffect(() => {
    if (query.trim().length === 0) void loadLibrary(1);
  }, [tag, mealType, cuisineRegion, query, loadLibrary]);

  useEffect(() => {
    setMealType(route.params?.mealType ?? null);
    setCuisineRegion(route.params?.cuisineRegion ?? null);
  }, [route.params?.mealType, route.params?.cuisineRegion]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <AppText variant="headline">Discover</AppText>

        {!isPremium && freeViewsRemaining != null && (
          <View style={styles.freeBanner}>
            <MaterialIcons
              name="lock-open"
              size={16}
              color={colors.onSurfaceVariant}
            />
            <AppText variant="label" color={colors.onSurfaceVariant}>
              {freeViewsRemaining > 0
                ? `${freeViewsRemaining} free recipe${freeViewsRemaining === 1 ? "" : "s"} left on the free plan`
                : "Free recipe limit reached — upgrade for unlimited"}
            </AppText>
          </View>
        )}

        <TextField
          placeholder="Search recipes (e.g. salmon, pasta)"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={runSearch}
        />

        {mealType && (
          <Pressable
            style={styles.activeMeal}
            onPress={() => setMealType(null)}
          >
            <AppText variant="label" color={colors.onPrimary}>
              {mealType} ×
            </AppText>
          </Pressable>
        )}

        {cuisineRegion && (
          <Pressable
            style={styles.activeMeal}
            onPress={() => setCuisineRegion(null)}
          >
            <AppText variant="label" color={colors.onPrimary}>
              {REGION_LABELS[cuisineRegion]} x
            </AppText>
          </Pressable>
        )}

        {/* Tag filters (only affect the local library) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tags}
        >
          {DIET_OPTIONS.map((opt) => {
            const active = tag === opt.value;
            return (
              <View
                key={opt.value}
                style={[styles.tag, active && styles.tagActive]}
                onTouchEnd={() => {
                  setQuery("");
                  setTag(active ? null : opt.value);
                }}
              >
                <AppText
                  variant="label"
                  color={active ? colors.onPrimary : colors.primary}
                >
                  {opt.label}
                </AppText>
              </View>
            );
          })}
        </ScrollView>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : error ? (
          <InlineError message={error} onRetry={() => void retry()} />
        ) : cards.length === 0 ? (
          <AppText variant="body" color={colors.onSurfaceVariant}>
            No recipes found. Try another search.
          </AppText>
        ) : (
          <View style={styles.grid}>
            {cards.map((c) => (
              <RecipeCard
                key={`${c.source}-${c.id}`}
                title={c.title}
                imageUrl={c.imageUrl}
                kcal={c.kcal}
                cookMins={c.cookMins}
                reason={c.reason}
                style={styles.gridCard}
                onPress={() =>
                  parent?.navigate("RecipeDetail", {
                    recipeId: c.id,
                    source: c.source,
                  })
                }
              />
            ))}
          </View>
        )}

        {query.trim().length === 0 && page < totalPages && !loading && (
          <Pressable
            style={styles.loadMore}
            onPress={() => void loadLibrary(page + 1, true)}
          >
            <AppText variant="button" color={colors.primary}>
              Load more recipes
            </AppText>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

async function loadExternalDiscoverCards({
  query,
  mealType,
  cuisineRegion,
  limit = 8,
}: {
  query?: string;
  mealType?: RecipeMealType | null;
  cuisineRegion?: RecipeCuisineRegion | null;
  limit?: number;
}): Promise<Card[]> {
  try {
    const results = await searchExternalRecipes(
      query ?? buildExternalDiscoverQuery(mealType, cuisineRegion),
      limit,
    );
    return results.map((recipe) => ({
      id: String(recipe.spoonacularId),
      title: recipe.title,
      imageUrl: recipe.imageUrl,
      kcal: recipe.kcal,
      source: "spoonacular" as const,
      reason: "Spoonacular",
    }));
  } catch (e) {
    console.warn("[discover] external recipes failed", e);
    return [];
  }
}

function buildExternalDiscoverQuery(
  mealType?: RecipeMealType | null,
  cuisineRegion?: RecipeCuisineRegion | null,
) {
  if (cuisineRegion) {
    return `${REGION_LABELS[cuisineRegion]} recipes`;
  }
  if (mealType === "breakfast") return "healthy breakfast recipes";
  if (mealType === "lunch") return "healthy lunch recipes";
  if (mealType === "dinner") return "easy dinner recipes";
  if (mealType === "snack") return "healthy snack recipes";
  return "quick healthy recipes";
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.gutter, gap: spacing.sm, paddingBottom: 100 },
  freeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  activeMeal: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.base,
  },
  tags: { gap: spacing.base, paddingVertical: spacing.xs },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.base,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  tagActive: { backgroundColor: colors.primary },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  gridCard: { flexGrow: 1, flexBasis: "45%" },
  loadMore: {
    alignItems: "center",
    borderColor: colors.primary,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: spacing.sm,
  },
});

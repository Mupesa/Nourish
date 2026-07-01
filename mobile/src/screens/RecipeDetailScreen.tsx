/**
 * Recipe detail (recipe_detail mockup): hero, macro chips, checkable
 * ingredients, numbered step timeline, and actions to add to the planner or
 * start an interactive cook session.
 */
import { MaterialIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "../api/client";
import { addPlanItem } from "../api/planner";
import { getRecipe } from "../api/recipes";
import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { PaywallCard } from "../components/PaywallCard";
import { useProfile } from "../profile/ProfileContext";
import { colors, radius, spacing } from "../theme/tokens";
import { MainStackParamList } from "../navigation/types";
import { MealSlot, Recipe } from "../types/domain";
import { todayLocal } from "../utils/date";

type Props = NativeStackScreenProps<MainStackParamList, "RecipeDetail">;

const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

export function RecipeDetailScreen({ route, navigation }: Props) {
  const { recipeId, source } = route.params;
  const { isPremium, freeViewsRemaining, noteFreeViewsRemaining } = useProfile();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let active = true;
    getRecipe(recipeId, source)
      .then((r) => {
        if (!active) return;
        setRecipe(r.recipe);
        noteFreeViewsRemaining(r.freeViewsRemaining);
      })
      .catch((e) => {
        if (!active) return;
        // 402 = free recipe-view cap reached → show the paywall, not an error.
        if (e instanceof ApiError && e.status === 402) {
          noteFreeViewsRemaining(0);
          setLocked(true);
          return;
        }
        const msg = e instanceof ApiError ? e.message : "Failed to load recipe";
        Alert.alert("Error", msg);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [recipeId, source, noteFreeViewsRemaining]);

  if (locked) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <Pressable style={styles.backInline} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
        </Pressable>
        <View style={styles.lockedWrap}>
          <PaywallCard
            title="You've reached the free limit"
            message="You've opened all 20 of your free recipes. Upgrade to unlock the full library."
          />
        </View>
      </SafeAreaView>
    );
  }

  const addToPlanner = () => {
    if (!recipe) return;
    Alert.alert("Add to planner", "Which meal today?", [
      ...SLOTS.map((slot) => ({
        text: slot[0].toUpperCase() + slot.slice(1),
        onPress: async () => {
          try {
            await addPlanItem(todayLocal(), {
              slot,
              recipeId: recipe.id,
              source: recipe.source === "spoonacular" ? "spoonacular" : "recipe",
            });
            Alert.alert("Added", `${recipe.title} added to ${slot}.`);
          } catch (e) {
            const msg = e instanceof ApiError ? e.message : "Could not add";
            Alert.alert("Error", msg);
          }
        },
      })),
      { text: "Cancel", style: "cancel" as const },
    ]);
  };

  if (loading || !recipe) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const totalMins = recipe.prepMins + recipe.cookMins;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.hero}>
          {recipe.imageUrl ? (
            <Image source={{ uri: recipe.imageUrl }} style={styles.heroImg} />
          ) : (
            <View style={[styles.heroImg, styles.heroPlaceholder]}>
              <MaterialIcons name="restaurant" size={64} color={colors.outline} />
            </View>
          )}
          <Pressable style={styles.back} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <AppText variant="headline">{recipe.title}</AppText>

          {!isPremium && freeViewsRemaining != null && (
            <View style={styles.freeBanner}>
              <MaterialIcons
                name="lock-open"
                size={16}
                color={colors.onSurfaceVariant}
              />
              <AppText variant="label" color={colors.onSurfaceVariant}>
                {freeViewsRemaining > 0
                  ? `${freeViewsRemaining} free recipe${freeViewsRemaining === 1 ? "" : "s"} left`
                  : "Last free recipe — upgrade for unlimited"}
              </AppText>
            </View>
          )}
          <View style={styles.metaRow}>
            <Meta icon="local-fire-department" text={`${recipe.kcal} kcal`} />
            {totalMins > 0 && <Meta icon="schedule" text={`${totalMins} min`} />}
            <Meta icon="signal-cellular-alt" text={recipe.difficulty} />
            <Meta icon="people" text={`Serves ${recipe.servings}`} />
          </View>

          {recipe.dietaryTags.length > 0 && (
            <View style={styles.tags}>
              {recipe.dietaryTags.map((t) => (
                <View key={t} style={styles.tag}>
                  <AppText variant="label" color={colors.primary}>
                    {t.replace("_", " ")}
                  </AppText>
                </View>
              ))}
            </View>
          )}

          {/* Macro chips */}
          <View style={styles.macros}>
            <MacroChip label="Protein" value={`${recipe.macros.proteinG}g`} />
            <MacroChip label="Carbs" value={`${recipe.macros.carbsG}g`} />
            <MacroChip label="Fat" value={`${recipe.macros.fatG}g`} />
          </View>
          <AppText variant="label" color={colors.outline}>
            {recipe.nutritionDisclaimer}
          </AppText>

          {/* Ingredients */}
          {recipe.ingredients.length > 0 && (
            <>
              <AppText variant="headline" color={colors.primary}>
                Ingredients
              </AppText>
              {recipe.ingredients.map((ing, i) => (
                <Pressable
                  key={i}
                  style={styles.ingRow}
                  onPress={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                >
                  <MaterialIcons
                    name={checked[i] ? "check-circle" : "radio-button-unchecked"}
                    size={22}
                    color={checked[i] ? colors.primary : colors.outline}
                  />
                  <AppText
                    variant="body"
                    color={checked[i] ? colors.outline : colors.onSurface}
                    style={[styles.ingName, checked[i] && styles.struck]}
                  >
                    {ing.name}
                  </AppText>
                  <AppText variant="label" color={colors.primary}>
                    {ing.quantity}
                  </AppText>
                </Pressable>
              ))}
            </>
          )}

          {/* Steps */}
          {recipe.steps.length > 0 && (
            <>
              <AppText variant="headline" color={colors.primary}>
                Preparation
              </AppText>
              {recipe.steps.map((step, i) => (
                <View key={i} style={styles.step}>
                  <View style={styles.stepNum}>
                    <AppText variant="bodySemiBold" color={colors.onPrimaryFixed}>
                      {i + 1}
                    </AppText>
                  </View>
                  <View style={styles.stepBody}>
                    <AppText variant="bodySemiBold">{step.title}</AppText>
                    <AppText variant="body" color={colors.onSurfaceVariant}>
                      {step.body}
                    </AppText>
                  </View>
                </View>
              ))}
            </>
          )}

          <View style={styles.actions}>
            <Button
              label="Add to planner"
              variant="secondary"
              onPress={addToPlanner}
              style={{ flex: 1 }}
            />
            <Button
              label="Start cooking"
              onPress={() =>
                navigation.navigate("CookMode", {
                  title: recipe.title,
                  steps: recipe.steps,
                })
              }
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
      <MaterialIcons name={icon} size={16} color={colors.onSurfaceVariant} />
      <AppText variant="label" color={colors.onSurfaceVariant}>
        {text}
      </AppText>
    </View>
  );
}

function MacroChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <AppText variant="label" color={colors.outline}>
        {label}
      </AppText>
      <AppText variant="bodySemiBold">{value}</AppText>
    </View>
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
  scroll: { paddingBottom: spacing.lg },
  lockedWrap: { flex: 1, justifyContent: "center", padding: spacing.gutter },
  backInline: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    margin: spacing.sm,
  },
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
  hero: { position: "relative" },
  heroImg: { width: "100%", height: 260 },
  heroPlaceholder: {
    backgroundColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  back: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: spacing.gutter, gap: spacing.sm },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: spacing.base },
  tag: {
    backgroundColor: colors.onPrimaryContainer,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  macros: {
    flexDirection: "row",
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  chip: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: "center",
    gap: 2,
  },
  ingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  ingName: { flex: 1 },
  struck: { textDecorationLine: "line-through" },
  step: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBody: { flex: 1, gap: 2 },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
});

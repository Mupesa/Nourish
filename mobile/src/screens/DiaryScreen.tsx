/**
 * Daily Diary — the Phase 1 home dashboard. Shows the day's calorie budget,
 * macros, water, and logged meals, with a FAB to log a new meal.
 */
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { deleteMeal, fetchDay, setWater } from "../api/diary";
import { AppText } from "../components/AppText";
import { colors, radius, spacing } from "../theme/tokens";
import { MainStackParamList, MainTabParamList } from "../navigation/types";
import { DiaryDaySummary, LoggedMeal } from "../types/domain";
import { friendlyDate, todayLocal } from "../utils/date";

type Props = BottomTabScreenProps<MainTabParamList, "Diary">;

export function DiaryScreen({ navigation }: Props) {
  const [date] = useState(todayLocal());
  const [summary, setSummary] = useState<DiaryDaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setSummary(await fetchDay(date));
    } catch (e) {
      console.warn("[diary] load failed", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const adjustWater = async (deltaMl: number) => {
    try {
      setSummary(await setWater(date, { addMl: deltaMl }));
    } catch (e) {
      console.warn("[diary] water update failed", e);
    }
  };

  const removeMeal = (meal: LoggedMeal) => {
    Alert.alert("Remove meal", `Remove "${meal.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            setSummary(await deleteMeal(date, meal.id));
          } catch (e) {
            console.warn("[diary] delete failed", e);
          }
        },
      },
    ]);
  };

  const openLogMeal = () =>
    navigation
      .getParent<NativeStackNavigationProp<MainStackParamList>>()
      ?.navigate("LogMeal", { date });

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const consumed = summary?.entry.totals.kcal ?? 0;
  const goal = summary?.goalKcal ?? 0;
  const remaining = summary?.remainingKcal ?? 0;
  const pct = goal > 0 ? Math.min(1, consumed / goal) : 0;
  const macros = summary?.entry.totals.macros;
  const targets = summary?.macroTargets;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.headerRow}>
          <AppText variant="headline">Your Diary</AppText>
          <AppText variant="bodySemiBold" color={colors.primary}>
            {friendlyDate(date)}
          </AppText>
        </View>

        {/* Calorie budget card */}
        <View style={styles.card}>
          <View style={styles.calorieTop}>
            <View>
              <AppText variant="display" color={colors.primary}>
                {remaining.toLocaleString()}
              </AppText>
              <AppText variant="label" color={colors.outline}>
                kcal remaining
              </AppText>
            </View>
            <View style={styles.calorieMeta}>
              <AppText variant="body" color={colors.onSurfaceVariant}>
                {consumed.toLocaleString()} eaten
              </AppText>
              <AppText variant="body" color={colors.onSurfaceVariant}>
                {goal.toLocaleString()} goal
              </AppText>
            </View>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct * 100}%` }]} />
          </View>
          {macros && targets && (
            <View style={styles.macros}>
              <Macro label="Protein" g={macros.proteinG} target={targets.proteinG} />
              <Macro label="Carbs" g={macros.carbsG} target={targets.carbsG} />
              <Macro label="Fat" g={macros.fatG} target={targets.fatG} />
            </View>
          )}
        </View>

        {/* Water */}
        <View style={styles.card}>
          <View style={styles.waterRow}>
            <View style={styles.waterLabel}>
              <MaterialIcons name="water-drop" size={24} color={colors.primary} />
              <View>
                <AppText variant="label" color={colors.outline}>
                  Water
                </AppText>
                <AppText variant="bodySemiBold">
                  {((summary?.entry.waterMl ?? 0) / 1000).toFixed(2)} /{" "}
                  {((summary?.waterGoalMl ?? 0) / 1000).toFixed(2)} L
                </AppText>
              </View>
            </View>
            <View style={styles.waterBtns}>
              <Pressable
                style={styles.waterBtn}
                onPress={() => adjustWater(-250)}
              >
                <MaterialIcons name="remove" size={20} color={colors.primary} />
              </Pressable>
              <Pressable
                style={styles.waterBtn}
                onPress={() => adjustWater(250)}
              >
                <MaterialIcons name="add" size={20} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Meals */}
        <AppText variant="headline" style={styles.mealsHeading}>
          Meals
        </AppText>
        {summary && summary.entry.meals.length > 0 ? (
          summary.entry.meals.map((meal) => (
            <Pressable
              key={meal.id}
              style={styles.mealRow}
              onLongPress={() => removeMeal(meal)}
            >
              <View style={styles.mealInfo}>
                <AppText variant="label" color={colors.secondary}>
                  {meal.slot}
                </AppText>
                <AppText variant="bodySemiBold">{meal.name}</AppText>
              </View>
              <View style={styles.kcalBadge}>
                <AppText variant="label" color={colors.onSurface}>
                  {meal.kcal} kcal
                </AppText>
              </View>
            </Pressable>
          ))
        ) : (
          <AppText variant="body" color={colors.onSurfaceVariant}>
            No meals logged yet. Tap + to add your first.
          </AppText>
        )}
        <AppText variant="body" color={colors.outline} style={styles.hint}>
          Tip: long-press a meal to remove it.
        </AppText>
      </ScrollView>

      <Pressable style={styles.fab} onPress={openLogMeal}>
        <MaterialIcons name="add" size={28} color={colors.onPrimary} />
      </Pressable>
    </SafeAreaView>
  );
}

function Macro({
  label,
  g,
  target,
}: {
  label: string;
  g: number;
  target: number;
}) {
  return (
    <View style={styles.macro}>
      <AppText variant="label" color={colors.outline}>
        {label}
      </AppText>
      <AppText variant="bodySemiBold">
        {g}/{target}g
      </AppText>
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
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 120 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  calorieTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  calorieMeta: { alignItems: "flex-end", gap: spacing.xs },
  track: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerHighest,
    overflow: "hidden",
  },
  fill: { height: 8, borderRadius: radius.full, backgroundColor: colors.primary },
  macros: { flexDirection: "row", justifyContent: "space-between" },
  macro: { gap: 2 },
  waterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  waterLabel: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  waterBtns: { flexDirection: "row", gap: spacing.base },
  waterBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
  },
  mealsHeading: { marginTop: spacing.base },
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
  },
  mealInfo: { gap: 2 },
  kcalBadge: {
    backgroundColor: colors.tertiaryFixed,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  hint: { marginTop: spacing.xs },
  fab: {
    position: "absolute",
    bottom: spacing.md,
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});

/**
 * Weekly Meal Planner (meal_planner mockup): day selector + the selected day's
 * planned meals by slot. Mark cooked (auto-logs to diary) or remove items.
 */
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getWeek,
  markPlanItemCooked,
  removePlanItem,
} from "../api/planner";
import { AppText } from "../components/AppText";
import { InlineError } from "../components/InlineError";
import { PaywallCard } from "../components/PaywallCard";
import { useProfile } from "../profile/ProfileContext";
import { colors, radius, spacing } from "../theme/tokens";
import { MainTabParamList } from "../navigation/types";
import { DayPlan, MealSlot, PlanItem } from "../types/domain";
import { dayParts, mondayOf, todayLocal } from "../utils/date";

type Props = BottomTabScreenProps<MainTabParamList, "Planner">;

const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

export function PlannerScreen(_props: Props) {
  const { isPremium } = useProfile();
  const weekStart = mondayOf(todayLocal());
  const [days, setDays] = useState<DayPlan[]>([]);
  const [selected, setSelected] = useState(todayLocal());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isPremium) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      setDays(await getWeek(weekStart));
    } catch (e) {
      console.warn("[planner] load failed", e);
      setError("Couldn't load your planner. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [weekStart, isPremium]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  // Free users: the Meal Planner is a premium feature.
  if (!isPremium) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <AppText variant="headline">Weekly Planner</AppText>
          <PaywallCard
            title="Plan your week with Premium"
            message="Map out every meal, then mark them cooked to auto-log your diary."
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const selectedPlan = days.find((d) => d.date === selected);

  const onCook = async (slot: MealSlot, item: PlanItem) => {
    try {
      const plan = await markPlanItemCooked(selected, slot, item.id);
      setDays((ds) => ds.map((d) => (d.date === selected ? plan : d)));
      Alert.alert("Logged", `${item.title} added to your diary.`);
    } catch (e) {
      console.warn("[planner] cook failed", e);
      Alert.alert("Error", "Couldn't mark this cooked. Try again.");
    }
  };

  const onRemove = (slot: MealSlot, item: PlanItem) => {
    Alert.alert("Remove", `Remove "${item.title}" from plan?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            const plan = await removePlanItem(selected, slot, item.id);
            setDays((ds) => ds.map((d) => (d.date === selected ? plan : d)));
          } catch (e) {
            console.warn("[planner] remove failed", e);
            Alert.alert("Error", "Couldn't remove this item. Try again.");
          }
        },
      },
    ]);
  };

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
        <AppText variant="headline">Weekly Planner</AppText>

        {/* Day selector */}
        <View style={styles.week}>
          {days.map((d) => {
            const { dow, day } = dayParts(d.date);
            const active = d.date === selected;
            return (
              <Pressable
                key={d.date}
                style={[styles.dayPill, active && styles.dayActive]}
                onPress={() => setSelected(d.date)}
              >
                <AppText
                  variant="label"
                  color={active ? colors.onPrimary : colors.onSurfaceVariant}
                >
                  {dow}
                </AppText>
                <AppText
                  variant="bodySemiBold"
                  color={active ? colors.onPrimary : colors.onSurface}
                >
                  {day}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {/* Selected day's slots */}
        {SLOTS.map((slot) => {
          const items = selectedPlan?.meals[slot] ?? [];
          return (
            <View key={slot} style={styles.slotBlock}>
              <AppText variant="label" color={colors.outline}>
                {slot}
              </AppText>
              {items.length === 0 ? (
                <AppText variant="body" color={colors.onSurfaceVariant}>
                  Nothing planned. Add from a recipe.
                </AppText>
              ) : (
                items.map((item) => (
                  <View key={item.id} style={styles.itemCard}>
                    <View style={styles.itemInfo}>
                      <AppText variant="bodySemiBold" numberOfLines={1}>
                        {item.title}
                      </AppText>
                      <AppText variant="label" color={colors.outline}>
                        {item.kcal} kcal {item.cooked ? "· cooked" : ""}
                      </AppText>
                    </View>
                    {!item.cooked && (
                      <Pressable
                        style={styles.iconBtn}
                        onPress={() => onCook(slot, item)}
                      >
                        <MaterialIcons
                          name="check-circle"
                          size={24}
                          color={colors.primary}
                        />
                      </Pressable>
                    )}
                    <Pressable
                      style={styles.iconBtn}
                      onPress={() => onRemove(slot, item)}
                    >
                      <MaterialIcons
                        name="delete-outline"
                        size={24}
                        color={colors.outline}
                      />
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          );
        })}
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
  week: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    padding: spacing.xs,
  },
  dayPill: {
    alignItems: "center",
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.base,
    borderRadius: radius.default,
    gap: 2,
    minWidth: 40,
  },
  dayActive: { backgroundColor: colors.primary },
  slotBlock: { gap: spacing.xs },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
    gap: spacing.base,
  },
  itemInfo: { flex: 1, gap: 2 },
  iconBtn: { padding: 4 },
});

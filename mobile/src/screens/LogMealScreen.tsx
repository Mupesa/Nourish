/**
 * Log Meal modal. Supports a "Quick Meal" flow: type a name, optionally tap
 * "Estimate" to auto-fill kcal/macros via the backend's Spoonacular proxy, pick
 * a slot, then save.
 */
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "../api/client";
import { logMeal } from "../api/diary";
import { guessNutrition } from "../api/nutrition";
import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { colors, radius, spacing } from "../theme/tokens";
import { MainStackParamList } from "../navigation/types";
import { MealSlot, MealSource } from "../types/domain";
import { num } from "../utils/units";

type Props = NativeStackScreenProps<MainStackParamList, "LogMeal">;

const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

export function LogMealScreen({ route, navigation }: Props) {
  const { date } = route.params;
  const [name, setName] = useState("");
  const [slot, setSlot] = useState<MealSlot>("breakfast");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [source, setSource] = useState<MealSource>("quick");
  const [estimating, setEstimating] = useState(false);
  const [saving, setSaving] = useState(false);

  const estimate = async () => {
    if (name.trim().length < 2) {
      Alert.alert("Enter a meal name", "Type what you ate, then estimate.");
      return;
    }
    setEstimating(true);
    try {
      const { estimate } = await guessNutrition(name.trim());
      setKcal(String(estimate.kcal));
      setProtein(String(estimate.macros.proteinG));
      setCarbs(String(estimate.macros.carbsG));
      setFat(String(estimate.macros.fatG));
      setSource("spoonacular");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Estimate failed";
      Alert.alert("Could not estimate", msg);
    } finally {
      setEstimating(false);
    }
  };

  const save = async () => {
    const kcalN = num(kcal);
    if (name.trim().length < 1) {
      Alert.alert("Missing name", "Give your meal a name.");
      return;
    }
    if (!Number.isFinite(kcalN) || kcalN < 0) {
      Alert.alert("Missing calories", "Enter calories or tap Estimate.");
      return;
    }
    setSaving(true);
    try {
      await logMeal(date, {
        slot,
        name: name.trim(),
        kcal: kcalN,
        macros: {
          proteinG: num(protein) || 0,
          carbsG: num(carbs) || 0,
          fatG: num(fat) || 0,
        },
        source,
      });
      navigation.goBack();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Could not save meal";
      Alert.alert("Save failed", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <AppText variant="headline">Log a meal</AppText>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <AppText variant="button" color={colors.primary}>
            Cancel
          </AppText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField
          label="What did you eat?"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Avocado toast with egg"
        />
        <Button
          label="Estimate nutrition from name"
          variant="secondary"
          onPress={estimate}
          loading={estimating}
        />

        <AppText variant="label" color={colors.onSurfaceVariant}>
          Meal
        </AppText>
        <View style={styles.slots}>
          {SLOTS.map((s) => (
            <Pressable
              key={s}
              onPress={() => setSlot(s)}
              style={[styles.slot, slot === s && styles.slotActive]}
            >
              <AppText
                variant="button"
                color={slot === s ? colors.onPrimary : colors.primary}
              >
                {s[0].toUpperCase() + s.slice(1)}
              </AppText>
            </Pressable>
          ))}
        </View>

        <TextField
          label="Calories"
          keyboardType="number-pad"
          value={kcal}
          onChangeText={setKcal}
          suffix="kcal"
          placeholder="0"
        />
        <View style={styles.macroRow}>
          <TextField
            label="Protein"
            keyboardType="number-pad"
            value={protein}
            onChangeText={setProtein}
            suffix="g"
            placeholder="0"
          />
          <TextField
            label="Carbs"
            keyboardType="number-pad"
            value={carbs}
            onChangeText={setCarbs}
            suffix="g"
            placeholder="0"
          />
          <TextField
            label="Fat"
            keyboardType="number-pad"
            value={fat}
            onChangeText={setFat}
            suffix="g"
            placeholder="0"
          />
        </View>

        <Button label="Add to diary" onPress={save} loading={saving} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.gutter,
  },
  content: { paddingHorizontal: spacing.gutter, paddingBottom: spacing.lg, gap: spacing.sm },
  slots: { flexDirection: "row", flexWrap: "wrap", gap: spacing.base },
  slot: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.base,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  slotActive: { backgroundColor: colors.primary },
  macroRow: { flexDirection: "row", gap: spacing.base },
});

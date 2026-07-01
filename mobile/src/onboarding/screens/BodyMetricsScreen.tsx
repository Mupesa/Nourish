/**
 * Body Metrics — the step ADDED to resolve the prototype gap: Mifflin-St Jeor
 * needs age, sex, height and weight, which no prototype screen collected.
 * Supports metric and imperial entry; always stores canonical metric.
 */
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ChoiceCard } from "../../components/ChoiceCard";
import { OnboardingLayout } from "../../components/OnboardingLayout";
import { TextField } from "../../components/TextField";
import { AppText } from "../../components/AppText";
import { Button } from "../../components/Button";
import { colors, spacing } from "../../theme/tokens";
import { OnboardingStackParamList } from "../../navigation/types";
import { BiologicalSex } from "../../types/domain";
import { cmFromFeetInches, kgFromLb, num } from "../../utils/units";
import { useOnboarding } from "../OnboardingContext";
import { ONBOARDING_STEPS } from "../labels";

type Props = NativeStackScreenProps<OnboardingStackParamList, "BodyMetrics">;
type UnitSystem = "metric" | "imperial";

export function BodyMetricsScreen({ navigation }: Props) {
  const { setMetrics } = useOnboarding();
  const [units, setUnits] = useState<UnitSystem>("metric");
  const [sex, setSex] = useState<BiologicalSex | null>(null);
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [feet, setFeet] = useState("");
  const [inches, setInches] = useState("");
  const [weight, setWeight] = useState("");

  const computed = useMemo(() => {
    const ageYears = num(age);
    const weightKg =
      units === "metric" ? num(weight) : kgFromLb(num(weight));
    const hCm =
      units === "metric"
        ? num(heightCm)
        : cmFromFeetInches(num(feet) || 0, num(inches) || 0);
    return { ageYears, weightKg, heightCm: hCm };
  }, [age, weight, heightCm, feet, inches, units]);

  const valid =
    !!sex &&
    Number.isFinite(computed.ageYears) &&
    computed.ageYears >= 13 &&
    computed.ageYears <= 120 &&
    Number.isFinite(computed.weightKg) &&
    computed.weightKg >= 30 &&
    computed.weightKg <= 400 &&
    Number.isFinite(computed.heightCm) &&
    computed.heightCm >= 90 &&
    computed.heightCm <= 250;

  const onNext = () => {
    if (!valid || !sex) return;
    setMetrics({
      ageYears: Math.round(computed.ageYears),
      biologicalSex: sex,
      heightCm: computed.heightCm,
      weightKg: computed.weightKg,
    });
    navigation.navigate("Activity");
  };

  return (
    <OnboardingLayout
      step={1}
      totalSteps={ONBOARDING_STEPS}
      title="A little about you"
      subtitle="We use this to calculate your daily calorie target. It stays private."
      onBack={() => navigation.goBack()}
      onNext={onNext}
      nextDisabled={!valid}
    >
      {/* Unit toggle */}
      <View style={styles.toggle}>
        <Button
          label="Metric"
          variant={units === "metric" ? "primary" : "secondary"}
          onPress={() => setUnits("metric")}
          style={styles.toggleBtn}
        />
        <Button
          label="Imperial"
          variant={units === "imperial" ? "primary" : "secondary"}
          onPress={() => setUnits("imperial")}
          style={styles.toggleBtn}
        />
      </View>

      {/* Sex */}
      <AppText variant="label" color={colors.onSurfaceVariant}>
        Biological sex
      </AppText>
      <View style={styles.row}>
        <ChoiceCard
          title="Male"
          icon="male"
          layout="tile"
          selected={sex === "male"}
          onPress={() => setSex("male")}
        />
        <ChoiceCard
          title="Female"
          icon="female"
          layout="tile"
          selected={sex === "female"}
          onPress={() => setSex("female")}
        />
      </View>

      <TextField
        label="Age"
        keyboardType="number-pad"
        value={age}
        onChangeText={setAge}
        suffix="years"
        placeholder="30"
      />

      {/* Height */}
      {units === "metric" ? (
        <TextField
          label="Height"
          keyboardType="number-pad"
          value={heightCm}
          onChangeText={setHeightCm}
          suffix="cm"
          placeholder="175"
        />
      ) : (
        <View style={styles.row}>
          <TextField
            label="Height"
            keyboardType="number-pad"
            value={feet}
            onChangeText={setFeet}
            suffix="ft"
            placeholder="5"
          />
          <TextField
            label=" "
            keyboardType="number-pad"
            value={inches}
            onChangeText={setInches}
            suffix="in"
            placeholder="9"
          />
        </View>
      )}

      <TextField
        label="Weight"
        keyboardType="decimal-pad"
        value={weight}
        onChangeText={setWeight}
        suffix={units === "metric" ? "kg" : "lb"}
        placeholder={units === "metric" ? "70" : "154"}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  toggle: { flexDirection: "row", gap: spacing.sm },
  toggleBtn: { flex: 1 },
  row: { flexDirection: "row", gap: spacing.sm },
});

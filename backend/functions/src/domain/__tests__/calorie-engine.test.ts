import {
  calculateBmr,
  calculateDailyGoal,
  calculateMacroTargets,
  calculateTdee,
  calculateWaterGoal,
  computeNutritionTargets,
  sumMacros,
} from "../calorie-engine";
import { BodyMetrics } from "../types";

// Reference subject used across tests.
// Male, 30y, 180cm, 80kg.
const male: BodyMetrics = {
  ageYears: 30,
  biologicalSex: "male",
  heightCm: 180,
  weightKg: 80,
};

// Female, 30y, 165cm, 65kg.
const female: BodyMetrics = {
  ageYears: 30,
  biologicalSex: "female",
  heightCm: 165,
  weightKg: 65,
};

describe("calculateBmr (Mifflin-St Jeor)", () => {
  it("computes male BMR", () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(calculateBmr(male)).toBe(1780);
  });

  it("computes female BMR", () => {
    // 10*65 + 6.25*165 - 5*30 - 161 = 650 + 1031.25 - 150 - 161 = 1370.25
    expect(calculateBmr(female)).toBeCloseTo(1370.25, 2);
  });

  it("applies the 166 kcal sex offset difference", () => {
    const m = calculateBmr({ ...female, biologicalSex: "male" });
    const f = calculateBmr({ ...female, biologicalSex: "female" });
    expect(m - f).toBe(166); // 5 - (-161)
  });
});

describe("calculateTdee", () => {
  it("multiplies BMR by the activity factor", () => {
    expect(calculateTdee(1780, "sedentary")).toBeCloseTo(2136, 5);
    expect(calculateTdee(1780, "moderately_active")).toBeCloseTo(2759, 0);
    expect(calculateTdee(1780, "very_active")).toBeCloseTo(3070.5, 1);
  });
});

describe("calculateDailyGoal", () => {
  it("subtracts 500 for weight loss", () => {
    expect(calculateDailyGoal(2500, "lose_weight")).toBe(2000);
  });

  it("adds 300 for muscle gain", () => {
    expect(calculateDailyGoal(2500, "gain_muscle")).toBe(2800);
  });

  it("leaves maintenance and healthy habits unchanged", () => {
    expect(calculateDailyGoal(2500, "maintain_tone")).toBe(2500);
    expect(calculateDailyGoal(2500, "healthy_habits")).toBe(2500);
  });

  it("never returns below the safety floor of 1200", () => {
    expect(calculateDailyGoal(1500, "lose_weight")).toBe(1200);
  });
});

describe("calculateMacroTargets", () => {
  it("splits calories per goal ratio and converts to grams", () => {
    // lose_weight @ 2000 kcal: P30%/C40%/F30%
    // protein 600kcal/4=150g, carbs 800/4=200g, fat 600/9=66.67->67g
    expect(calculateMacroTargets(2000, "lose_weight")).toEqual({
      proteinG: 150,
      carbsG: 200,
      fatG: 67,
    });
  });
});

describe("calculateWaterGoal", () => {
  it("scales with weight, rounded to nearest 100ml", () => {
    expect(calculateWaterGoal(80)).toBe(2800); // 80*35=2800
    expect(calculateWaterGoal(65)).toBe(2300); // 65*35=2275 -> 2300
  });

  it("clamps to the safe range", () => {
    expect(calculateWaterGoal(40)).toBe(2000); // 1400 -> min 2000
    expect(calculateWaterGoal(200)).toBe(4000); // 7000 -> max 4000
  });

  it("falls back to default on bad input", () => {
    expect(calculateWaterGoal(0)).toBe(2500);
    expect(calculateWaterGoal(NaN)).toBe(2500);
  });
});

describe("computeNutritionTargets (full pipeline)", () => {
  it("produces a coherent target set for the male subject (moderately active, lose weight)", () => {
    const t = computeNutritionTargets(male, "moderately_active", "lose_weight");
    expect(t.bmrKcal).toBe(1780);
    expect(t.tdeeKcal).toBe(2759); // round(1780*1.55=2759)
    expect(t.dailyGoalKcal).toBe(2259); // 2759-500
    expect(t.waterGoalMl).toBe(2800);
    // macros sum should roughly reconstruct the calorie goal
    const reconstructed =
      t.macroTargets.proteinG * 4 +
      t.macroTargets.carbsG * 4 +
      t.macroTargets.fatG * 9;
    expect(Math.abs(reconstructed - t.dailyGoalKcal)).toBeLessThan(15);
  });
});

describe("sumMacros", () => {
  it("totals a list of macro objects", () => {
    expect(
      sumMacros([
        { proteinG: 10, carbsG: 20, fatG: 5 },
        { proteinG: 30, carbsG: 40, fatG: 15 },
      ]),
    ).toEqual({ proteinG: 40, carbsG: 60, fatG: 20 });
  });

  it("returns zeroes for an empty list", () => {
    expect(sumMacros([])).toEqual({ proteinG: 0, carbsG: 0, fatG: 0 });
  });
});

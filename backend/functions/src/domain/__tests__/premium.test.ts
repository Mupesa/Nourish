import { decideRecipeView, FREE_RECIPE_VIEW_CAP } from "../premium";

/** A list of N distinct unlock keys. */
const keys = (n: number) => Array.from({ length: n }, (_, i) => `local:r${i}`);

describe("decideRecipeView — premium", () => {
  it("always allows, never records, and reports the full cap", () => {
    const d = decideRecipeView(true, keys(FREE_RECIPE_VIEW_CAP), "spoon:999");
    expect(d).toEqual({
      allowed: true,
      record: false,
      freeViewsRemaining: FREE_RECIPE_VIEW_CAP,
    });
  });
});

describe("decideRecipeView — free, under the cap", () => {
  it("unlocks a brand-new recipe and records it", () => {
    const d = decideRecipeView(false, [], "local:r1");
    expect(d).toEqual({
      allowed: true,
      record: true,
      freeViewsRemaining: FREE_RECIPE_VIEW_CAP - 1,
    });
  });

  it("decrements remaining as more distinct recipes are opened", () => {
    const d = decideRecipeView(false, keys(5), "local:new");
    expect(d.allowed).toBe(true);
    expect(d.record).toBe(true);
    expect(d.freeViewsRemaining).toBe(FREE_RECIPE_VIEW_CAP - 6);
  });

  it("re-opening an already-unlocked recipe is free and not recorded", () => {
    const seen = keys(5);
    const d = decideRecipeView(false, seen, seen[2]);
    expect(d.allowed).toBe(true);
    expect(d.record).toBe(false);
    expect(d.freeViewsRemaining).toBe(FREE_RECIPE_VIEW_CAP - 5);
  });
});

describe("decideRecipeView — free, at the cap", () => {
  it("allows re-opening one of the capped recipes (no new unlock)", () => {
    const seen = keys(FREE_RECIPE_VIEW_CAP);
    const d = decideRecipeView(false, seen, seen[0]);
    expect(d).toEqual({ allowed: true, record: false, freeViewsRemaining: 0 });
  });

  it("blocks the (cap+1)-th distinct recipe", () => {
    const seen = keys(FREE_RECIPE_VIEW_CAP);
    const d = decideRecipeView(false, seen, "local:one-too-many");
    expect(d).toEqual({ allowed: false, record: false, freeViewsRemaining: 0 });
  });
});

describe("decideRecipeView — custom cap", () => {
  it("honours a smaller cap", () => {
    expect(decideRecipeView(false, ["a", "b"], "c", 2)).toEqual({
      allowed: false,
      record: false,
      freeViewsRemaining: 0,
    });
    expect(decideRecipeView(false, ["a"], "b", 2)).toEqual({
      allowed: true,
      record: true,
      freeViewsRemaining: 0,
    });
  });
});

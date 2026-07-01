import { applyCook, liveCurrent, previousDay } from "../streak";
import { FriendStreak } from "../types";

const ZERO: FriendStreak = { current: 0, longest: 0, lastCookedDate: null };

describe("previousDay", () => {
  it("steps back one calendar day", () => {
    expect(previousDay("2026-06-24")).toBe("2026-06-23");
  });
  it("handles month boundaries", () => {
    expect(previousDay("2026-07-01")).toBe("2026-06-30");
  });
  it("handles year boundaries", () => {
    expect(previousDay("2026-01-01")).toBe("2025-12-31");
  });
});

describe("applyCook", () => {
  it("starts a streak at 1 from zero", () => {
    expect(applyCook(ZERO, "2026-06-24")).toEqual({
      current: 1,
      longest: 1,
      lastCookedDate: "2026-06-24",
    });
  });

  it("increments on a consecutive day and tracks longest", () => {
    const day1 = applyCook(ZERO, "2026-06-23");
    const day2 = applyCook(day1, "2026-06-24");
    expect(day2).toEqual({
      current: 2,
      longest: 2,
      lastCookedDate: "2026-06-24",
    });
  });

  it("is a no-op when logging the same day again", () => {
    const day1 = applyCook(ZERO, "2026-06-24");
    expect(applyCook(day1, "2026-06-24")).toEqual(day1);
  });

  it("ignores backfilling an older day", () => {
    const day = applyCook(ZERO, "2026-06-24");
    expect(applyCook(day, "2026-06-20")).toEqual(day);
  });

  it("resets to 1 after a gap but keeps longest", () => {
    let s = applyCook(ZERO, "2026-06-20");
    s = applyCook(s, "2026-06-21");
    s = applyCook(s, "2026-06-22"); // current 3
    const afterGap = applyCook(s, "2026-06-25"); // skipped 23,24
    expect(afterGap.current).toBe(1);
    expect(afterGap.longest).toBe(3);
    expect(afterGap.lastCookedDate).toBe("2026-06-25");
  });
});

describe("liveCurrent", () => {
  const s: FriendStreak = {
    current: 5,
    longest: 7,
    lastCookedDate: "2026-06-24",
  };
  it("shows the streak when last cook was today", () => {
    expect(liveCurrent(s, "2026-06-24")).toBe(5);
  });
  it("shows the streak when last cook was yesterday (still alive)", () => {
    expect(liveCurrent(s, "2026-06-25")).toBe(5);
  });
  it("shows 0 once the streak has lapsed", () => {
    expect(liveCurrent(s, "2026-06-26")).toBe(0);
  });
  it("shows 0 when there is no streak", () => {
    expect(liveCurrent(ZERO, "2026-06-24")).toBe(0);
  });
});

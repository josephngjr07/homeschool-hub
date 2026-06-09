import { describe, expect, it } from "vitest";
import { ENCOURAGEMENTS, encouragementForWeek } from "@/lib/encouragement";
import { startOfWeek } from "@/lib/date";

describe("encouragement messages", () => {
  it("returns a known message, deterministic for a given week-start", () => {
    const weekStart = startOfWeek(new Date("2026-06-10")); // Monday 2026-06-08

    const a = encouragementForWeek(weekStart);
    expect(ENCOURAGEMENTS).toContain(a as (typeof ENCOURAGEMENTS)[number]);
    // Same week-start always yields the same line — no flicker on reload.
    expect(encouragementForWeek(weekStart)).toBe(a);
  });

  it("varies from one week to the next", () => {
    const week1 = startOfWeek(new Date("2026-06-08"));
    const week2 = startOfWeek(new Date("2026-06-15"));
    expect(encouragementForWeek(week1)).not.toBe(encouragementForWeek(week2));
  });
});

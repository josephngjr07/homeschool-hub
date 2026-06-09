import { describe, expect, it } from "vitest";
import {
  addDays,
  startOfWeek,
  weekDates,
  isSameDay,
  isBefore,
  toDateInputValue,
} from "@/lib/date";

const D = (s: string) => new Date(s);

describe("date helpers", () => {
  it("addDays moves by whole UTC days", () => {
    expect(toDateInputValue(addDays(D("2026-06-09"), 1))).toBe("2026-06-10");
    expect(toDateInputValue(addDays(D("2026-06-09"), -2))).toBe("2026-06-07");
    expect(toDateInputValue(addDays(D("2026-06-30"), 1))).toBe("2026-07-01");
  });

  it("startOfWeek returns the Monday of that week", () => {
    // 2026-06-09 is a Tuesday; its Monday is 2026-06-08.
    expect(toDateInputValue(startOfWeek(D("2026-06-09")))).toBe("2026-06-08");
    // A Monday maps to itself.
    expect(toDateInputValue(startOfWeek(D("2026-06-08")))).toBe("2026-06-08");
    // A Sunday maps back to the previous Monday.
    expect(toDateInputValue(startOfWeek(D("2026-06-14")))).toBe("2026-06-08");
  });

  it("weekDates returns 7 consecutive days starting at the Monday", () => {
    const days = weekDates(startOfWeek(D("2026-06-09")));
    expect(days).toHaveLength(7);
    expect(toDateInputValue(days[0])).toBe("2026-06-08");
    expect(toDateInputValue(days[6])).toBe("2026-06-14");
  });

  it("isSameDay / isBefore compare calendar days", () => {
    expect(isSameDay(D("2026-06-09"), D("2026-06-09"))).toBe(true);
    expect(isSameDay(D("2026-06-09"), D("2026-06-10"))).toBe(false);
    expect(isBefore(D("2026-06-08"), D("2026-06-09"))).toBe(true);
    expect(isBefore(D("2026-06-09"), D("2026-06-08"))).toBe(false);
  });
});

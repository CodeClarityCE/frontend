import { describe, expect, it, vi } from "vitest";

import { formatShortDate, getWeekRange } from "./dateUtils";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

const date = "2025-01-10T15:30:00";

describe("formatShortDate", () => {
  it("shows the short month, day and year", () => {
    expect(formatShortDate(date)).toBe("Jan 10, 2025");
    expect(formatShortDate(new Date(date))).toBe("Jan 10, 2025");
  });

  it("can add the time or leave out the year", () => {
    expect(formatShortDate(date, { time: true })).toBe("Jan 10, 2025, 3:30 PM");
    expect(formatShortDate(date, { year: false })).toBe("Jan 10");
  });

  it("shows the fallback for a missing or invalid date", () => {
    expect(formatShortDate(null)).toBe("");
    expect(formatShortDate(undefined, { fallback: "Not set" })).toBe("Not set");
    expect(formatShortDate("not a date", { fallback: "-" })).toBe("-");
  });
});

describe("getWeekRange", () => {
  const range = (week: number, year: number): string[] => {
    const { start, end } = getWeekRange(week, year);
    return [start.toDateString(), end.toDateString()];
  };

  it("returns the Monday to Sunday of an ISO week", () => {
    expect(range(42, 2026)).toEqual(["Mon Oct 12 2026", "Sun Oct 18 2026"]);
  });

  it("starts week 1 in the previous year when January 1 is late in the week", () => {
    expect(range(1, 2026)).toEqual(["Mon Dec 29 2025", "Sun Jan 04 2026"]);
  });

  it("starts week 1 on January 1 when that is a Monday", () => {
    expect(range(1, 2024)).toEqual(["Mon Jan 01 2024", "Sun Jan 07 2024"]);
  });

  it("handles week 53", () => {
    expect(range(53, 2020)).toEqual(["Mon Dec 28 2020", "Sun Jan 03 2021"]);
  });
});

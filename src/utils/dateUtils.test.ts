import { describe, expect, it } from "vitest";

import { formatShortDate } from "./dateUtils";

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

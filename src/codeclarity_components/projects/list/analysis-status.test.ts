import { describe, expect, it } from "vitest";

import type { AnalysisStage } from "@/codeclarity_components/analyses/analysis.entity";

import { stepDuration } from "./analysis-status";

// A step that started at 09:00 and ran for the given milliseconds.
function stageTaking(ms: number): AnalysisStage {
  const start = new Date("2026-11-01T09:00:00Z");
  return {
    Started_on: start,
    Ended_on: new Date(start.getTime() + ms),
  } as unknown as AnalysisStage;
}

describe("stepDuration", () => {
  it("is empty until the step has ended", () => {
    expect(stepDuration({} as AnalysisStage)).toBe("");
  });

  it("shows short steps in milliseconds or seconds", () => {
    expect(stepDuration(stageTaking(250))).toBe("250 ms");
    expect(stepDuration(stageTaking(4_000))).toBe("4.0 s");
  });

  it("shows steps over a minute in minutes and seconds", () => {
    expect(stepDuration(stageTaking(60_000))).toBe("1 min");
    expect(stepDuration(stageTaking(125_000))).toBe("2 min 5 s");
    expect(stepDuration(stageTaking(3_725_000))).toBe("62 min 5 s");
  });
});

import { describe, expect, it, vi } from "vitest";

import {
  Analysis,
  type AnalysisStage,
} from "@/codeclarity_components/analyses/analysis.entity";
import { Entity } from "@/utils/api/BaseEntity";

import {
  analysisStatus,
  isActive,
  isFailed,
  isFinished,
  isRunning,
  stepDuration,
  stepStatus,
} from "./analysis-status";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

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

describe("a cancelled analysis", () => {
  // As the API sends it after a cancel.
  const payload: unknown = {
    id: "a-1",
    created_on: "2026-11-01T09:00:00Z",
    analyzer: { id: "an-1", name: "Default analyzer" },
    status: "cancelled",
    steps: [],
    branch: "main",
    next_scheduled_run: "2026-11-01T09:00:00Z",
  };
  const cancelled = Entity.unMarshal<Analysis>(
    payload as Analysis,
    Analysis,
    false,
  );

  it("passes validation, so lists keep it", () => {
    expect(Entity.validateMany([cancelled])).toHaveLength(1);
  });

  it("is shown as Cancelled, neutral and not busy", () => {
    expect(analysisStatus(cancelled)).toEqual({
      tone: "neutral",
      label: "Cancelled",
      busy: false,
    });
  });

  it("is over, so the project list stops polling for it", () => {
    expect(isActive(cancelled)).toBe(false);
    expect(isRunning(cancelled)).toBe(false);
    expect(isFinished(cancelled)).toBe(false);
    expect(isFailed(cancelled)).toBe(false);
  });

  it("names a cancelled step Cancelled", () => {
    expect(
      stepStatus({ Status: "cancelled" } as unknown as AnalysisStage),
    ).toEqual({ tone: "neutral", label: "Cancelled", busy: false });
  });
});

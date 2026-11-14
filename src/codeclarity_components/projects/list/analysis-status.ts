import type { StatusTone } from "@/base_components/page";
import {
  type Analysis,
  type AnalysisStage,
  AnalysisStatus,
} from "@/codeclarity_components/analyses/analysis.entity";

export interface StatusView {
  tone: StatusTone;
  label: string;
  busy: boolean;
}

const FINISHED = new Set([AnalysisStatus.COMPLETED, AnalysisStatus.FINISHED]);
const FAILED = new Set([AnalysisStatus.FAILED, AnalysisStatus.FAILURE]);
const RUNNING = new Set([
  AnalysisStatus.STARTED,
  AnalysisStatus.ONGOING,
  AnalysisStatus.UPDATING_DB,
]);

export function isFinished(analysis: Analysis): boolean {
  return FINISHED.has(analysis.status);
}

export function isFailed(analysis: Analysis): boolean {
  return FAILED.has(analysis.status);
}

// Still being worked on, so the list keeps refreshing.
export function isActive(analysis: Analysis): boolean {
  return !isFinished(analysis) && !isFailed(analysis);
}

export function isRunning(analysis: Analysis): boolean {
  return RUNNING.has(analysis.status);
}

// An analysis status in words with its tone.
export function analysisStatus(analysis: Analysis): StatusView {
  if (isFinished(analysis))
    return { tone: "success", label: "Completed", busy: false };
  if (isFailed(analysis))
    return { tone: "danger", label: "Failed", busy: false };
  if (isRunning(analysis))
    return { tone: "neutral", label: "Running", busy: true };
  return { tone: "neutral", label: "Queued", busy: false };
}

// A plugin step status in words with its tone.
export function stepStatus(stage: AnalysisStage): StatusView {
  switch (stage.Status) {
    case AnalysisStatus.SUCCESS:
      return { tone: "success", label: "Done", busy: false };
    case AnalysisStatus.SKIPPED:
      return { tone: "neutral", label: "Skipped", busy: false };
    case AnalysisStatus.FAILED:
    case AnalysisStatus.FAILURE:
      return { tone: "danger", label: "Failed", busy: false };
    case AnalysisStatus.STARTED:
      return { tone: "neutral", label: "Running", busy: true };
    default:
      return { tone: "neutral", label: "Waiting", busy: false };
  }
}

export function isScheduled(analysis: Analysis): boolean {
  return !!analysis.schedule_type && analysis.schedule_type !== "once";
}

export function scheduleLabel(analysis: Analysis): string {
  if (analysis.schedule_type === "daily") return "Daily";
  if (analysis.schedule_type === "weekly") return "Weekly";
  return "Once";
}

// Newest first.
export function byNewest(analyses: Analysis[] | undefined): Analysis[] {
  return [...(analyses ?? [])].sort(
    (a, b) =>
      new Date(b.created_on).getTime() - new Date(a.created_on).getTime(),
  );
}

export function formatDateTime(date: Date | string | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDay(date: Date | string | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// How long a step took, from its start and end.
export function stepDuration(stage: AnalysisStage): string {
  if (!stage.Started_on || !stage.Ended_on) return "";
  const ms =
    new Date(stage.Ended_on).getTime() - new Date(stage.Started_on).getTime();
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.round(ms / 1000)} s`;
}

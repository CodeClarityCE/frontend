import type { InjectionKey, Ref } from "vue";

import type { GridCoverageRow } from "../experiment.entity";

import { plural } from "./chart-format";

/** What a figure's generated caption states, built from the results. */
export interface FigureCaption {
  description: string;
  /** Sample size text, e.g. "n = 4 exposures" */
  n: string;
  /** Left out of this figure, already counted */
  exclusions?: string[];
  /** The figure shows the as-of view, so it must state the approximation */
  asOf?: boolean;
}

/** Snapshot states of the grid, provided by the results page. */
export const SNAPSHOT_COVERAGE: InjectionKey<Ref<GridCoverageRow[]>> =
  Symbol("snapshot-coverage");

const AS_OF_APPROXIMATION =
  "The as-of view approximates what could be known at each grid date by dropping advisories published after it; an advisory later withdrawn, re-scored or with a widened affected range shows in its current form, not as it read on the grid date.";

/** One exclusion phrase, or none when the count is zero. */
export function excluded(
  n: number,
  word: string,
  many: string,
  rest: string,
): string[] {
  return n > 0 ? [`${plural(n, word, many)} ${rest}`] : [];
}

function snapshotExclusions(coverage: GridCoverageRow[]): string[] {
  const total = (key: "failed" | "skipped" | "pending"): number =>
    coverage.reduce((sum, row) => sum + row[key], 0);
  return [
    ...excluded(total("failed"), "snapshot", "snapshots", "failed"),
    ...excluded(total("skipped"), "snapshot", "snapshots", "skipped"),
    ...excluded(total("pending"), "snapshot", "snapshots", "pending"),
  ];
}

/** Writes the caption with its sample size, exclusions and caveats. */
export function captionText(
  caption: FigureCaption,
  coverage: GridCoverageRow[],
): string {
  const exclusions = [
    ...(caption.exclusions ?? []),
    ...snapshotExclusions(coverage),
  ];
  const excludedText = exclusions.length
    ? `Excluded: ${exclusions.join("; ")}.`
    : "No exclusions.";
  return [
    `${caption.description}.`,
    `${caption.n}.`,
    excludedText,
    ...(caption.asOf ? [AS_OF_APPROXIMATION] : []),
  ].join(" ");
}

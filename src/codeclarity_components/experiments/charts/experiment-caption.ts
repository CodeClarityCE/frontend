import { plural } from "@/base_components/charts/chart-format";

import type { GridCoverageRow } from "../experiment.entity";

/** The caveat every as-of chart states. */
export const AS_OF_APPROXIMATION =
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

/** A HEAD-only experiment has no grid to report snapshot states for. */
export function gridCoverageOf(rows: GridCoverageRow[]): GridCoverageRow[] {
  return rows.some((row) => row.grid_date !== null) ? rows : [];
}

/** The failed, skipped and pending snapshots every chart leaves out. */
export function snapshotExclusions(coverage: GridCoverageRow[]): string[] {
  const total = (key: "failed" | "skipped" | "pending"): number =>
    coverage.reduce((sum, row) => sum + row[key], 0);
  return [
    ...excluded(total("failed"), "snapshot", "snapshots", "failed"),
    ...excluded(total("skipped"), "snapshot", "snapshots", "skipped"),
    ...excluded(total("pending"), "snapshot", "snapshots", "pending"),
  ];
}

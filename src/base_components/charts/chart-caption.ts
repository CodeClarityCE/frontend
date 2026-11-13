import type { InjectionKey, Ref } from "vue";

/** What a chart's generated caption states, built from its data. */
export interface ChartCaption {
  description: string;
  /** Sample size text, e.g. "n = 4 exposures" */
  n: string;
  /** Left out of this chart, already counted */
  exclusions?: string[];
  /** Caveats stated after the exclusions */
  notes?: string[];
  /** Drawn from results not yet published; the export is marked as a draft */
  unpublished?: boolean;
  /** The metric version of the Published results this chart is tied to */
  metricVersion?: number;
}

/** The status a chart states on its face. */
export type ChartMarks = Pick<ChartCaption, "unpublished" | "metricVersion">;

/** The status of the results being viewed, provided by the page. */
export const RESULT_MARKS: InjectionKey<Ref<ChartMarks>> =
  Symbol("result-marks");

/** Exclusions every chart on the page states, provided by the page. */
export const PAGE_EXCLUSIONS: InjectionKey<Ref<string[]>> =
  Symbol("page-exclusions");

/** The status line of a chart: unpublished, tied to a version, or neither. */
export function chartMarkText(marks: ChartMarks): string | null {
  const parts = [
    ...(marks.unpublished ? ["Unpublished results, not for citation"] : []),
    ...(marks.metricVersion === undefined
      ? []
      : [`Metric version ${marks.metricVersion}`]),
  ];
  return parts.length > 0 ? parts.join(". ") : null;
}

/** Writes the caption with its sample size, exclusions and caveats. */
export function captionText(
  caption: ChartCaption,
  pageExclusions: string[] = [],
): string {
  const exclusions = [...(caption.exclusions ?? []), ...pageExclusions];
  const excludedText = exclusions.length
    ? `Excluded: ${exclusions.join("; ")}.`
    : "No exclusions.";
  const mark = chartMarkText(caption);
  return [
    ...(mark ? [`${mark}.`] : []),
    `${caption.description}.`,
    `${caption.n}.`,
    excludedText,
    ...(caption.notes ?? []),
  ].join(" ");
}

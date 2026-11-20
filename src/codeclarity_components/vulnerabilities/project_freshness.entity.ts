/** One project's current analysis and whether it is past the freshness threshold. */
export interface ProjectFreshness {
  project_id: string;
  project_name: string;
  analysis_id: string;
  analyzed_on: string;
  /** True when the current analysis is older than the threshold */
  stale: boolean;
}

/** Freshness of every project of the organization that has a current analysis. */
export interface OrganizationFreshness {
  threshold_days: number;
  projects: ProjectFreshness[];
}

/** The projects whose current analysis predates a vulnerability's publication. */
export interface VulnerabilityNotYetChecked {
  vulnerability_id: string;
  /** Earliest publication in any knowledge source; null when unknown */
  published: string | null;
  projects: ProjectFreshness[];
}

const DAY_MS = 86_400_000;

/** Whole days since `date`, such as "Analysed 3 days ago". */
export function analysedAgo(date: string, now = Date.now()): string {
  const days = Math.max(
    0,
    Math.floor((now - new Date(date).getTime()) / DAY_MS),
  );
  if (days === 0) return "Analysed today";
  return `Analysed ${days} day${days === 1 ? "" : "s"} ago`;
}

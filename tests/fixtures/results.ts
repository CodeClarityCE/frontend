// API answers shared by the result, vulnerability and SBOM unit tests.
import { org } from "../real-app";

export const PROJECT_ID = "p-1";
export const ANALYSIS_ID = "a-1";

// The API path of one analysis of the signed-in user's default org.
export const analysisPath = `/org/${org.id}/projects/${PROJECT_ID}/analysis/${ANALYSIS_ID}`;

// A paginated list answer, as the API sends it.
export function paginated(
  data: unknown[],
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    data,
    page: 0,
    entry_count: data.length,
    entries_per_page: Math.max(data.length, 1),
    total_entries: data.length,
    total_pages: 1,
    matching_count: data.length,
    filter_count: {},
    status_code: 200,
    status: "success",
    ...extra,
  };
}

import { APIErrors } from "@/utils/api/ApiErrors";
import type { BusinessLogicError, HttpError } from "@/utils/api/BaseRepository";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const NOT_FOUND_CODES: string[] = [
  APIErrors.EntityNotFound,
  APIErrors.NotAuthorized,
  APIErrors.ValidationFailed,
];

// Whether an id has the shape the API gives project and analysis ids.
export function isWellFormedId(id: string): boolean {
  return UUID.test(id);
}

// Whether a failed request means the thing asked for does not exist.
// The API answers a malformed id with a server error, so ids are checked too.
export function isNotFound(error: unknown, ids: string[] = []): boolean {
  if (ids.some((id) => !isWellFormedId(id))) return true;
  if (typeof error !== "object" || error === null) return false;
  // Read by shape: BusinessLogicError has an error code, HttpError a status.
  const { error_code } = error as Partial<BusinessLogicError>;
  if (typeof error_code === "string")
    return NOT_FOUND_CODES.includes(error_code);
  const { code } = error as Partial<HttpError>;
  return code === 400 || code === 404;
}

// Where a "not found" page leads back to: the analysis results when the ids look valid.
export function resultsRoute(
  analysisID: string,
  projectID: string,
  runIndex?: number | null,
): Record<string, unknown> | null {
  if (!isWellFormedId(analysisID) || !isWellFormedId(projectID)) return null;
  const query: Record<string, string> = {
    analysis_id: analysisID,
    project_id: projectID,
  };
  if (runIndex !== null && runIndex !== undefined)
    query.run_index = String(runIndex);
  return { name: "results", query };
}

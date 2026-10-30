import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";

/** How many project imports a bulk import keeps in flight at once. */
export const IMPORT_CONCURRENCY = 4;

/**
 * Get error message from import error
 */
export function getImportErrorMessage(err: unknown): string {
  if (!(err instanceof BusinessLogicError)) {
    return "An error occured during the project import.";
  }

  if (err.error_code === APIErrors.AlreadyExists) {
    return "Already imported";
  }

  if (
    err.error_code === APIErrors.InternalError ||
    err.error_code === APIErrors.EntityNotFound
  ) {
    return "An error occured during the project import.";
  }

  if (err.error_code === APIErrors.NotAuthorized) {
    return "You do not have permission to import this repository";
  }

  if (
    err.error_code === APIErrors.FailedToRetrieveReposFromProvider ||
    err.error_code === APIErrors.IntegrationInvalidToken
  ) {
    return "The repository could not be resolved through the integration (rate limit or invalid token).";
  }

  return "An error occured during the project import.";
}

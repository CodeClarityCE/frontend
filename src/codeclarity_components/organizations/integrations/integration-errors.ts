import { APIErrors } from "@/utils/api/ApiErrors";
import {
  BusinessLogicError,
  ValidationError,
} from "@/utils/api/BaseRepository";

/** Explains why adding or updating a token based integration failed. */
export function tokenIntegrationError(
  err: unknown,
  options: { provider: string; scopes: string; updating: boolean },
): string {
  if (err instanceof ValidationError) {
    return err.toMessage("Invalid form:");
  }
  if (!(err instanceof BusinessLogicError)) {
    return "An error occurred while processing the request.";
  }
  switch (err.error_code) {
    case APIErrors.IntegrationTokenExpired:
    case APIErrors.IntegrationInvalidToken:
    case APIErrors.IntegrationWrongTokenType:
      return "Your token appears invalid or expired.";
    case APIErrors.IntegrationIntegrationTokenMissingPermissions:
      return `Your token does not have the required permissions. Select the ${options.scopes} scopes.`;
    case APIErrors.DuplicateIntegration:
      return `You already have an integration with ${options.provider} for this host.`;
    case APIErrors.EntityNotFound:
      return options.updating
        ? "The integration you are trying to update does not exist."
        : "This should not have happened. Please try again.";
    case APIErrors.NotAuthorized:
      return "You are not authorized to perform this action.";
    default:
      return "An error occurred while processing the request.";
  }
}

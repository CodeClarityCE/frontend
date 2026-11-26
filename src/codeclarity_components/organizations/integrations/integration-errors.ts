import { APIErrors } from "@/utils/api/ApiErrors";
import {
  BusinessLogicError,
  ValidationError,
} from "@/utils/api/BaseRepository";

/** Explains why the API refused to reach a GitLab instance, or undefined for any other error code. */
export function instanceError(code: string | undefined): string | undefined {
  switch (code) {
    case APIErrors.IntegrationInstanceUrlNotAllowed:
      return "This GitLab is on a private network or uses http. Ask your CodeClarity operator to allow its host (GITLAB_ALLOWED_PRIVATE_HOSTS).";
    case APIErrors.IntegrationInstanceUnreachable:
      return "The GitLab host name could not be resolved. Check the instance URL.";
    default:
      return undefined;
  }
}

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
  const instance = instanceError(err.error_code);
  if (instance) return instance;
  switch (err.error_code) {
    case APIErrors.IntegrationTokenExpired:
    case APIErrors.IntegrationInvalidToken:
    case APIErrors.IntegrationWrongTokenType:
      return "Your token appears invalid or expired.";
    case APIErrors.IntegrationIntegrationTokenMissingPermissions:
      return `Your token does not have the required permissions. Select the ${options.scopes} scopes.`;
    case APIErrors.IntegrationInstanceUrlChanged:
      return `The instance cannot change. Delete the integration and connect ${options.provider} again.`;
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

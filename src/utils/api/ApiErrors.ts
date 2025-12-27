export const APIErrors = {
  ValidationFailed: "ValidationFailed",
  NotAuthenticated: "NotAuthenticated",
  NotAuthorized: "NotAuthorized",
  Unsupported: "Unsupported",
  UnknownWorkspace: "UnknownWorkspace",
  PluginFailed: "PluginFailed",
  PluginResultNotAvailable: "PluginResultNotAvailable",
  CannotRemoveDefaultPolicy: "CannotRemoveDefaultPolicy",
  CannotUnDefaultDefaultPolicy: "CannotUnDefaultDefaultPolicy",
  RepositoryCannotBeFound: "RepositoryCannotBeFound",
  PasswordsDoNotMatch: "PasswordsDoNotMatch",
  IntegrationNotSupported: "IntegrationNotSupported",
  IntegrationDoesNotExist: "IntegrationDoesNotExist",
  IntegrationTokenExpired: "IntegrationTokenExpired",
  IntegrationTokenRefreshFailed: "IntegrationTokenRefreshFailed",
  DuplicateIntegration: "DuplicateIntegration",
  ProjectDoesNotExist: "ProjectDoesNotExist",
  AnalyzerDoesNotExist: "AnalyzerDoesNotExist",
  AnaylzerMissingConfigAttribute: "AnaylzerMissingConfigAttribute",
  IntegrationWrongTokenType: "IntegrationWrongTokenType",
  FailedToRetrieveReposFromProvider: "FailedToRetrieveReposFromProvider",
  IntegrationTokenRetrievalFailed: "IntegrationTokenRetrievalFailed",
  IntegrationInvalidToken: "IntegrationInvalidToken",
  RegistrationNotVerified: "RegistrationNotVerified",
  CannotPerformActionOnSocialAccount: "CannotPerformActionOnSocialAccount",
  SetupAlreadyDone: "SetupAlreadyDone",
  CannotPerformActionOnNormalAccount: "CannotPerformActionOnNormalAccount",
  PersonalOrgCannotBeModified: "PersonalOrgCannotBeModified",
  InvitationOrgAlreadyExists: "InvitationOrgAlreadyExists",
  FailedToCreateApiKey: "FailedToCreateApiKey",
  FailedToAuthenticateSocialAccount: "FailedToAuthenticateSocialAccount",
  WrongCredentials: "WrongCredentials",
  InvitationExpired: "InvitationExpired",
  HandleAlreadyExists: "HandleAlreadyExists",
  EmailAlreadyExists: "EmailAlreadyExists",
  AlreadyExists: "AlreadyExists",
  UserDoesNotExist: "UserDoesNotExist",
  AccountRegistrationVerificationTokenInvalidOrExpired:
    "AccountRegistrationVerificationTokenInvalidOrExpired",
  UnsubscriptionTokenInvalidOrExpired: "UnsubscriptionTokenInvalidOrExpired",
  PasswordResetTokenInvalidOrExpired: "PasswordResetTokenInvalidOrExpired",
  NotAMember: "NotAMember",
  CannotLeaveAsLastOwner: "CannotLeaveAsLastOwner",
  CannotRevokeOwnMembership: "CannotRevokeOwnMembership",
  InvitationInvalidOrExpired: "InvitationInvalidOrExpired",
  EntityNotFound: "EntityNotFound",
  IntegrationIntegrationTokenMissingPermissions:
    "IntegrationIntegrationTokenMissingPermissions",
  FailedToSendAccountRegistrationVerificationEmail:
    "FailedToSendAccountRegistrationVerificationEmail",
  FailedToSendPasswordResetEmail: "FailedToSendPasswordResetEmail",
  FailedToSendOrganizationInviteEmail: "FailedToSendOrganizationInviteEmail",
  InternalError: "InternalError",
} as const;

export type APIErrorType = (typeof APIErrors)[keyof typeof APIErrors];

export class MalformedResponse extends Error {
  constructor() {
    // Call parent constructor with error message
    super("Resource response from the API was malformed");
  }
}

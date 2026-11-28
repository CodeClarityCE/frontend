import { SessionExpiry } from "@/codeclarity_components/authentication/session_expiry.entity";

import { Entity } from "../../utils/api/BaseEntity";
import {
  type AuthRepoMethodGetRequestOptions,
  BaseRepository,
  type EmptyPostData,
  type RepoMethodOptions,
  type RepoMethodPostRequestOptions,
} from "../../utils/api/BaseRepository";
import { CreatedResponse } from "../../utils/api/responses/CreatedResponse";
import type { DataResponse } from "../../utils/api/responses/DataResponse";
import { NoDataResponse } from "../../utils/api/responses/NoDataResponse";

import type { AuthenticateBody } from "./authenticate.http";
import { AuthenticatedUser } from "./authenticated_user.entity";
import type { PasswordResetBody } from "./password_reset.http";
import type { PasswordResetRequestBody } from "./password_reset_request.http";
import type { RegisterBody } from "./register.http";

export interface AuthenticateRequestOptions extends RepoMethodPostRequestOptions<AuthenticateBody> {}
export interface SessionRequestOptions extends RepoMethodOptions {}
export interface GetAuthenticatedUserRequestOptions extends AuthRepoMethodGetRequestOptions {
  validate?: boolean;
}
export interface RegisterRequestOptions extends RepoMethodPostRequestOptions<RegisterBody> {}
export interface PasswordResetRequestOptions extends RepoMethodPostRequestOptions<PasswordResetRequestBody> {}
export interface PasswordResetOptions extends RepoMethodPostRequestOptions<PasswordResetBody> {}

export class AuthRepository extends BaseRepository {
  /** Signs in; the API sets the tokens as HttpOnly cookies and answers with their expiry. */
  async authenticate(
    options: AuthenticateRequestOptions,
  ): Promise<SessionExpiry> {
    const RELATIVE_URL = `/auth/authenticate`;

    const response = await this.postRequest<
      DataResponse<SessionExpiry>,
      AuthenticateBody
    >({
      data: options.data,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<SessionExpiry>(response.data, SessionExpiry);
  }

  async register(options: RegisterRequestOptions): Promise<CreatedResponse> {
    const RELATIVE_URL = `/auth/register`;

    const response = await this.postRequest<CreatedResponse, RegisterBody>({
      data: options.data,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<CreatedResponse>(response, CreatedResponse);
  }

  /** Trades the refresh cookie for new session cookies. */
  async refresh(options: SessionRequestOptions): Promise<SessionExpiry> {
    const RELATIVE_URL = `/auth/refresh`;

    const response = await this.postRequest<
      DataResponse<SessionExpiry>,
      EmptyPostData
    >({
      data: {},
      url: this.buildUrl(RELATIVE_URL),
      skipSessionRefresh: true,
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<SessionExpiry>(response.data, SessionExpiry);
  }

  /** Ends the sign-in of the refresh cookie; the API clears both cookies. */
  async signOut(options: SessionRequestOptions): Promise<NoDataResponse> {
    const RELATIVE_URL = `/auth/sign_out`;

    const response = await this.postRequest<NoDataResponse, EmptyPostData>({
      data: {},
      url: this.buildUrl(RELATIVE_URL),
      skipSessionRefresh: true,
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
  }

  async getAuthenticatedUser(
    options: GetAuthenticatedUserRequestOptions,
  ): Promise<AuthenticatedUser> {
    const RELATIVE_URL = `/auth/user`;

    const response = await this.getRequest<DataResponse<AuthenticatedUser>>({
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<AuthenticatedUser>(
      response.data,
      AuthenticatedUser,
      options.validate,
    );
  }

  async requestPasswordReset(
    options: PasswordResetRequestOptions,
  ): Promise<NoDataResponse> {
    const RELATIVE_URL = `/auth/request_password_reset`;

    const response = await this.postRequest<
      NoDataResponse,
      PasswordResetRequestBody
    >({
      data: options.data,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
  }

  async resetPassword(options: PasswordResetOptions): Promise<NoDataResponse> {
    const RELATIVE_URL = `/auth/password_reset`;

    const response = await this.postRequest<NoDataResponse, PasswordResetBody>({
      data: options.data,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
  }
}

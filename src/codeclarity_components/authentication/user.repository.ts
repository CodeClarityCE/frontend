import { Entity } from "../../utils/api/BaseEntity";
import {
  type AuthRepoMethodDeleteRequestOptions,
  type AuthRepoMethodPatchRequestOptions,
  type AuthRepoMethodPostRequestOptions,
  BaseRepository,
} from "../../utils/api/BaseRepository";
import type { DataResponse } from "../../utils/api/responses/DataResponse";
import { NoDataResponse } from "../../utils/api/responses/NoDataResponse";
import type { UpdateDefaultOrgBody } from "../organizations/update_default_org.http";
import type { PasswordDeleteBody } from "../settings/forms/password_delete.http";

import { AuthenticatedUser } from "./authenticated_user.entity";
import type { ConfirmRegistrationBody } from "./confirm_registration.http";
import type { PasswordPatchBody } from "./password_patch.http";
import { SessionExpiry } from "./session_expiry.entity";
import type { SocialSetupBody } from "./social_setup.http";

export interface SetDefaultOrgRequestOptions extends AuthRepoMethodPatchRequestOptions<UpdateDefaultOrgBody> {
  userId: string;
}

export interface GetUserRequestOptions extends AuthRepoMethodPatchRequestOptions<UpdateDefaultOrgBody> {
  userId: string;
}

export interface PatchUserRequestOptions extends AuthRepoMethodPatchRequestOptions<SocialSetupBody> {
  userId: string;
}

export interface PatchUserPasswordRequestOptions extends AuthRepoMethodPatchRequestOptions<PasswordPatchBody> {
  userId: string;
}

export interface DeleteUserRequestOptions extends AuthRepoMethodDeleteRequestOptions<PasswordDeleteBody> {
  userId: string;
}

export interface ConfirmRegistrationRequestOptions extends AuthRepoMethodPostRequestOptions<ConfirmRegistrationBody> {
  userId: string;
}

export class UserRepository extends BaseRepository {
  async get(options: GetUserRequestOptions): Promise<AuthenticatedUser> {
    const RELATIVE_URL = `/org/${options.userId}`;

    const response = await this.getRequest<DataResponse<AuthenticatedUser>>({
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<AuthenticatedUser>(
      response.data,
      AuthenticatedUser,
    );
  }

  async setDefaultOrg(
    options: SetDefaultOrgRequestOptions,
  ): Promise<NoDataResponse> {
    const RELATIVE_URL = `/users/${options.userId}/update_default_org`;

    const response = await this.patchRequest<
      NoDataResponse,
      UpdateDefaultOrgBody
    >({
      data: options.data,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
  }

  async patchPersonalInfo(
    options: PatchUserRequestOptions,
  ): Promise<NoDataResponse> {
    const RELATIVE_URL = `/users/${options.userId}/update_personal`;

    const response = await this.patchRequest<NoDataResponse, SocialSetupBody>({
      data: options.data,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
  }

  /** Changes the password; the caller's fresh sign-in comes back in new cookies, with its expiry. */
  async patchPassword(
    options: PatchUserPasswordRequestOptions,
  ): Promise<SessionExpiry> {
    const RELATIVE_URL = `/users/${options.userId}/update_password`;

    const response = await this.patchRequest<
      DataResponse<SessionExpiry>,
      PasswordPatchBody
    >({
      data: options.data,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<SessionExpiry>(response.data, SessionExpiry);
  }

  async deleteUser(options: DeleteUserRequestOptions): Promise<NoDataResponse> {
    const RELATIVE_URL = `/users/${options.userId}`;

    const response = await this.deleteRequest<
      NoDataResponse,
      PasswordDeleteBody
    >({
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
      data: options.data,
    });

    return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
  }

  async confirmRegistration(
    options: ConfirmRegistrationRequestOptions,
  ): Promise<NoDataResponse> {
    const RELATIVE_URL = `/users/confirm_registration`;

    const response = await this.postRequest<
      NoDataResponse,
      ConfirmRegistrationBody
    >({
      data: options.data,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });

    return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
  }
}

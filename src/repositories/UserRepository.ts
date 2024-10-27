import { Entity } from './types/entities/Entity';
import { AuthenticatedUser } from './types/entities/AuthenticatedUser';
import type { SocialSetupBody } from './types/postBodies/SocialSetup';
import type { ConfirmRegistrationBody } from './types/postBodies/ConfirmRegistration';
import type { UpdateDefaultOrgBody } from './types/postBodies/UpdateDefaultOrg';
import type { PasswordPatchBody } from './types/postBodies/PasswordPatch';
import type { PasswordDeleteBody } from './types/postBodies/PasswordDelete';
import { CreatedResponse } from './types/responses/CreatedResponse';
import type { DataResponse } from './types/responses/DataResponse';
import { NoDataResponse } from './types/responses/NoDataResponse';
import {
    BaseRepository,
    type AuthRepoMethodPostRequestOptions,
    type AuthRepoMethodPatchRequestOptions,
    type AuthRepoMethodDeleteRequestOptions
} from './BaseRepository';

export interface CompleteSocialAccountRequestOptions
    extends AuthRepoMethodPostRequestOptions<SocialSetupBody> {}
export interface SetDefaultOrgRequestOptions
    extends AuthRepoMethodPatchRequestOptions<UpdateDefaultOrgBody> {
    userId: string;
}

export interface GetUserRequestOptions
    extends AuthRepoMethodPatchRequestOptions<UpdateDefaultOrgBody> {
    userId: string;
}

export interface PatchUserRequestOptions
    extends AuthRepoMethodPatchRequestOptions<SocialSetupBody> {
    userId: string;
}

export interface PatchUserPasswordRequestOptions
    extends AuthRepoMethodPatchRequestOptions<PasswordPatchBody> {
    userId: string;
}

export interface DeleteUserRequestOptions
    extends AuthRepoMethodDeleteRequestOptions<PasswordDeleteBody> {
    userId: string;
}

export interface ConfirmRegistrationRequestOptions
    extends AuthRepoMethodPostRequestOptions<ConfirmRegistrationBody> {
    userId: string;
}

export class UserRepository extends BaseRepository {
    async get(options: GetUserRequestOptions): Promise<AuthenticatedUser> {
        const RELATIVE_URL = `/org/${options.userId}`;

        const response = await this.getRequest<DataResponse<AuthenticatedUser>>({
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<AuthenticatedUser>(response.data, AuthenticatedUser);
    }

    async completeSocialAccount(
        options: CompleteSocialAccountRequestOptions
    ): Promise<CreatedResponse> {
        const RELATIVE_URL = `/users/complete_social_setup`;

        const response = await this.postRequest<CreatedResponse, SocialSetupBody>({
            bearerToken: options.bearerToken,
            data: options.data,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<CreatedResponse>(response, CreatedResponse);
    }

    async setDefaultOrg(options: SetDefaultOrgRequestOptions): Promise<NoDataResponse> {
        const RELATIVE_URL = `/users/${options.userId}/update_default_org`;

        const response = await this.patchRequest<NoDataResponse, UpdateDefaultOrgBody>({
            bearerToken: options.bearerToken,
            data: options.data,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
    }

    async patchPersonalInfo(options: PatchUserRequestOptions): Promise<NoDataResponse> {
        const RELATIVE_URL = `/users/${options.userId}/update_personal`;

        const response = await this.patchRequest<NoDataResponse, SocialSetupBody>({
            bearerToken: options.bearerToken,
            data: options.data,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
    }

    async patchPassword(options: PatchUserPasswordRequestOptions): Promise<NoDataResponse> {
        const RELATIVE_URL = `/users/${options.userId}/update_password`;

        const response = await this.patchRequest<NoDataResponse, PasswordPatchBody>({
            bearerToken: options.bearerToken,
            data: options.data,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
    }

    async deleteUser(options: DeleteUserRequestOptions): Promise<NoDataResponse> {
        const RELATIVE_URL = `/users/${options.userId}`;

        const response = await this.deleteRequest<NoDataResponse, PasswordDeleteBody>({
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors,
            data: options.data
        });

        return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
    }

    async confirmRegistration(options: ConfirmRegistrationRequestOptions): Promise<NoDataResponse> {
        const RELATIVE_URL = `/users/confirm_registration`;

        const response = await this.postRequest<NoDataResponse, ConfirmRegistrationBody>({
            bearerToken: options.bearerToken,
            data: options.data,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
    }
}

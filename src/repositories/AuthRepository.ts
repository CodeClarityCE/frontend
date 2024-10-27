import { AuthenticatedUser } from './types/entities/AuthenticatedUser';
import { Entity } from './types/entities/Entity';
import type { AuthenticateBody } from './types/postBodies/Authenticate';
import type { Oauth2FinalizeBody } from './types/postBodies/OAuth2Finalize';
import type { PasswordResetBody } from './types/postBodies/PasswordReset';
import type { PasswordResetRequestBody } from './types/postBodies/PasswordResetRequest';
import type { RegisterBody } from './types/postBodies/Register';
import { CreatedResponse } from './types/responses/CreatedResponse';
import type { DataResponse } from './types/responses/DataResponse';
import { NoDataResponse } from './types/responses/NoDataResponse';
import { RefreshToken } from '@/repositories/types/entities/RefreshToken';
import { Token } from '@/repositories/types/entities/Token';
import {
    BaseRepository,
    type EmptyPostData,
    type RepoMethodPostRequestOptions,
    type AuthRepoMethodGetRequestOptions
} from './BaseRepository';
import type { RefreshTokenBody } from './types/postBodies/TokenRefresh';

export interface AuthenticateRequestOptions
    extends RepoMethodPostRequestOptions<AuthenticateBody> {}
export interface RefreshTokenRequestOptions
    extends RepoMethodPostRequestOptions<RefreshTokenBody> {}
export interface GetAuthenticatedUserRequestOptions extends AuthRepoMethodGetRequestOptions {
    validate?: boolean;
}
export interface RegisterRequestOptions extends RepoMethodPostRequestOptions<RegisterBody> {}
export interface GithubAuthenticateFinalizeRequestOptions
    extends RepoMethodPostRequestOptions<Oauth2FinalizeBody> {}
export interface GitlabAuthenticateFinalizeRequestOptions
    extends RepoMethodPostRequestOptions<Oauth2FinalizeBody> {}
export interface PasswordResetRequestOptions
    extends RepoMethodPostRequestOptions<PasswordResetRequestBody> {}
export interface PasswordResetOptions extends RepoMethodPostRequestOptions<PasswordResetBody> {}

export class AuthRepository extends BaseRepository {
    async authenticate(options: AuthenticateRequestOptions): Promise<Token> {
        const RELATIVE_URL = `/auth/authenticate`;

        const response = await this.postRequest<DataResponse<Token>, AuthenticateBody>({
            data: options.data,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<Token>(response.data, Token);
    }

    async register(options: RegisterRequestOptions): Promise<CreatedResponse> {
        const RELATIVE_URL = `/auth/register`;

        const response = await this.postRequest<CreatedResponse, RegisterBody>({
            data: options.data,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<CreatedResponse>(response, CreatedResponse);
    }

    async refresh(options: RefreshTokenRequestOptions): Promise<RefreshToken> {
        const RELATIVE_URL = `/auth/refresh`;

        const response = await this.postRequest<DataResponse<RefreshToken>, EmptyPostData>({
            data: options.data,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<RefreshToken>(response.data, RefreshToken);
    }

    async getAuthenticatedUser(
        options: GetAuthenticatedUserRequestOptions
    ): Promise<AuthenticatedUser> {
        const RELATIVE_URL = `/auth/user`;

        const response = await this.getRequest<DataResponse<AuthenticatedUser>>({
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<AuthenticatedUser>(
            response.data,
            AuthenticatedUser,
            options.validate
        );
    }

    async gitlabAuthFinalize(options: GitlabAuthenticateFinalizeRequestOptions): Promise<Token> {
        const RELATIVE_URL = `/auth/gitlab/finalize`;

        const response = await this.postRequest<DataResponse<Token>, Oauth2FinalizeBody>({
            data: options.data,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<Token>(response.data, Token);
    }

    async githubAuthFinalize(options: GithubAuthenticateFinalizeRequestOptions): Promise<Token> {
        const RELATIVE_URL = `/auth/github/finalize`;

        const response = await this.postRequest<DataResponse<Token>, Oauth2FinalizeBody>({
            data: options.data,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<Token>(response.data, Token);
    }

    async requestPasswordReset(options: PasswordResetRequestOptions): Promise<NoDataResponse> {
        const RELATIVE_URL = `/auth/request_password_reset`;

        const response = await this.postRequest<NoDataResponse, PasswordResetRequestBody>({
            data: options.data,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
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
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
    }
}

import { RefreshToken } from '@/codeclarity_components/authentication/refresh_token.entity';
import { Token } from '@/codeclarity_components/authentication/token.entity';
import { Entity } from '../../utils/api/BaseEntity';
import {
    BaseRepository,
    type EmptyPostData,
    type RepoMethodPostRequestOptions,
    type AuthRepoMethodGetRequestOptions
} from '../../utils/api/BaseRepository';
import { CreatedResponse } from '../../utils/api/responses/CreatedResponse';
import type { DataResponse } from '../../utils/api/responses/DataResponse';
import { NoDataResponse } from '../../utils/api/responses/NoDataResponse';
import type { AuthenticateBody } from './authenticate.http';
import { AuthenticatedUser } from './authenticated_user.entity';
import type { Oauth2FinalizeBody } from './oauth/oauth2_finalize.http';
import type { PasswordResetBody } from './password_reset.http';
import type { PasswordResetRequestBody } from './password_reset_request.http';
import type { RegisterBody } from './register.http';
import type { RefreshTokenBody } from './token_refresh.http';

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

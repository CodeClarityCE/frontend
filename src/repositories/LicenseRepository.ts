import { Entity } from './types/entities/Entity';
import { PaginatedResponse } from './types/responses/PaginatedResponse';
import { BaseRepository, type AuthRepoMethodGetRequestOptions } from './BaseRepository';
import type { License } from './types/entities/License';

export interface GetLicenseRequestOptions extends AuthRepoMethodGetRequestOptions {}

export class LicenseRepository extends BaseRepository {
    async getLicense(options: GetLicenseRequestOptions): Promise<PaginatedResponse<License>> {
        const RELATIVE_URL = `/knowledge/license`;

        const response = await this.getRequest<PaginatedResponse<License>>({
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<PaginatedResponse<License>>(response, PaginatedResponse<License>);
    }

    async getAllLicenses(options: GetLicenseRequestOptions): Promise<PaginatedResponse<License>> {
        const RELATIVE_URL = `/knowledge/license`;

        const response = await this.getRequest<PaginatedResponse<License>>({
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return response;
    }
}

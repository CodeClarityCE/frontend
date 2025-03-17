import { Entity } from '../../../utils/api/BaseEntity';
import { PaginatedResponse } from '../../../utils/api/responses/PaginatedResponse';
import {
    BaseRepository,
    type AuthRepoMethodGetRequestOptions
} from '../../../utils/api/BaseRepository';
import type { License } from './License';

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

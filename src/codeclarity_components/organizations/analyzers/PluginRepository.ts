import { Entity } from '../../../utils/api/BaseEntity';
import { PaginatedResponse } from '../../../utils/api/responses/PaginatedResponse';
import { BaseRepository, type AuthRepoMethodGetRequestOptions } from '../../../utils/api/BaseRepository';
import type { Plugin } from './Plugin';

export interface GetPluginRequestOptions extends AuthRepoMethodGetRequestOptions {}

export class PluginRepository extends BaseRepository {
    async getPlugin(options: GetPluginRequestOptions): Promise<PaginatedResponse<Plugin>> {
        const RELATIVE_URL = `/plugin`;

        const response = await this.getRequest<PaginatedResponse<Plugin>>({
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<PaginatedResponse<Plugin>>(response, PaginatedResponse<Plugin>);
    }

    async geAllPlugins(options: GetPluginRequestOptions): Promise<PaginatedResponse<Plugin>> {
        const RELATIVE_URL = `/plugin`;

        const response = await this.getRequest<PaginatedResponse<Plugin>>({
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return response;
    }
}

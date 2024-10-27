import { Entity } from './types/entities/Entity';
import { PaginatedResponse } from './types/responses/PaginatedResponse';
import { BaseRepository, type AuthRepoMethodGetRequestOptions } from './BaseRepository';
import type { Plugin } from './types/entities/Plugin';

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

import { Entity } from '../../../utils/api/BaseEntity';
import { Analyzer } from './Analyzer';
import type { CreateAnalyzer } from './create_analyzer.http';
import { PaginatedResponse } from '../../../utils/api/responses/PaginatedResponse';
import {
    BaseRepository,
    type AuthRepoMethodEmptyDeleteRequestOptions,
    type AuthRepoMethodGetRequestOptions,
    type AuthRepoMethodPostRequestOptions,
    type EmptyPostData
} from '../../../utils/api/BaseRepository';
import { CreatedResponse } from '../../../utils/api/responses/CreatedResponse';
import { DataResponse } from '../../../utils/api/responses/DataResponse';
import { NoDataResponse } from '../../../utils/api/responses/NoDataResponse';

export interface GetAnalyzersRequestOptions extends AuthRepoMethodGetRequestOptions {
    orgId: string;
    // integrationId: string;
    page: number;
    entries_per_page: number;
    search_key: string;
}

export interface GetAnalyzerRequestOptions extends AuthRepoMethodGetRequestOptions {
    orgId: string;
    analyzer_id: string;
}

export interface CreateAnalyzerOptions extends AuthRepoMethodPostRequestOptions<CreateAnalyzer> {
    orgId: string;
}

export interface UpdateAnalyzerOptions extends AuthRepoMethodPostRequestOptions<CreateAnalyzer> {
    orgId: string;
    analyzer_id: string;
}

export interface DeleteAnalyzerRequestOptions extends AuthRepoMethodEmptyDeleteRequestOptions {
    orgId: string;
    analyzer_id: string;
}

export class AnalyzerRepository extends BaseRepository {
    async getAnalyzers(options: GetAnalyzersRequestOptions): Promise<PaginatedResponse<Analyzer>> {
        const RELATIVE_URL = `/org/${options.orgId}/analyzers`;

        const response = await this.getRequest<PaginatedResponse<Analyzer>>({
            queryParams: {
                page: options.page,
                entries_per_page: options.entries_per_page,
                search_key: options.search_key
            },
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<PaginatedResponse<Analyzer>>(response, PaginatedResponse<Analyzer>);
    }

    async getAnalyzer(options: GetAnalyzerRequestOptions): Promise<DataResponse<Analyzer>> {
        const RELATIVE_URL = `/org/${options.orgId}/analyzers/${options.analyzer_id}`;

        const response = await this.getRequest<DataResponse<Analyzer>>({
            // queryParams: {
            //     page: options.page,
            //     entries_per_page: options.entries_per_page,
            //     search_key: options.search_key
            // },
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<DataResponse<Analyzer>>(response, DataResponse<Analyzer>);
    }

    async createAnalyzer(options: CreateAnalyzerOptions): Promise<CreatedResponse> {
        const RELATIVE_URL = `/org/${options.orgId}/analyzers`;

        const response = await this.postRequest<CreatedResponse, CreateAnalyzer>({
            bearerToken: options.bearerToken,
            data: options.data,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<CreatedResponse>(response, CreatedResponse);
    }

    async updateAnalyzer(options: UpdateAnalyzerOptions): Promise<NoDataResponse> {
        const RELATIVE_URL = `/org/${options.orgId}/analyzers/${options.analyzer_id}`;

        const response = await this.putRequest<NoDataResponse, CreateAnalyzer>({
            bearerToken: options.bearerToken,
            data: options.data,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
    }

    async deleteAnalyzer(options: DeleteAnalyzerRequestOptions): Promise<NoDataResponse> {
        const RELATIVE_URL = `/org/${options.orgId}/analyzers/${options.analyzer_id}`;

        const response = await this.deleteRequest<NoDataResponse, EmptyPostData>({
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors,
            data: {}
        });

        return Entity.unMarshal<NoDataResponse>(response, NoDataResponse);
    }
}

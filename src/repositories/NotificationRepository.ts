import { Entity } from './types/entities/Entity';
import { PaginatedResponse } from './types/responses/PaginatedResponse';
import {
    BaseRepository,
    type AuthRepoMethodEmptyDeleteRequestOptions,
    type AuthRepoMethodGetRequestOptions,
    type EmptyPostData
} from './BaseRepository';
import { DataResponse } from './types/responses/DataResponse';
import { NoDataResponse } from './types/responses/NoDataResponse';
import type { Notification } from './types/entities/Notification';

export interface GetNotificationsRequestOptions extends AuthRepoMethodGetRequestOptions {
    page: number;
    entries_per_page: number;
}

export interface GetNotificationRequestOptions extends AuthRepoMethodGetRequestOptions {
    notification_id: string;
}

export interface DeleteNotificationRequestOptions extends AuthRepoMethodEmptyDeleteRequestOptions {
    notification_id: string;
}

export class NotificationRepository extends BaseRepository {
    async getNotifications(
        options: GetNotificationsRequestOptions
    ): Promise<PaginatedResponse<Notification>> {
        const RELATIVE_URL = `/notifications`;

        const response = await this.getRequest<PaginatedResponse<Notification>>({
            queryParams: {
                page: options.page,
                entries_per_page: options.entries_per_page
            },
            bearerToken: options.bearerToken,
            url: this.buildUrl(RELATIVE_URL),
            handleBusinessErrors: options.handleBusinessErrors,
            handleHTTPErrors: options.handleHTTPErrors,
            handleOtherErrors: options.handleOtherErrors
        });

        return Entity.unMarshal<PaginatedResponse<Notification>>(
            response,
            PaginatedResponse<Notification>
        );
    }

    async getNotification(
        options: GetNotificationRequestOptions
    ): Promise<DataResponse<Notification>> {
        const RELATIVE_URL = `/notifications/${options.notification_id}`;

        const response = await this.getRequest<DataResponse<Notification>>({
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

        return Entity.unMarshal<DataResponse<Notification>>(response, DataResponse<Notification>);
    }

    async deleteNotification(options: DeleteNotificationRequestOptions): Promise<NoDataResponse> {
        const RELATIVE_URL = `/notifications/${options.notification_id}`;

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

    async deleteAllNotifications(
        options: AuthRepoMethodEmptyDeleteRequestOptions
    ): Promise<NoDataResponse> {
        const RELATIVE_URL = `/notifications`;

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

import { IsNotEmpty } from 'class-validator';

enum NotificationType {
    Info = 'info',
    Warning = 'warning',
    Error = 'error'
}

enum NotificationContentType {
    NewVersion = 'new_version'
}

export class Notification {
    @IsNotEmpty()
    id!: string;

    @IsNotEmpty()
    title!: string;

    @IsNotEmpty()
    description!: string;

    @IsNotEmpty()
    content!: Record<string, string>;

    @IsNotEmpty()
    type!: NotificationType;

    @IsNotEmpty()
    content_type!: NotificationContentType;
}

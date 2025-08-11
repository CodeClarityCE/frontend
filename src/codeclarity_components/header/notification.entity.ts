import { IsNotEmpty } from 'class-validator';

enum NotificationType {
    Info = 'info',
    Warning = 'warning',
    Error = 'error'
}

enum NotificationContentType {
    NewVersion = 'new_version',
    FixAvailable = 'fix_available',
    VulnSummary = 'vuln_summary'
}

export class Notification {
    @IsNotEmpty()
    id!: string;

    @IsNotEmpty()
    title!: string;

    @IsNotEmpty()
    description!: string;

    @IsNotEmpty()
    content!: Record<string, any>;

    @IsNotEmpty()
    type!: NotificationType;

    @IsNotEmpty()
    content_type!: NotificationContentType;
}

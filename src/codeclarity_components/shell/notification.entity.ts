import { IsNotEmpty } from "class-validator";

enum NotificationType {
  Info = "info",
  Warning = "warning",
  Error = "error",
}

export enum NotificationContentType {
  NewVersion = "new_version",
  FixAvailable = "fix_available",
  VulnSummary = "vuln_summary",
  VulnerabilitySummary = "vulnerability_summary",
  PackageUpdate = "package_update",
}

export interface NotificationContent {
  package_name?: string;
  project_name?: string;
  current_version?: string;
  new_version?: string;
  dependency_type?: "production" | "development";
  max_severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE";
  severity_counts?: {
    CRITICAL?: number;
    HIGH?: number;
    MEDIUM?: number;
    LOW?: number;
  };
  total?: number;
  analysis_id?: string;
  project_id?: string;
  release_notes_url?: string;
  package?: string;
  version?: string;
  fixed_version?: string;
  vulnerable_version?: string;
  [key: string]: unknown;
}

export class Notification {
  @IsNotEmpty()
  id!: string;

  @IsNotEmpty()
  title!: string;

  @IsNotEmpty()
  description!: string;

  @IsNotEmpty()
  content!: NotificationContent;

  @IsNotEmpty()
  type!: NotificationType;

  @IsNotEmpty()
  content_type!: NotificationContentType;
}

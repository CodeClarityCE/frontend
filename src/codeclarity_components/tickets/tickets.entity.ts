import { Type } from "class-transformer";
import {
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

import type { StatusTone } from "@/base_components/page";
import type {
  InstanceDiffLinks,
  RemediationKind,
  TopLevelDependency,
} from "@/codeclarity_components/vulnerabilities/organization_vulnerability.entity";

// ============================================
// Enums
// ============================================

// Copy of the API's TicketStatus in api/src/codeclarity_modules/tickets/ticket.entity.ts.
// The umbrella type-sync check (scripts/type-sync) fails CI when a value is missing.
/** @public type-sync copy of an API enum: every API value stays */
export enum TicketStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
  WONT_FIX = "WONT_FIX",
}

// Copy of the API's TicketPriority in api/src/codeclarity_modules/tickets/ticket.entity.ts.
// The umbrella type-sync check (scripts/type-sync) fails CI when a value is missing.
/** @public type-sync copy of an API enum: every API value stays */
export enum TicketPriority {
  CRITICAL = "CRITICAL",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

// Copy of the API's TicketType in api/src/codeclarity_modules/tickets/ticket.entity.ts.
// The umbrella type-sync check (scripts/type-sync) fails CI when a value is missing.
/** @public type-sync copy of an API enum: every API value stays */
export enum TicketType {
  VULNERABILITY = "VULNERABILITY",
  LICENSE = "LICENSE",
  UPGRADE = "UPGRADE",
}

export enum ExternalTicketProvider {
  CLICKUP = "CLICKUP",
  JIRA = "JIRA",
  LINEAR = "LINEAR",
}

// Copy of the API's TicketEventType in api/src/codeclarity_modules/tickets/ticket-event.entity.ts.
// The umbrella type-sync check (scripts/type-sync) fails CI when a value is missing.
/** @public type-sync copy of an API enum: every API value stays */
export enum TicketEventType {
  CREATED = "CREATED",
  STATUS_CHANGED = "STATUS_CHANGED",
  PRIORITY_CHANGED = "PRIORITY_CHANGED",
  ASSIGNED = "ASSIGNED",
  UNASSIGNED = "UNASSIGNED",
  SYNCED_EXTERNAL = "SYNCED_EXTERNAL",
  SYNCED_FROM_EXTERNAL = "SYNCED_FROM_EXTERNAL",
  UNLINKED_EXTERNAL = "UNLINKED_EXTERNAL",
  OCCURRENCE_ADDED = "OCCURRENCE_ADDED",
  OCCURRENCE_RESOLVED = "OCCURRENCE_RESOLVED",
  RESOLVED = "RESOLVED",
  REOPENED = "REOPENED",
  COMMENT_ADDED = "COMMENT_ADDED",
  DUE_DATE_CHANGED = "DUE_DATE_CHANGED",
}

// ============================================
// Ticket Summary (for list view)
// ============================================

export class TicketSummary {
  @IsNotEmpty()
  id!: string;

  @IsNotEmpty()
  title!: string;

  @IsEnum(TicketStatus)
  status!: TicketStatus;

  @IsEnum(TicketPriority)
  priority!: TicketPriority;

  @IsEnum(TicketType)
  type!: TicketType;

  @IsOptional()
  @IsString()
  vulnerability_id?: string;

  @IsOptional()
  @IsString()
  affected_package?: string;

  @IsOptional()
  @IsNumber()
  severity_score?: number;

  @IsOptional()
  @IsString()
  severity_class?: string;

  @IsNotEmpty()
  @Type(() => Date)
  created_on!: Date;

  @IsOptional()
  @Type(() => Date)
  updated_on?: Date;

  @IsNotEmpty()
  project_id!: string;

  @IsNotEmpty()
  project_name!: string;

  @IsOptional()
  @IsString()
  assigned_to_id?: string;

  @IsOptional()
  @IsString()
  assigned_to_name?: string;

  @IsDefined()
  has_external_links!: boolean;

  @IsOptional()
  @IsString()
  external_status?: string;
}

// ============================================
// Ticket Details (for detail view)
// ============================================

export interface ExternalLink {
  id: string;
  provider: ExternalTicketProvider;
  external_id: string;
  external_url: string;
  synced_on: Date;
}

export class TicketDetails extends TicketSummary {
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsString()
  affected_version?: string;

  @IsOptional()
  @IsString()
  recommended_version?: string;

  @IsOptional()
  @IsString()
  remediation_notes?: string;

  @IsOptional()
  @Type(() => Date)
  resolved_on?: Date;

  @IsOptional()
  @Type(() => Date)
  due_date?: Date;

  @IsNotEmpty()
  created_by_id!: string;

  @IsNotEmpty()
  created_by_name!: string;

  @IsOptional()
  @IsString()
  source_analysis_id?: string;

  @IsDefined()
  external_links!: ExternalLink[];

  @IsNumber()
  occurrence_count!: number;

  @IsNumber()
  active_occurrence_count!: number;

  // Null for tickets that track one vulnerability.
  @IsOptional()
  remediation?: TicketRemediation | null;

  @IsOptional()
  instances?: TicketInstance[];
}

/** The remediation a ticket tracks (ADR 0016). */
export interface TicketRemediation {
  kind: RemediationKind;
  workspace: string;
  package: string;
  installed_versions: string[];
  target_version: string;
  potentially_breaking: boolean;
  package_manager: string | null;
  command: string | null;
  manifest_edit: { file: string; text: string } | null;
}

/** One vulnerability instance a ticket's remediation resolves. */
export interface TicketInstance {
  id: string;
  analysis_id: string;
  vulnerability_id: string;
  analysis_vulnerability_id: string;
  package: string;
  ecosystem: string | null;
  installed_version: string;
  workspace: string;
  prod: boolean;
  severity_class: string;
  severity_score: number | null;
  fixed_version: string | null;
  top_level_dependencies: TopLevelDependency[];
  is_active: boolean;
  detected_on: string;
  resolved_on: string | null;
  /** Fix commit, compare and registry diff links */
  diff_links: InstanceDiffLinks;
}

// ============================================
// Ticket Event (audit trail)
// ============================================

export class TicketEvent {
  @IsNotEmpty()
  id!: string;

  @IsEnum(TicketEventType)
  event_type!: TicketEventType;

  @IsDefined()
  event_data!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  performed_by_id?: string;

  @IsOptional()
  @IsString()
  performed_by_name?: string;

  @IsNotEmpty()
  @Type(() => Date)
  created_on!: Date;
}

// ============================================
// Dashboard Stats
// ============================================

export class TicketDashboardStats {
  @IsNumber()
  total_open!: number;

  @IsNumber()
  total_in_progress!: number;

  @IsNumber()
  total_resolved_this_week!: number;

  @IsNumber()
  total_closed!: number;

  /** Open or in-progress tickets whose due date has passed */
  @IsNumber()
  total_overdue!: number;

  /** Open or in-progress tickets due within the next seven days */
  @IsNumber()
  total_due_this_week!: number;

  @IsDefined()
  by_priority!: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };

  @IsDefined()
  by_project!: {
    project_id: string;
    project_name: string;
    open_count: number;
  }[];

  @IsDefined()
  @Type(() => TicketSummary)
  recent_tickets!: TicketSummary[];

  @IsOptional()
  @IsNumber()
  avg_resolution_time_days?: number;
}

// ============================================
// Request DTOs
// ============================================

export interface CreateTicketRequest {
  title: string;
  description: string;
  priority: TicketPriority;
  type: TicketType;
  project_id: string;
  vulnerability_id?: string;
  affected_package?: string;
  affected_version?: string;
  severity_score?: number;
  severity_class?: string;
  recommended_version?: string;
  remediation_notes?: string;
  due_date?: string;
  source_analysis_id?: string;
  sync_to_provider?: ExternalTicketProvider;
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigned_to_id?: string;
  remediation_notes?: string;
  /** Null clears the due date */
  due_date?: string | null;
}

export interface BulkUpdateTicketsRequest {
  ticket_ids: string[];
  status?: TicketStatus;
  priority?: TicketPriority;
  assigned_to_id?: string;
}

/** Names one remediation of the project's current analysis. */
export interface CreateRemediationTicketRequest {
  kind: RemediationKind;
  workspace: string;
  package: string;
  allow_duplicate?: boolean;
}

/** The created ticket, or the open one that already tracks the remediation. */
export interface CreateRemediationTicketResult {
  created: boolean;
  ticket_id: string | null;
  duplicate: { ticket_id: string; title: string; status: TicketStatus } | null;
}

export interface CheckDuplicateRequest {
  project_id: string;
  vulnerability_id: string;
}

// The finding a ticket is created from.
export interface VulnerabilityData {
  vulnerability_id: string;
  severity_score?: number;
  severity_class?: string;
  affected_package?: string;
  affected_version?: string;
  description?: string;
  recommended_version?: string;
}

// ============================================
// Response Types
// ============================================

export interface BulkUpdateResult {
  updated_count: number;
  ticket_ids: string[];
}

export interface DuplicateCheckResult {
  exists: boolean;
  existing_ticket_id?: string;
  existing_ticket_title?: string;
  existing_ticket_status?: TicketStatus;
}

// ============================================
// Filter Types
// ============================================

export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  type?: TicketType[];
  project_id?: string;
  assigned_to_id?: string;
  has_external_link?: boolean;
  vulnerability_id?: string;
  severity_class?: string[];
  created_after?: string;
  created_before?: string;
}

// ============================================
// UI Helpers
// ============================================

export const TicketStatusLabels: Record<TicketStatus, string> = {
  [TicketStatus.OPEN]: "Open",
  [TicketStatus.IN_PROGRESS]: "In Progress",
  [TicketStatus.RESOLVED]: "Resolved",
  [TicketStatus.CLOSED]: "Closed",
  [TicketStatus.WONT_FIX]: "Won't Fix",
};

// Status colours from the shared status set; the label always carries the meaning.
export const TicketStatusTones: Record<TicketStatus, StatusTone> = {
  [TicketStatus.OPEN]: "warning",
  [TicketStatus.IN_PROGRESS]: "neutral",
  [TicketStatus.RESOLVED]: "success",
  [TicketStatus.CLOSED]: "neutral",
  [TicketStatus.WONT_FIX]: "neutral",
};

export const TicketPriorityLabels: Record<TicketPriority, string> = {
  [TicketPriority.CRITICAL]: "Critical",
  [TicketPriority.HIGH]: "High",
  [TicketPriority.MEDIUM]: "Medium",
  [TicketPriority.LOW]: "Low",
};

// Priority uses the severity scale, as a solid fill with light text.
export const TicketPriorityColors: Record<TicketPriority, string> = {
  [TicketPriority.CRITICAL]:
    "bg-severity-critical text-severity-critical-foreground",
  [TicketPriority.HIGH]: "bg-severity-high text-severity-high-foreground",
  [TicketPriority.MEDIUM]: "bg-severity-medium text-severity-medium-foreground",
  [TicketPriority.LOW]: "bg-severity-low text-severity-low-foreground",
};

// Sorts priorities from the most urgent (0) to the least.
export const TicketPriorityRank: Record<TicketPriority, number> = {
  [TicketPriority.CRITICAL]: 0,
  [TicketPriority.HIGH]: 1,
  [TicketPriority.MEDIUM]: 2,
  [TicketPriority.LOW]: 3,
};

export const TicketTypeLabels: Record<TicketType, string> = {
  [TicketType.VULNERABILITY]: "Vulnerability",
  [TicketType.LICENSE]: "License",
  [TicketType.UPGRADE]: "Upgrade",
};

// Kanban columns, in board order: one per status, so the cards add up to the total.
export const KanbanColumns: { status: TicketStatus; label: string }[] = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.RESOLVED,
  TicketStatus.CLOSED,
  TicketStatus.WONT_FIX,
].map((status) => ({ status, label: TicketStatusLabels[status] }));

// ============================================
// Integration Types
// ============================================

export interface IntegrationConfigSummary {
  id: string;
  provider: ExternalTicketProvider;
  enabled: boolean;
  created_on: Date;
  updated_on?: Date;
  has_config: boolean;
}

export interface IntegrationHierarchyItem {
  id: string;
  name: string;
}

export interface ConnectionTestResult {
  success: boolean;
  error?: string;
  user_info?: {
    id: string;
    name: string;
    email?: string;
  };
}

/** Credentials typed in the setup dialog, sent per request and never saved by it. */
export interface IntegrationCredentials {
  api_key?: string;
  access_token?: string;
}

export interface ConfigureClickUpRequest {
  auth_method: "API_KEY" | "OAUTH";
  api_key?: string;
  access_token?: string;
  refresh_token?: string;
  workspace_id?: string;
  space_id?: string;
  folder_id?: string;
  list_id: string;
  auto_sync_on_create?: boolean;
  sync_status_changes?: boolean;
}

export interface SyncResult {
  ticket_id: string;
  external_id: string;
  external_url: string;
  provider: ExternalTicketProvider;
}

export interface BulkSyncResult {
  synced: SyncResult[];
  failed: { ticket_id: string; error: string }[];
}

/** Result from syncing a single ticket FROM external provider */
export interface SyncFromExternalResult {
  ticket_id: string;
  updated: boolean;
  old_status?: TicketStatus;
  new_status?: TicketStatus;
  external_status?: string;
}

/** Result from bulk syncing tickets FROM external provider */
export interface BulkSyncFromExternalResult {
  updated: SyncFromExternalResult[];
  unchanged: string[];
  failed: { ticket_id: string; error: string }[];
}

// Provider labels and icons
export const ExternalProviderLabels: Record<ExternalTicketProvider, string> = {
  [ExternalTicketProvider.CLICKUP]: "ClickUp",
  [ExternalTicketProvider.JIRA]: "Jira",
  [ExternalTicketProvider.LINEAR]: "Linear",
};

export const ExternalProviderIcons: Record<ExternalTicketProvider, string> = {
  [ExternalTicketProvider.CLICKUP]: "simple-icons:clickup",
  [ExternalTicketProvider.JIRA]: "simple-icons:jira",
  [ExternalTicketProvider.LINEAR]: "simple-icons:linear",
};

// ============================================
// Vulnerability Details Types
// ============================================

interface CVSS2 {
  base_score: number;
  exploitability_score?: number;
  impact_score?: number;
  access_vector?: string;
  access_complexity?: string;
  confidentiality_impact?: string;
  availability_impact?: string;
  integrity_impact?: string;
  authentication?: string;
}

interface CVSS3 {
  base_score: number;
  exploitability_score?: number;
  impact_score?: number;
  attack_vector?: string;
  attack_complexity?: string;
  confidentiality_impact?: string;
  availability_impact?: string;
  integrity_impact?: string;
  user_interaction?: string;
  scope?: string;
  privileges_required?: string;
}

interface SeverityInfo {
  cvss_31?: CVSS3;
  cvss_3?: CVSS3;
  cvss_2?: CVSS2;
}

interface WeaknessInfo {
  id: string;
  name: string;
  description: string;
}

interface ReferenceInfo {
  url: string;
  tags: string[];
}

interface VulnSourceInfo {
  source: string;
  vulnerability_id: string;
}

interface VersionInfoReport {
  affected_version: string;
  recommended_version?: string;
  patched_versions?: string[];
}

interface VulnerabilityInfoReport {
  vulnerability_id: string;
  description: string;
  version_info: VersionInfoReport;
  published: string;
  last_modified: string;
  sources: VulnSourceInfo[];
  aliases: string[];
}

interface DependencyInfoReport {
  name: string;
  version: string;
  ecosystem?: string;
  direct: boolean;
}

interface CommonConsequencesInfo {
  scope: string[];
  impact: string[];
  description: string;
}

interface OwaspTop10Info {
  id: string;
  name: string;
  description?: string;
}

interface OtherInfo {
  package_manager: string;
  epss_score?: number;
  epss_percentile?: number;
  vlai_score?: string;
  vlai_confidence?: number;
}

export interface VulnerabilityDetailsReport {
  vulnerability_info: VulnerabilityInfoReport;
  dependency_info?: DependencyInfoReport;
  severities: SeverityInfo;
  owasp_top_10: OwaspTop10Info | null;
  weaknesses: WeaknessInfo[];
  common_consequences: Record<string, CommonConsequencesInfo[]>;
  references: ReferenceInfo[];
  location: string[];
  other: OtherInfo;
}

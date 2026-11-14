import {
  type AuthRepoMethodGetRequestOptions,
  BaseRepository,
} from "../../utils/api/BaseRepository";
import type { DataResponse } from "../../utils/api/responses/DataResponse";

export interface KnowledgeSourceStatus {
  source: string;
  status: "healthy" | "stale" | "failed";
  watermark: string | null;
  last_outcome: "success" | "failure" | null;
  last_run_started_at: string | null;
  last_run_finished_at: string | null;
  in_progress: boolean;
  row_count: number;
  stale_after_hours: number;
}

export interface KnowledgeStatus {
  sources: KnowledgeSourceStatus[];
}

// One source's state when an analysis ran; "unknown" means it could not be read.
export interface KnowledgeSourceSnapshot {
  source: string;
  status: "healthy" | "stale" | "failed" | "unknown";
  comparable: boolean;
  watermark: string | null;
  row_count: number;
  last_outcome: "success" | "failure" | null;
  stale_after_hours: number;
}

export interface KnowledgeSnapshot {
  taken_at: string;
  knowledge_asof?: string;
  sources: KnowledgeSourceSnapshot[];
}

export interface GetKnowledgeSnapshotRequestOptions extends AuthRepoMethodGetRequestOptions {
  orgId: string;
  projectId: string;
  analysisId: string;
}

export class KnowledgeStatusRepository extends BaseRepository {
  async getStatus(
    options: AuthRepoMethodGetRequestOptions,
  ): Promise<DataResponse<KnowledgeStatus>> {
    return this.getRequest<DataResponse<KnowledgeStatus>>({
      bearerToken: options.bearerToken,
      url: this.buildUrl("/knowledge/status"),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });
  }

  // Answers null data for an analysis that predates source snapshots.
  async getAnalysisSnapshot(
    options: GetKnowledgeSnapshotRequestOptions,
  ): Promise<DataResponse<KnowledgeSnapshot | null>> {
    return this.getRequest<DataResponse<KnowledgeSnapshot | null>>({
      bearerToken: options.bearerToken,
      url: this.buildUrl(
        `/org/${options.orgId}/projects/${options.projectId}/analysis/${options.analysisId}/vulnerabilities/knowledge-snapshot`,
      ),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });
  }
}

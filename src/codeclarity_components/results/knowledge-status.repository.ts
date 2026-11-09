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
}

import {
  type AuthRepoMethodPatchRequestOptions,
  BaseRepository,
} from "@/utils/api/BaseRepository";
import { type NoDataResponse } from "@/utils/api/responses/NoDataResponse";

export interface UploadFileChunkOptions extends Omit<
  AuthRepoMethodPatchRequestOptions<FormData>,
  "data"
> {
  projectId: string;
  orgId: string;
  file: Blob;
  fileName: string;
  chunkIndex: number;
  isLast: boolean;
  hash: string;
}

export class FileRepository extends BaseRepository {
  /**
   * Upload a file chunk to a project
   * Supports chunked uploads with SHA-256 hash verification
   */
  async uploadFileChunk(options: UploadFileChunkOptions): Promise<void> {
    const RELATIVE_URL = `/org/${options.orgId}/file/${options.projectId}/upload`;

    const formData = new FormData();
    formData.append("file", options.file);
    formData.append("file_name", options.fileName);
    formData.append("chunk", "true");
    formData.append("id", options.chunkIndex.toString());
    formData.append("last", options.isLast ? "true" : "false");
    formData.append("hash", options.hash);
    formData.append("type", "source");

    // Use native fetch for multipart/form-data (don't set Content-Type, browser handles it)
    const url = this.buildUrl(RELATIVE_URL);

    const headers: HeadersInit = {
      Accept: "application/json",
    };

    if (options.bearerToken) {
      headers.Authorization = `Bearer ${options.bearerToken}`;
    }

    const response = await fetch(url, {
      method: "PATCH",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData: unknown = await response.json().catch(() => ({}));
      throw new Error(
        `Upload failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`,
      );
    }
  }

  /**
   * Upload a complete file in chunks
   * Automatically handles chunking and progress reporting
   */
  async uploadFile(options: {
    projectId: string;
    orgId: string;
    file: File;
    bearerToken: string;
    onProgress?: (progress: number) => void;
    chunkSize?: number;
  }): Promise<void> {
    const CHUNK_SIZE = options.chunkSize ?? 1024 * 1024; // 1MB default
    const totalChunks = Math.ceil(options.file.size / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, options.file.size);
      const chunk = options.file.slice(start, end);
      const isLast = i === totalChunks - 1;

      // Calculate SHA-256 hash of chunk
      const hash = await this.calculateSHA256(chunk);

      await this.uploadFileChunk({
        projectId: options.projectId,
        orgId: options.orgId,
        file: chunk,
        fileName: options.file.name,
        chunkIndex: i,
        isLast,
        hash,
        bearerToken: options.bearerToken,
        handleBusinessErrors: true,
      });

      // Report progress
      if (options.onProgress) {
        const progress = Math.round(((i + 1) / totalChunks) * 100);
        options.onProgress(progress);
      }
    }
  }

  /**
   * Calculate SHA-256 hash of a blob
   */
  private async calculateSHA256(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Delete a file from a project
   */
  async deleteFile(options: {
    orgId: string;
    projectId: string;
    fileId: string;
    bearerToken: string;
  }): Promise<NoDataResponse> {
    const RELATIVE_URL = `/org/${options.orgId}/file/${options.projectId}/${options.fileId}`;

    const response = await this.deleteRequest<NoDataResponse, object>({
      url: this.buildUrl(RELATIVE_URL),
      bearerToken: options.bearerToken,
      data: {},
      handleBusinessErrors: true,
    });

    return response;
  }
}

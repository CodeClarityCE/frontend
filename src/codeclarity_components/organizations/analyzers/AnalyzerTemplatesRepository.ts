import {
  BaseRepository,
  type AuthRepoMethodGetRequestOptions,
} from "../../../utils/api/BaseRepository";
import { type DataResponse } from "../../../utils/api/responses/DataResponse";
import type { TemplateStep } from "./shared/analyzerUtils";

export interface AnalyzerTemplate {
  name: string;
  description: string;
  supported_languages: string[];
  language_config: Record<string, { plugins: string[] }>;
  logo: string;
  steps: TemplateStep[][];
}

export interface GetTemplatesRequestOptions extends AuthRepoMethodGetRequestOptions {}

export interface GetTemplateByLanguageOptions extends AuthRepoMethodGetRequestOptions {
  language: string;
}

export class AnalyzerTemplatesRepository extends BaseRepository {
  async getTemplates(
    options: GetTemplatesRequestOptions,
  ): Promise<DataResponse<AnalyzerTemplate[]>> {
    const RELATIVE_URL = "/analyzer-templates";

    return await this.getRequest<DataResponse<AnalyzerTemplate[]>>({
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });
  }

  async getTemplateByLanguage(
    options: GetTemplateByLanguageOptions,
  ): Promise<DataResponse<AnalyzerTemplate>> {
    const RELATIVE_URL = `/analyzer-templates/${options.language}`;

    return await this.getRequest<DataResponse<AnalyzerTemplate>>({
      bearerToken: options.bearerToken,
      url: this.buildUrl(RELATIVE_URL),
      handleBusinessErrors: options.handleBusinessErrors,
      handleHTTPErrors: options.handleHTTPErrors,
      handleOtherErrors: options.handleOtherErrors,
    });
  }
}

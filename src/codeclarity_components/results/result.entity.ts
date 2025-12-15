import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export interface AnalysisInfo {
    status?: string;
    errors?: unknown[];
    [key: string]: unknown;
}

export type WorkspaceData = Record<string, unknown>;

export class Result {
    @IsNotEmpty()
    @IsString()
    plugin!: string;

    @IsNotEmpty()
    result!: unknown;

    @IsOptional()
    @IsString()
    created_on?: string;
}

export interface ResultObject {
    result: {
        workspaces: Map<string, WorkspaceData>;
    };
    analysis_info: AnalysisInfo;
}

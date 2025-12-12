import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class Result {
    @IsNotEmpty()
    @IsString()
    plugin!: string;

    @IsNotEmpty()
    result!: any;

    @IsOptional()
    @IsString()
    created_on?: string;
}

export interface ResultObject {
    result: {
        workspaces: Map<string, any>;
    };
    analysis_info: any;
}

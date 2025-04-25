import { IsNotEmpty, IsString } from 'class-validator';
export class Result {
    @IsNotEmpty()
    @IsString()
    plugin!: string;

    @IsNotEmpty()
    result!: any;
}

export interface ResultObject {
    result: {
        workspaces: Map<string, any>;
    };
    analysis_info: any;
}

import { Type } from 'class-transformer';
import { IsDate, IsDefined, IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { TeamMember } from '../organizations/organization.entity';
import { Analyzer } from '../organizations/analyzers/Analyzer';

export enum AnalysisStatus {
    REQUESTED = 'requested',
    TRIGGERED = 'triggered',
    STARTED = 'started',
    FINISHED = 'finished',
    COMPLETED = 'completed',
    FAILED = 'failed',
    FAILURE = 'failure',
    SUCCESS = 'success',
    UPDATING_DB = 'updating_db',
    ONGOING = 'ongoing'
}

export class Analysis {
    @IsNotEmpty()
    id!: string;

    @IsDate()
    @Type(() => Date)
    created_on!: Date;

    @IsNotEmpty()
    @Type(() => Analyzer)
    analyzer!: Analyzer;

    // @IsOptional()
    // @Type(() => TeamMember)
    // created_by?: TeamMember;

    // @IsDefined()
    // config!: { [key: string]: { [key: string]: any } };

    // @IsNumber()
    // stage!: number;

    @IsEnum(AnalysisStatus)
    status!: AnalysisStatus;

    @IsDefined()
    steps!: AnalysisStage[][];

    // @IsOptional()
    // @Type(() => Date)
    // started_on?: Date;

    // @IsOptional()
    // @Type(() => Date)
    // ended_on?: Date;

    @IsNotEmpty()
    branch!: string;

    // @IsOptional()
    // @IsNotEmpty()
    // tag?: string;

    // @IsOptional()
    // @IsNotEmpty()
    // commit_hash?: string;

    // @IsNotEmpty()
    // project_id!: string;

    // @IsNotEmpty()
    // organization_id!: string;
}

export class StageBase {
    Name!: string;
    Version!: string;
}

export class Stage extends StageBase {
    config!: { [key: string]: any };
    persistant_config!: { [key: string]: any };
}

export class AnalysisStage extends StageBase {
    Status!: AnalysisStatus;
    Result: string | undefined;
    Started_on?: Date;
    Ended_on?: Date;
}

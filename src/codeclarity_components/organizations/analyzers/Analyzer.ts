import { Type } from 'class-transformer';
import { IsDate, IsDefined, IsNotEmpty, IsOptional } from 'class-validator';
import { TeamMember } from '../organization.entity';

export class Analyzer {
    @IsNotEmpty()
    id!: string;

    @IsNotEmpty()
    name!: string;

    @IsNotEmpty()
    description!: string;

    @IsDate()
    @Type(() => Date)
    created_on!: Date;

    @IsOptional()
    @Type(() => TeamMember)
    created_by?: TeamMember;

    @IsDefined()
    steps!: Stage[][];

    @IsDefined()
    organization_id!: string;
}

/********************************************/
/*                Other types               */
/********************************************/

export interface StageBase {
    name: string;
    version: string;
}

export interface Stage extends StageBase {
    config: { [key: string]: any };
    persistant_config: { [key: string]: any };
}

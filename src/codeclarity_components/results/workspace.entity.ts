import { IsNotEmpty } from 'class-validator';

export class WorkspacesOutput {
    @IsNotEmpty()
    workspaces!: string[];

    @IsNotEmpty()
    package_manager!: string;
}

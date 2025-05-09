import { IsNotEmpty } from 'class-validator';

export class WorkspacesOutput {
    @IsNotEmpty()
    workspaces!: Array<string>;

    @IsNotEmpty()
    package_manager!: string;
}

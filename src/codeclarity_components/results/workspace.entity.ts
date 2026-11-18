import { IsNotEmpty } from "class-validator";

export class WorkspacesOutput {
  @IsNotEmpty()
  workspaces!: string[];

  @IsNotEmpty()
  package_manager!: string;

  // Package manager of each workspace; older APIs leave it out.
  package_managers?: Record<string, string>;

  // Package manager of each ecosystem in each workspace; older APIs leave it out.
  ecosystem_package_managers?: Record<string, Record<string, string>>;
}

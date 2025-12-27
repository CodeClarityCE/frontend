import { IsArray, IsNotEmpty, IsObject, IsString } from "class-validator";
export class Plugin {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsString()
  version!: string;

  @IsArray()
  depends_on!: string[];

  @IsObject()
  config!: Record<string, unknown>;
}

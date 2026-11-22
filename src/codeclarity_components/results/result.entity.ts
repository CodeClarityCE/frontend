import { IsNotEmpty, IsOptional, IsString } from "class-validator";

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

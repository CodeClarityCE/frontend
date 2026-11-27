import { Type } from "class-transformer";
import { IsDate, IsOptional, IsString } from "class-validator";

export class RefreshToken {
  @IsString()
  token!: string;

  @IsDate()
  @Type(() => Date)
  token_expiry!: Date;

  // The API sends a new refresh token on every refresh; an older API sent none.
  @IsOptional()
  @IsString()
  refresh_token?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  refresh_token_expiry?: Date;
}

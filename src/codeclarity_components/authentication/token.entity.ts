import { Type } from "class-transformer";
import { IsDate, IsDefined, IsString } from "class-validator";

export class Token {
  @IsString()
  token!: string;

  @IsString()
  refresh_token!: string;

  @IsDefined()
  @IsDate()
  @Type(() => Date)
  token_expiry!: Date;

  @IsDefined()
  @IsDate()
  @Type(() => Date)
  refresh_token_expiry!: Date;
}

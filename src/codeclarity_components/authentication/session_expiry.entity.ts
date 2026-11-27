import { Type } from "class-transformer";
import { IsDate, IsDefined } from "class-validator";

/** When a sign-in's tokens end; the API keeps the tokens themselves in HttpOnly cookies. */
export class SessionExpiry {
  @IsDefined()
  @IsDate()
  @Type(() => Date)
  token_expiry!: Date;

  @IsDefined()
  @IsDate()
  @Type(() => Date)
  refresh_token_expiry!: Date;
}

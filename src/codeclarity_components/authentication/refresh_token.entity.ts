import { Type } from 'class-transformer';
import { IsDate, IsString } from 'class-validator';

export class RefreshToken {
    @IsString()
    token!: string;

    @IsDate()
    @Type(() => Date)
    token_expiry!: Date;
}

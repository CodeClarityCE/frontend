import { IsNotEmpty, IsNumber } from 'class-validator';

export class Response {
    @IsNumber()
    status_code!: number;

    @IsNotEmpty()
    status!: number;
}

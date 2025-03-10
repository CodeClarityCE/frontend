import { IsNotEmpty } from 'class-validator';

export class CreatedResponse {
    @IsNotEmpty()
    id!: string;
}

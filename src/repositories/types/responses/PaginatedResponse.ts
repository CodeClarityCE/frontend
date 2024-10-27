import { Exclude, Type } from 'class-transformer';
import { IsDefined, IsNotEmpty, IsNumber } from 'class-validator';

export class PaginatedResponse<T> {
    @Exclude({ toClassOnly: true })
    private type: Function;

    @IsDefined()
    @Type((options) => {
        return (options!.newObject as PaginatedResponse<T>).type;
    })
    data!: T[];

    @IsNumber()
    entry_count!: number;

    @IsNumber()
    page!: number;

    @IsNumber()
    entries_per_page!: number;

    @IsNumber()
    total_entries!: number;

    @IsNumber()
    total_pages!: number;

    @IsNotEmpty()
    status!: string;

    @IsNumber()
    matching_count!: number;

    @IsDefined()
    filter_count!: { [key: string]: number };

    constructor(type: Function) {
        this.type = type;
    }
}

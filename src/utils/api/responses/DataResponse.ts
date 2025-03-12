import { Exclude, Type } from 'class-transformer';
import { IsDefined } from 'class-validator';

export class DataResponse<T> {
    @Exclude()
    private type: Function;

    @IsDefined()
    @Type((options) => {
        return (options!.newObject as DataResponse<T>).type;
    })
    data!: T;

    constructor(type: Function) {
        this.type = type;
    }
}

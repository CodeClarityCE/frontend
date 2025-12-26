import { Exclude, Type } from 'class-transformer';
import { IsDefined } from 'class-validator';

type Constructor<T = unknown> = new (...args: unknown[]) => T;

export class DataResponse<T> {
    @Exclude()
    private type: Constructor<T>;

    @IsDefined()
    @Type((options) => {
        return (options!.newObject as DataResponse<T>).type;
    })
    data!: T;

    constructor(type: Constructor<T>) {
        this.type = type;
    }
}

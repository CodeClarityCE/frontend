import { Transform } from 'class-transformer';

export function OptionalTransform(type: (value: any) => any) {
    return Transform(({ value }) => {
        return value === null || value === undefined ? undefined : type(value);
    });
}

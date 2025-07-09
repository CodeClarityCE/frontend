import { Transform } from 'class-transformer';

export const OptionalDateTransform = (fieldName: string) =>
    Transform((v) => {
        return !v.obj[fieldName] || v.obj[fieldName] == ''
            ? undefined
            : new Date(Date.parse(v.obj[fieldName]));
    });

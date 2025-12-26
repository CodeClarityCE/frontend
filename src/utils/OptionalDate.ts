import { Transform, type TransformFnParams } from 'class-transformer';

export const OptionalDateTransform = (fieldName: string): PropertyDecorator =>
    Transform((v: TransformFnParams): Date | undefined => {
        const obj = v.obj as Record<string, unknown>;
        const value = obj[fieldName];
        return !value || value === '' ? undefined : new Date(Date.parse(value as string));
    });

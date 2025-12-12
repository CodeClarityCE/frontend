import { plainToInstance, type ClassConstructor, instanceToPlain } from 'class-transformer';
import { validateSync } from 'class-validator';
import { MalformedResponse } from './ApiErrors';

export abstract class Entity {
    static unMarshal<T>(plain: T, classConstructor: ClassConstructor<T>, validate?: boolean): T {
        const entity = plainToInstance(classConstructor, plain, { excludeExtraneousValues: false });
        if (validate === undefined || validate === true) Entity.validate(entity);
        return entity;
    }

    static unMarshalMany<T>(
        plain: T[],
        classConstructor: ClassConstructor<T>,
        validate?: boolean
    ): T[] {
        const entities = plainToInstance(classConstructor, plain, {
            excludeExtraneousValues: false
        });
        if (validate === undefined || validate === true) return Entity.validateMany(entities);
        return entities;
    }

    static marshal<T>(instance: T, validate?: boolean): any {
        if (validate === undefined || validate === true) Entity.validate(instance);
        return instanceToPlain(instance, { excludeExtraneousValues: false });
    }

    static marshalMany<T>(instances: T[], validate?: boolean): any[] {
        const validInstances: T[] = [];
        if (validate === undefined || validate === true)
            validInstances.push(...Entity.validateMany<T>(instances));
        const instancesPlain = [];
        for (const instance of validInstances) {
            instancesPlain.push(instanceToPlain(instance, { excludeExtraneousValues: false }));
        }
        return instancesPlain;
    }

    static validate(instance: any) {
        const errors = validateSync(instance, { stopAtFirstError: true });
        if (errors.length > 0) {
            console.error(errors);
            throw new MalformedResponse();
        }
    }

    static validateMany<T>(instances: any): T[] {
        const validItems: T[] = [];
        for (const instance of instances) {
            try {
                Entity.validate(instance);
                validItems.push(instance);
            } catch (error) {
                console.error(error);
                console.error('Entity failed validation:');
                console.error(instance);
            }
        }
        return validItems;
    }
}

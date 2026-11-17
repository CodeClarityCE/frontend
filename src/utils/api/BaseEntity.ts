import {
  type ClassConstructor,
  instanceToPlain,
  plainToInstance,
} from "class-transformer";
import { validateSync } from "class-validator";

import { logger } from "@/utils/logger";

import { MalformedResponse } from "./ApiErrors";

export abstract class Entity {
  static unMarshal<T>(
    plain: T,
    classConstructor: ClassConstructor<T>,
    validate?: boolean,
  ): T {
    const entity = plainToInstance(classConstructor, plain, {
      excludeExtraneousValues: false,
    });
    if (validate === undefined || validate === true) Entity.validate(entity);
    return entity;
  }

  static unMarshalMany<T>(
    plain: T[],
    classConstructor: ClassConstructor<T>,
    validate?: boolean,
  ): T[] {
    const entities = plainToInstance(classConstructor, plain, {
      excludeExtraneousValues: false,
    });
    if (validate === undefined || validate === true)
      return Entity.validateMany(entities);
    return entities;
  }

  static marshal<T>(instance: T, validate?: boolean): unknown {
    if (validate === undefined || validate === true) Entity.validate(instance);
    return instanceToPlain(instance, { excludeExtraneousValues: false });
  }

  static marshalMany<T>(instances: T[], validate?: boolean): unknown[] {
    const validInstances: T[] = [];
    if (validate === undefined || validate === true)
      validInstances.push(...Entity.validateMany<T>(instances));
    const instancesPlain = [];
    for (const instance of validInstances) {
      instancesPlain.push(
        instanceToPlain(instance, { excludeExtraneousValues: false }),
      );
    }
    return instancesPlain;
  }

  static validate(instance: unknown): void {
    const errors = validateSync(instance as object, { stopAtFirstError: true });
    if (errors.length > 0) {
      logger.debug("Entity failed validation", { errors });
      throw new MalformedResponse();
    }
  }

  static validateMany<T>(instances: unknown): T[] {
    if (!Array.isArray(instances)) {
      throw new MalformedResponse();
    }
    const validItems: T[] = [];
    for (const instance of instances) {
      try {
        Entity.validate(instance);
        validItems.push(instance as T);
      } catch (error) {
        // Bad items are skipped so the rest of the list still renders.
        logger.warn("Dropped an entity that failed validation", {
          entity: (instance as object | null)?.constructor?.name,
          stack: error instanceof Error ? error.stack : undefined,
          instance,
        });
      }
    }
    return validItems;
  }
}

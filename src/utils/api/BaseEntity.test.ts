import { IsString } from "class-validator";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { logger } from "@/utils/logger";

import { Entity } from "./BaseEntity";

vi.mock("@/utils/logger");

class Named {
  @IsString()
  name!: string;
}

beforeEach(() => {
  vi.mocked(logger.warn).mockClear();
});

describe("Entity.validate", () => {
  it("reports a warning naming the class, then throws", () => {
    const invalid = Object.assign(new Named(), { name: 42 });

    expect(() => Entity.validate(invalid)).toThrow();
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      "Entity failed validation",
      expect.objectContaining({ component: "Named" }),
    );
  });

  it("reports nothing for a valid entity", () => {
    Entity.validate(Object.assign(new Named(), { name: "ok" }));

    expect(logger.warn).not.toHaveBeenCalled();
  });
});

describe("Entity.validateMany", () => {
  it("drops an invalid item and reports a warning", () => {
    const valid = Object.assign(new Named(), { name: "ok" });
    const invalid = Object.assign(new Named(), { name: 42 });

    expect(Entity.validateMany<Named>([valid, invalid])).toEqual([valid]);
    expect(logger.warn).toHaveBeenCalledWith(
      "Dropped an entity that failed validation",
      expect.objectContaining({ component: "Named" }),
    );
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });
});

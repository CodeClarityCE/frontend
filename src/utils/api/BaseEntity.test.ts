import { IsString } from "class-validator";
import { describe, expect, it, vi } from "vitest";

import { logger } from "@/utils/logger";

import { Entity } from "./BaseEntity";

vi.mock("@/utils/logger");

class Named {
  @IsString()
  name!: string;
}

describe("Entity.validateMany", () => {
  it("drops an invalid item and reports a warning", () => {
    const valid = Object.assign(new Named(), { name: "ok" });
    const invalid = Object.assign(new Named(), { name: 42 });

    expect(Entity.validateMany<Named>([valid, invalid])).toEqual([valid]);
    expect(logger.warn).toHaveBeenCalledWith(
      "Dropped an entity that failed validation",
      expect.objectContaining({ entity: "Named" }),
    );
  });
});

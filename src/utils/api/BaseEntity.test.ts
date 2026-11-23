import { IsString } from "class-validator";
import { describe, expect, it } from "vitest";

import { createTestApp, type TestApp } from "../../../tests/real-app";

import { Entity } from "./BaseEntity";

class Named {
  @IsString()
  name!: string;
}

// The warnings the logger reported to the server.
function reports(app: TestApp): unknown[] {
  return app.http.requests
    .filter((r) => r.method === "POST" && r.path === "/logs")
    .map((r) => r.body);
}

describe("Entity.validate", () => {
  it("reports a warning naming the class, then throws", () => {
    const app = createTestApp({ signedIn: true });
    const invalid = Object.assign(new Named(), { name: 42 });

    expect(() => Entity.validate(invalid)).toThrow();
    expect(reports(app)).toEqual([
      expect.objectContaining({
        level: "warn",
        msg: "Entity failed validation",
        fields: expect.objectContaining({ component: "Named" }),
      }),
    ]);
  });

  it("reports nothing for a valid entity", () => {
    const app = createTestApp({ signedIn: true });

    Entity.validate(Object.assign(new Named(), { name: "ok" }));

    expect(reports(app)).toEqual([]);
  });
});

describe("Entity.validateMany", () => {
  it("drops an invalid item and reports a warning", () => {
    const app = createTestApp({ signedIn: true });
    const valid = Object.assign(new Named(), { name: "ok" });
    const invalid = Object.assign(new Named(), { name: 42 });

    expect(Entity.validateMany<Named>([valid, invalid])).toEqual([valid]);
    expect(reports(app)).toEqual([
      expect.objectContaining({
        level: "warn",
        msg: "Dropped an entity that failed validation",
        fields: expect.objectContaining({ component: "Named" }),
      }),
    ]);
  });
});

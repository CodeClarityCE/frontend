import { describe, expect, it } from "vitest";

import { APIErrors } from "./ApiErrors";

describe("APIErrors", () => {
  // The API's PluginFailed error sends this code (api src/types/error.types.ts).
  it("uses the code the API sends when a plugin failed", () => {
    expect(APIErrors.PluginFailed).toBe("PluginResultFailed");
  });
});

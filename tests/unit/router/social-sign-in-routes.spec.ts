import { describe, expect, it, vi } from "vitest";

import router from "@/router";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

describe("router", () => {
  it.each(["/auth/github/callback", "/auth/gitlab/callback"])(
    "sends %s to the not found page",
    (path) => {
      expect(router.resolve(path).matched[0]?.path).toBe("/:catchAll(.*)");
    },
  );
});

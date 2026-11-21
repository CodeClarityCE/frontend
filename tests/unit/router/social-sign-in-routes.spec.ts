import { describe, expect, it, vi } from "vitest";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

// The shared test setup mocks the router; this spec needs the real routes.
vi.unmock("@/router");

const { default: router } = await import("@/router");

describe("router", () => {
  it.each(["/auth/github/callback", "/auth/gitlab/callback"])(
    "sends %s to the not found page",
    (path) => {
      expect(router.resolve(path).matched[0]?.path).toBe("/:catchAll(.*)");
    },
  );
});

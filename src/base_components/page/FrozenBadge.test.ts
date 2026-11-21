import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import { FrozenBadge } from "@/base_components/page";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

describe("FrozenBadge", () => {
  it("says Frozen in words", () => {
    expect(mount(FrozenBadge).text()).toBe("Frozen");
  });
});

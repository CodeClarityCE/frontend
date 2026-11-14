import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import { FrozenBadge } from "@/base_components/page";

describe("FrozenBadge", () => {
  it("says Frozen in words", () => {
    expect(mount(FrozenBadge).text()).toBe("Frozen");
  });
});

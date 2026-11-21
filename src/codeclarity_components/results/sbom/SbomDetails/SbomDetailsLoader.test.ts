import { render, screen } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

import SbomDetailsLoader from "./SbomDetailsLoader.vue";

// Runs without the global store and router mocks.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

describe("SbomDetailsLoader", () => {
  it("tells assistive technology that the dependency is loading", () => {
    render(SbomDetailsLoader);
    expect(
      screen.getByRole("status", { name: "Loading the dependency" }),
    ).toBeTruthy();
  });
});

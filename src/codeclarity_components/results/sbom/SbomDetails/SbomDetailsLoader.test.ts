import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import SbomDetailsLoader from "./SbomDetailsLoader.vue";

describe("SbomDetailsLoader", () => {
  it("tells assistive technology that the dependency is loading", () => {
    render(SbomDetailsLoader);
    expect(
      screen.getByRole("status", { name: "Loading the dependency" }),
    ).toBeTruthy();
  });
});

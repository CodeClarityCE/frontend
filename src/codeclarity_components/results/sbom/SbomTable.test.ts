import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import { sbomDependency } from "./sbom.fixture";
import SbomTable from "./SbomTable.vue";

// The real useVModel, so typing in the search box filters the table.
vi.unmock("@vueuse/core");

const dependencies = [
  sbomDependency("lodash", "4.17.20", { newest_release: "4.17.21" }),
  sbomDependency("express", "4.18.2", {
    newest_release: "5.0.1",
    is_direct: true,
    is_direct_count: 1,
  }),
  sbomDependency("request", "2.88.2", {
    deprecated: true,
    deprecated_message: "request has been deprecated",
  }),
  sbomDependency("vitest", "3.2.0", {
    newest_release: "3.3.0",
    dev: true,
    prod: false,
    is_direct: true,
    is_direct_count: 1,
  }),
];

function show(): void {
  render(SbomTable, {
    props: { dependencies, analysisID: "a-1", projectID: "p-1" },
  });
}

// The visible text of a cell, with a space between separate pieces.
function readText(element: HTMLElement): string {
  const pieces = Array.from(element.querySelectorAll("*"))
    .filter((el) => el.children.length === 0)
    .map((el) => el.textContent?.trim() ?? "")
    .filter(Boolean);
  return pieces.length > 0
    ? pieces.join(" ")
    : (element.textContent?.trim() ?? "");
}

function rows(): string[][] {
  const table = screen.getByRole("table", { name: "Dependencies" });
  return within(table)
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell").map(readText));
}

describe("SbomTable", () => {
  it("lists dependencies by name with their update, scope and origin", () => {
    show();
    expect(rows().map((row) => [row[0], ...row.slice(2)])).toEqual([
      ["express", "4.18.2", "Major update 5.0.1", "No", "Direct", "Production"],
      [
        "lodash",
        "4.17.20",
        "Patch update 4.17.21",
        "No",
        "Transitive",
        "Production",
      ],
      [
        "request",
        "2.88.2",
        "Up to date",
        "Deprecated",
        "Transitive",
        "Production",
      ],
      ["vitest", "3.2.0", "Minor update 3.3.0", "No", "Direct", "Development"],
    ]);
  });

  it("links each dependency to its details", () => {
    show();
    expect(screen.getByRole("link", { name: "lodash" })).toBeTruthy();
  });

  it("filters dependencies by search", async () => {
    show();
    await userEvent.type(
      screen.getByRole("searchbox", { name: "Search dependencies" }),
      "vite",
    );
    await flushPromises();
    expect(rows().map((row) => row[0])).toEqual(["vitest"]);
  });

  it("sorts by name the other way when the header is pressed", async () => {
    show();
    await userEvent.click(screen.getByRole("button", { name: /Package/ }));
    await flushPromises();
    expect(rows().map((row) => row[0])).toEqual([
      "vitest",
      "request",
      "lodash",
      "express",
    ]);
  });
});

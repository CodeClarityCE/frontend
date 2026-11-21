import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import {
  ANALYSIS_ID,
  analysisPath,
  PROJECT_ID,
} from "../../../../tests/fixtures/results";
import { createTestApp } from "../../../../tests/real-app";

import VulnContent from "./VulnContent.vue";

async function show(stats: Record<string, unknown>): Promise<void> {
  const app = createTestApp({ signedIn: true });
  await app.visit("/projects");
  app.http.on("GET", `${analysisPath}/sbom/workspaces`, {
    data: { workspaces: ["."], package_manager: "NPM" },
  });
  app.http.on("GET", `${analysisPath}/vulnerabilities/stats`, { data: stats });
  render(VulnContent, {
    props: { analysisID: ANALYSIS_ID, projectID: PROJECT_ID },
    global: app.global,
  });
  await flushPromises();
}

function tile(label: string): string {
  const numbers = screen.getByRole("list", { name: "Vulnerability numbers" });
  const item = within(numbers)
    .getAllByRole("listitem")
    .find((li) => li.textContent?.startsWith(label));
  return item?.querySelector(".text-2xl")?.textContent?.trim() ?? "";
}

describe("VulnContent security grade", () => {
  it("leaves a disputed critical out of the grade but still counts it", async () => {
    // One disputed critical, one high and one medium.
    await show({
      number_of_vulnerabilities: 3,
      number_of_critical: 1,
      number_of_high: 1,
      number_of_medium: 1,
      number_of_disputed: 1,
      graded_number_of_vulnerabilities: 2,
      graded_number_of_critical: 0,
      graded_number_of_high: 1,
    });

    expect(tile("Vulnerabilities")).toBe("3");
    expect(tile("Critical and high")).toBe("2");
    expect(tile("Security grade")).toBe("B");
  });

  it("grades on the plain counts when the stats have no grade inputs", async () => {
    await show({
      number_of_vulnerabilities: 3,
      number_of_critical: 1,
      number_of_high: 1,
      number_of_medium: 1,
    });

    expect(tile("Security grade")).toBe("D+");
  });
});

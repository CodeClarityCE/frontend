import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import VulnContent from "./VulnContent.vue";

const repo = vi.hoisted(() => ({ getVulnerabilitiesStat: vi.fn() }));
vi.mock("@/codeclarity_components/results/results.repository", () => ({
  ResultsRepository: class {
    getVulnerabilitiesStat = repo.getVulnerabilitiesStat;
  },
}));
vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getToken: "token", getAuthenticated: true }),
}));
vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ getDefaultOrg: { id: "org-1" } }),
}));

async function show(): Promise<void> {
  render(VulnContent, {
    props: { analysisID: "a-1", projectID: "p-1" },
    global: { stubs: { SelectWorkspace: true, ColumnChart: true } },
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
  beforeEach(() => {
    repo.getVulnerabilitiesStat.mockReset();
  });

  it("leaves a disputed critical out of the grade but still counts it", async () => {
    // One disputed critical, one high and one medium.
    repo.getVulnerabilitiesStat.mockResolvedValue({
      data: {
        number_of_vulnerabilities: 3,
        number_of_critical: 1,
        number_of_high: 1,
        number_of_medium: 1,
        number_of_disputed: 1,
        graded_number_of_vulnerabilities: 2,
        graded_number_of_critical: 0,
        graded_number_of_high: 1,
      },
    });

    await show();

    expect(tile("Vulnerabilities")).toBe("3");
    expect(tile("Critical and high")).toBe("2");
    expect(tile("Security grade")).toBe("B");
  });

  it("grades on the plain counts when the stats have no grade inputs", async () => {
    repo.getVulnerabilitiesStat.mockResolvedValue({
      data: {
        number_of_vulnerabilities: 3,
        number_of_critical: 1,
        number_of_high: 1,
        number_of_medium: 1,
      },
    });

    await show();

    expect(tile("Security grade")).toBe("D+");
  });
});

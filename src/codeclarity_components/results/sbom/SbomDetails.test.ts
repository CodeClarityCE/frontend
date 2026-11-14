import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SbomDetails from "./SbomDetails.vue";
import { dependency } from "./SbomDetails/dependency.fixture";

const repo = vi.hoisted(() => ({ getDependency: vi.fn() }));
vi.mock("@/codeclarity_components/results/results.repository", () => ({
  ResultsRepository: class {
    getDependency = repo.getDependency;
  },
}));
vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getToken: "token" }),
}));
vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ getDefaultOrg: { id: "org-1" } }),
}));
const router = vi.hoisted(() => ({
  back: vi.fn(),
  query: { package_id: "lodash@4.17.20" },
}));
vi.mock("vue-router", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useRoute: () => ({ query: router.query, params: {} }),
  useRouter: () => ({ back: router.back, push: vi.fn() }),
}));

async function show(
  overrides: Parameters<typeof dependency>[0] = {},
): Promise<void> {
  repo.getDependency.mockResolvedValue({ data: dependency(overrides) });
  render(SbomDetails, {
    props: { analysisID: "a-1", projectID: "p-1", showBack: true, runIndex: 1 },
    global: { stubs: { SbomDependencyGraph: true } },
  });
  await flushPromises();
}

// The visible text pieces of an element, in reading order.
function texts(element: HTMLElement): string[] {
  return Array.from(element.querySelectorAll("*"))
    .filter((el) => el.children.length === 0)
    .map((el) => el.textContent?.trim() ?? "")
    .filter(Boolean);
}

function tile(label: string): string[] {
  const list = screen.getByRole("list", { name: "Dependency numbers" });
  return texts(within(list).getByText(label).closest("li") as HTMLElement);
}

describe("SbomDetails", () => {
  beforeEach(() => {
    router.back.mockReset();
  });

  it("loads the dependency named in the address", async () => {
    await show();
    expect(
      screen.getByRole("heading", { level: 1, name: /lodash/ }),
    ).toBeTruthy();
    expect(repo.getDependency).toHaveBeenCalledWith(
      expect.objectContaining({ dependency: "lodash@4.17.20", runIndex: 1 }),
    );
  });

  it("grades a package without vulnerabilities A", async () => {
    await show();
    expect(tile("Security score").slice(0, 2)).toEqual(["Security score", "A"]);
    expect(tile("License").slice(0, 2)).toEqual(["License", "MIT"]);
  });

  it("grades a package with a critical vulnerability F and links to it", async () => {
    await show({
      vulnerabilities: ["CVE-2021-23337"],
      severity_dist: { critical: 1, high: 0, medium: 0, low: 0, none: 0 },
    });
    expect(tile("Security score").slice(0, 2)).toEqual(["Security score", "F"]);
    expect(tile("Vulnerabilities")).toContain("1 critical or high");
    expect(screen.getByRole("link", { name: /CVE-2021-23337/ })).toBeTruthy();
    expect(screen.getByText("Fix critical and high first.")).toBeTruthy();
  });

  it("goes back to the results", async () => {
    await show();
    await userEvent.click(
      screen.getByRole("button", { name: /Back to results/ }),
    );
    expect(router.back).toHaveBeenCalled();
  });

  it("says so when the dependency cannot be loaded", async () => {
    repo.getDependency.mockRejectedValue(new Error("down"));
    render(SbomDetails, {
      props: { analysisID: "a-1", projectID: "p-1" },
      global: { stubs: { SbomDependencyGraph: true } },
    });
    await flushPromises();
    expect(screen.getByText("Could not load this dependency")).toBeTruthy();
  });
});

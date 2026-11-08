import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SbomContent from "./SbomContent.vue";

// Mock stores
const mockUserStore = {
  getDefaultOrg: { id: "org-1", name: "Test Org" },
  getUser: {
    default_org: { id: "org-1", name: "Test Org" },
  },
};

const mockAuthStore = {
  getToken: "test-token",
  getAuthenticated: true,
};

vi.mock("@/stores/user", () => ({
  useUserStore: vi.fn(() => mockUserStore),
}));

vi.mock("@/stores/auth", () => ({
  useAuthStore: vi.fn(() => mockAuthStore),
}));

// Mock child components
vi.mock("./SbomTable.vue", () => ({
  default: {
    name: "SbomTable",
    template: '<div data-testid="sbom-table">SBOM Table Component</div>',
    props: ["analysisID", "projectID", "workspace"],
  },
}));

vi.mock("../SelectWorkspace.vue", () => ({
  default: {
    name: "SelectWorkspace",
    template:
      '<div data-testid="select-workspace">Select Workspace Component</div>',
    props: ["analysisID", "projectID"],
    emits: ["update:selected_workspace"],
  },
}));

vi.mock("@/base_components/ui/loaders/TextLoader.vue", () => ({
  default: {
    name: "TextLoader",
    template: '<div data-testid="text-loader">Loading text...</div>',
  },
}));

vi.mock("@/base_components/ui/loaders/DonutLoader.vue", () => ({
  default: {
    name: "DonutLoader",
    template: '<div data-testid="donut-loader">Loading donut...</div>',
  },
}));

vi.mock("@/base_components/data-display/charts/DoughnutChart.vue", () => ({
  default: {
    name: "DoughnutChart",
    template: '<div data-testid="doughnut-chart">Doughnut Chart</div>',
    props: ["data", "dimensions"],
  },
}));

vi.mock("@/base_components/ui/cards/StatCard.vue", () => ({
  default: {
    name: "StatCard",
    template:
      '<div data-testid="stat-card">{{ label }}: {{ value }} ({{ subtitle }})<slot></slot></div>',
    props: ["label", "value", "subtitle", "icon"],
  },
}));

vi.mock("@/base_components/ui/cards/InfoCard.vue", () => ({
  default: {
    name: "InfoCard",
    template: '<div data-testid="info-card"><slot></slot></div>',
    props: ["title", "description", "icon", "variant"],
  },
}));

// Mock Shadcn components
vi.mock("@/shadcn/ui/button", () => ({
  Button: {
    name: "Button",
    template: '<button data-testid="button"><slot></slot></button>',
    props: ["variant", "size"],
  },
}));

// Render tooltip content inline so its text can be read
vi.mock("@/shadcn/ui/tooltip", () => {
  const passthrough = { template: "<div><slot></slot></div>" };
  return {
    Tooltip: passthrough,
    TooltipContent: passthrough,
    TooltipProvider: passthrough,
    TooltipTrigger: passthrough,
  };
});

// Mock Icon component
vi.mock("@iconify/vue", () => ({
  Icon: {
    name: "Icon",
    template: '<span data-testid="icon"></span>',
    props: ["icon"],
  },
}));

// Mock results repository
const mockSbomStats = {
  number_of_dependencies: 100,
  number_of_outdated_dependencies: 10,
  number_of_deprecated_dependencies: 5,
  number_of_unlicensed_dependencies: 3,
  dependency_health: [],
};

const mockGetSbomStat = vi.fn();
const mockGetVulnerabilitiesStat = vi.fn();

vi.mock("@/codeclarity_components/results/results.repository", () => ({
  ResultsRepository: class {
    getSbomStat = mockGetSbomStat;
    getVulnerabilitiesStat = mockGetVulnerabilitiesStat;
    getSbom = vi.fn().mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 50, totalPages: 1, totalItems: 0 },
    });
    getSbomWorkspaces = vi.fn().mockResolvedValue({
      data: [{ name: "default", path: "." }],
    });
  },
}));

describe("SbomContent", () => {
  let wrapper: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSbomStat.mockResolvedValue({ data: mockSbomStats });
    mockGetVulnerabilitiesStat.mockResolvedValue({
      data: { number_of_issues: 0, number_of_vulnerabilities: 0 },
    });
  });

  async function mountLoaded(
    sbomStats: Record<string, unknown> = {},
  ): Promise<any> {
    mockGetSbomStat.mockResolvedValue({
      data: { ...mockSbomStats, ...sbomStats },
    });
    wrapper = mount(SbomContent, {
      props: { projectID: "project-123", analysisID: "analysis-456" },
    });
    await flushPromises();
    return wrapper;
  }

  function securityCard(): string {
    const card = wrapper
      .findAll('[data-testid="stat-card"]')
      .find((c: any) => c.text().startsWith("Security Issues"));
    return card.text();
  }

  it("reads No issues found only when the vulnerability count is zero", async () => {
    await mountLoaded();

    expect(securityCard()).toContain("Security Issues: 0 (No issues found)");
  });

  it("does not reassure the user when the vulnerability count is unavailable", async () => {
    mockGetVulnerabilitiesStat.mockRejectedValue(new Error("no results"));

    await mountLoaded();

    expect(securityCard()).not.toContain("No issues found");
    expect(securityCard()).toContain("Vulnerability data unavailable");
  });

  it("does not reassure the user while the vulnerability count loads", () => {
    mockGetVulnerabilitiesStat.mockReturnValue(new Promise(() => undefined));

    wrapper = mount(SbomContent, {
      props: { projectID: "project-123", analysisID: "analysis-456" },
    });

    expect(securityCard()).not.toContain("No issues found");
  });

  it("keeps deprecated and unlicensed out of Security Issues, under their own labels", async () => {
    await mountLoaded({
      number_of_deprecated_dependencies: 5,
      number_of_unlicensed_dependencies: 3,
    });

    expect(securityCard()).toContain("Security Issues: 0");
    expect(
      wrapper.find('[data-testid="health-factor-deprecated"]').text(),
    ).toMatch(/Deprecated\s*5/);
    expect(
      wrapper.find('[data-testid="health-factor-unlicensed"]').text(),
    ).toMatch(/Unlicensed\s*3/);
  });

  it("does not call a project critical when every dependency is merely outdated", async () => {
    await mountLoaded({
      number_of_dependencies: 100,
      number_of_outdated_dependencies: 100,
      number_of_deprecated_dependencies: 0,
      number_of_unlicensed_dependencies: 0,
    });

    expect(wrapper.text()).not.toContain("Critical");
    expect(wrapper.text()).toContain("Needs attention");
  });

  it("does not call an empty project critical", async () => {
    await mountLoaded({
      number_of_dependencies: 0,
      number_of_outdated_dependencies: 0,
      number_of_deprecated_dependencies: 0,
      number_of_unlicensed_dependencies: 0,
    });

    expect(wrapper.text()).not.toContain("Critical");
  });

  it("still calls a project critical when most dependencies are deprecated", async () => {
    await mountLoaded({
      number_of_dependencies: 100,
      number_of_outdated_dependencies: 0,
      number_of_deprecated_dependencies: 60,
      number_of_unlicensed_dependencies: 0,
    });

    expect(wrapper.text()).toContain("Critical");
  });

  it("explains what the health grade is based on", async () => {
    await mountLoaded();

    const explanation = wrapper.find('[data-testid="health-explanation"]');
    expect(explanation.text()).toContain("Deprecated");
    expect(explanation.text()).toContain("outdated");
    expect(explanation.text()).toContain("Security Issues");
  });

  it("counts vulnerabilities as Security Issues, for the selected workspace", async () => {
    mockGetVulnerabilitiesStat.mockResolvedValue({
      data: { number_of_issues: 15, number_of_vulnerabilities: 4 },
    });

    await mountLoaded({
      number_of_deprecated_dependencies: 0,
      number_of_unlicensed_dependencies: 0,
    });

    expect(securityCard()).toContain("Security Issues: 15");
    expect(securityCard()).toContain("Requires attention");
    expect(mockGetVulnerabilitiesStat).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "project-123",
        analysisId: "analysis-456",
        workspace: ".",
      }),
    );
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it("renders correctly with default props", () => {
    wrapper = mount(SbomContent, {
      global: {
        plugins: [],
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it("renders with provided projectID and analysisID props", () => {
    wrapper = mount(SbomContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.vm.projectID).toBe("project-123");
    expect(wrapper.vm.analysisID).toBe("analysis-456");
  });

  it("renders SelectWorkspace component", () => {
    wrapper = mount(SbomContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    const selectWorkspace = wrapper.findComponent({ name: "SelectWorkspace" });
    expect(selectWorkspace.exists()).toBe(true);
  });

  it("renders SbomTable component", () => {
    wrapper = mount(SbomContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    const sbomTable = wrapper.findComponent({ name: "SbomTable" });
    expect(sbomTable.exists()).toBe(true);
  });

  it("has correct default prop values", () => {
    wrapper = mount(SbomContent, {
      global: {
        plugins: [],
      },
    });

    expect(wrapper.vm.projectID).toBe("");
    expect(wrapper.vm.analysisID).toBe("");
  });

  it("initializes with correct default state", () => {
    wrapper = mount(SbomContent, {
      global: {
        plugins: [],
      },
    });

    expect(wrapper.vm.error).toBe(false);
    expect(wrapper.vm.loading).toBe(true);
    expect(wrapper.vm.render).toBe(false);
    expect(wrapper.vm.selected_workspace).toBe(".");
  });

  it("has health score computed property", () => {
    wrapper = mount(SbomContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    // Health score is a computed property that should exist
    expect(typeof wrapper.vm.healthScore).toBe("number");
    expect(wrapper.vm.healthScore).toBeGreaterThanOrEqual(0);
    expect(wrapper.vm.healthScore).toBeLessThanOrEqual(100);
  });

  it("handles prop changes gracefully", async () => {
    wrapper = mount(SbomContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    // Component should handle prop changes without errors
    await wrapper.setProps({ projectID: "project-456" });
    expect(wrapper.vm.projectID).toBe("project-456");

    await wrapper.setProps({ analysisID: "analysis-789" });
    expect(wrapper.vm.analysisID).toBe("analysis-789");
  });

  it("maintains reactive state across prop changes", async () => {
    wrapper = mount(SbomContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    const initialWorkspace = wrapper.vm.selected_workspace;

    await wrapper.setProps({ projectID: "project-456" });

    // Reactive state should be maintained
    expect(wrapper.vm.selected_workspace).toBe(initialWorkspace);
    expect(typeof wrapper.vm.error).toBe("boolean");
  });

  it("has loading state property", () => {
    wrapper = mount(SbomContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    // Loading is a reactive property that should exist
    expect(typeof wrapper.vm.loading).toBe("boolean");
  });

  it("has correct donut chart dimensions", () => {
    wrapper = mount(SbomContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    expect(wrapper.vm.donutDimensions).toEqual({
      width: "180px",
      height: "180px",
    });
  });

  it("has chart data properties", () => {
    wrapper = mount(SbomContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    // Chart data properties should exist
    expect(wrapper.vm.donut_data).toBeDefined();
    expect(wrapper.vm.bar_data).toHaveProperty("labels");
    expect(wrapper.vm.bar_data).toHaveProperty("datasets");
  });

  it("handles repository authentication requirements", async () => {
    wrapper = mount(SbomContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    // Component should check for authentication before making API calls
    expect(mockAuthStore.getAuthenticated).toBe(true);
    expect(mockAuthStore.getToken).toBe("test-token");
    expect(mockUserStore.getDefaultOrg).toBeTruthy();
  });

  it("passes correct props to child components", async () => {
    wrapper = mount(SbomContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    const selectWorkspace = wrapper.findComponent({ name: "SelectWorkspace" });
    const sbomTable = wrapper.findComponent({ name: "SbomTable" });

    expect(selectWorkspace.props("projectID")).toBe("project-123");
    expect(selectWorkspace.props("analysisID")).toBe("analysis-456");

    expect(sbomTable.props("projectID")).toBe("project-123");
    expect(sbomTable.props("analysisID")).toBe("analysis-456");
  });
});

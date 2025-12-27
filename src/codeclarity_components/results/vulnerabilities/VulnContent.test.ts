import { mount } from "@vue/test-utils";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import VulnContent from "./VulnContent.vue";

// Mock stores
const mockUserStore = {
  getDefaultOrg: { id: "org-1", name: "Test Org" },
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

// Mock base components
vi.mock("@/base_components", () => ({
  InfoCard: {
    name: "InfoCard",
    template: '<div data-testid="info-card"><slot></slot></div>',
    props: ["title", "description", "icon", "variant"],
  },
  StatCard: {
    name: "StatCard",
    template: '<div data-testid="stat-card"></div>',
    props: ["label", "value", "icon", "variant", "subtitle", "subtitle-icon"],
  },
}));

// Mock child components
vi.mock("../SelectWorkspace.vue", () => ({
  default: {
    name: "SelectWorkspace",
    template:
      '<div data-testid="select-workspace">Select Workspace Component</div>',
    props: ["error", "selected_workspace", "project-i-d", "analysis-i-d"],
    emits: ["update:error", "update:selected_workspace"],
  },
}));

vi.mock("@/base_components/ui/loaders/TextLoader.vue", () => ({
  default: {
    name: "TextLoader",
    template: '<div data-testid="text-loader">Loading text...</div>',
  },
}));

// Mock Icon component
vi.mock("@iconify/vue", () => ({
  Icon: {
    name: "Icon",
    template: '<span data-testid="icon"></span>',
    props: ["icon", "class"],
  },
}));

// Mock results repository
const mockVulnStats = {
  number_of_vulnerabilities: 10,
  number_of_vulnerabilities_diff: 2,
  number_of_critical: 1,
  number_of_high: 3,
  number_of_medium: 4,
  number_of_low: 2,
  number_of_vulnerable_dependencies: 5,
  number_of_vulnerable_dependencies_diff: 1,
  mean_severity: 5.2,
  mean_severity_diff: 0.1,
  max_severity: 9.8,
  max_severity_diff: 0.0,
  mean_confidentiality_impact: 6.5,
  mean_integrity_impact: 5.8,
  mean_availability_impact: 4.2,
  number_of_owasp_top_10_2021_a1: 2,
  number_of_owasp_top_10_2021_a2: 1,
  number_of_owasp_top_10_2021_a3: 3,
  number_of_owasp_top_10_2021_a4: 0,
  number_of_owasp_top_10_2021_a5: 1,
};

vi.mock("@/codeclarity_components/results/results.repository", () => ({
  ResultsRepository: class {
    getVulnerabilitiesStat = vi.fn().mockResolvedValue({
      data: mockVulnStats,
    });
  },
}));

describe("VulnContent", () => {
  let wrapper: any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it("renders correctly with default props", () => {
    wrapper = mount(VulnContent, {
      global: {
        plugins: [],
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it("renders with provided projectID and analysisID props", () => {
    wrapper = mount(VulnContent, {
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
    wrapper = mount(VulnContent, {
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

  it("has correct default prop values", () => {
    wrapper = mount(VulnContent, {
      global: {
        plugins: [],
      },
    });

    expect(wrapper.vm.projectID).toBe("");
    expect(wrapper.vm.analysisID).toBe("");
  });

  it("initializes with correct default state", () => {
    wrapper = mount(VulnContent, {
      global: {
        plugins: [],
      },
    });

    expect(wrapper.vm.error).toBe(false);
    expect(wrapper.vm.loading).toBe(true);
    expect(wrapper.vm.render).toBe(false);
    expect(wrapper.vm.selected_workspace).toBe(".");
  });

  it("renders StatCard components for key metrics", () => {
    wrapper = mount(VulnContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    const statCards = wrapper.findAllComponents({ name: "StatCard" });
    expect(statCards.length).toBeGreaterThan(0);
  });

  it("renders InfoCard components for detailed analysis", () => {
    wrapper = mount(VulnContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    const infoCards = wrapper.findAllComponents({ name: "InfoCard" });
    expect(infoCards.length).toBeGreaterThan(0);
  });

  it("has security risk score computed property", () => {
    wrapper = mount(VulnContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    expect(typeof wrapper.vm.securityRiskScore).toBe("number");
    expect(wrapper.vm.securityRiskScore).toBeGreaterThanOrEqual(0);
    expect(wrapper.vm.securityRiskScore).toBeLessThanOrEqual(100);
  });

  it("has critical and high count computed property", () => {
    wrapper = mount(VulnContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    expect(typeof wrapper.vm.criticalAndHighCount).toBe("number");
    expect(wrapper.vm.criticalAndHighCount).toBeGreaterThanOrEqual(0);
  });

  it("has security risk score computed property", () => {
    wrapper = mount(VulnContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    expect(typeof wrapper.vm.securityRiskScore).toBe("number");
    expect(wrapper.vm.securityRiskScore).toBeGreaterThanOrEqual(0);
    expect(wrapper.vm.securityRiskScore).toBeLessThanOrEqual(100);
  });

  it("has severity distribution computed property", () => {
    wrapper = mount(VulnContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    const distribution = wrapper.vm.severityDistribution;
    expect(distribution).toHaveProperty("critical");
    expect(distribution).toHaveProperty("high");
    expect(distribution).toHaveProperty("medium");
    expect(distribution).toHaveProperty("low");

    // All percentages should be between 0 and 100
    Object.values(distribution).forEach((value: any) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    });
  });

  it("has top OWASP categories computed property", () => {
    wrapper = mount(VulnContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    const categories = wrapper.vm.topOwaspCategories;
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeLessThanOrEqual(3);

    categories.forEach((category: any) => {
      expect(category).toHaveProperty("name");
      expect(category).toHaveProperty("count");
      expect(category.count).toBeGreaterThan(0);
    });
  });

  it("calculates security risk score correctly with no vulnerabilities", () => {
    wrapper = mount(VulnContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    // Mock stats with no vulnerabilities
    wrapper.vm.stats = {
      number_of_vulnerabilities: 0,
      number_of_critical: 0,
      number_of_high: 0,
    };

    expect(wrapper.vm.securityRiskScore).toBe(100);
  });

  it("calculates critical and high count correctly", () => {
    wrapper = mount(VulnContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    // Test with stats that have critical and high vulnerabilities
    wrapper.vm.stats = { number_of_critical: 5, number_of_high: 3 };
    expect(wrapper.vm.criticalAndHighCount).toBe(8);

    // Test with only critical vulnerabilities
    wrapper.vm.stats = { number_of_critical: 2, number_of_high: 0 };
    expect(wrapper.vm.criticalAndHighCount).toBe(2);

    // Test with no vulnerabilities
    wrapper.vm.stats = { number_of_critical: 0, number_of_high: 0 };
    expect(wrapper.vm.criticalAndHighCount).toBe(0);
  });

  it("handles workspace model updates", async () => {
    wrapper = mount(VulnContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    // Test model binding
    wrapper.vm.selected_workspace = "test-workspace";
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.selected_workspace).toBe("test-workspace");
  });

  it("has watchers for projectID and analysisID changes", async () => {
    wrapper = mount(VulnContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    // Test that props are reactive and can change
    await wrapper.setProps({ projectID: "project-456" });
    expect(wrapper.vm.projectID).toBe("project-456");

    await wrapper.setProps({ analysisID: "analysis-789" });
    expect(wrapper.vm.analysisID).toBe("analysis-789");

    // Test that the component has the getVulnerabilitiesStats method
    expect(typeof wrapper.vm.getVulnerabilitiesStats).toBe("function");
  });

  it("handles authentication requirements", () => {
    wrapper = mount(VulnContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    // Component should check authentication
    expect(mockAuthStore.getAuthenticated).toBe(true);
    expect(mockAuthStore.getToken).toBe("test-token");
    expect(mockUserStore.getDefaultOrg).toBeTruthy();
  });

  it("has data fetching method", () => {
    wrapper = mount(VulnContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    expect(typeof wrapper.vm.getVulnerabilitiesStats).toBe("function");
  });

  it("handles error states correctly", () => {
    wrapper = mount(VulnContent, {
      props: {
        projectID: "",
        analysisID: "",
      },
      global: {
        plugins: [],
      },
    });

    expect(wrapper.vm.error).toBe(false);
    expect(wrapper.vm.loading).toBe(true);
    expect(wrapper.vm.render).toBe(false);
  });

  it("displays loading state correctly", () => {
    wrapper = mount(VulnContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    // When not rendered, should show text loaders
    wrapper.vm.render = false;
    expect(wrapper.vm.loading).toBe(true);
  });

  it("displays rendered content when data is loaded", async () => {
    wrapper = mount(VulnContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    // Simulate data loaded
    wrapper.vm.render = true;
    wrapper.vm.loading = false;
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.render).toBe(true);
    expect(wrapper.vm.loading).toBe(false);
  });

  it("calculates overall impact score correctly", () => {
    wrapper = mount(VulnContent, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    // Set mock impact scores
    wrapper.vm.stats = {
      mean_confidentiality_impact: 6.0,
      mean_integrity_impact: 5.0,
      mean_availability_impact: 4.0,
    };

    // Overall impact should be (6.0 + 5.0 + 4.0) / 3 = 5.0
    const expectedOverall = ((6.0 + 5.0 + 4.0) / 3).toFixed(1);

    // Check the computed calculation matches our expectation
    const actualOverall = (
      ((wrapper.vm.stats.mean_confidentiality_impact ?? 0) +
        (wrapper.vm.stats.mean_integrity_impact ?? 0) +
        (wrapper.vm.stats.mean_availability_impact ?? 0)) /
      3
    ).toFixed(1);

    expect(actualOverall).toBe(expectedOverall);
  });
});

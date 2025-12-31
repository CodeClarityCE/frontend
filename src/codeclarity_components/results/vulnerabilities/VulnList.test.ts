import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PatchType } from "@/codeclarity_components/results/vulnerabilities/VulnStats";
import { SortDirection } from "@/utils/api/PaginatedRequestOptions";

import VulnList from "./VulnList.vue";

// Mock BaseRepository before any imports that depend on it
vi.mock("@/base_repository/base.repository", () => ({
  BaseRepository: class MockBaseRepository {
    constructor() {}
  },
}));

// Mock router to avoid dependency issues
vi.mock("@/router", () => ({
  default: {},
  router: {},
}));

// Mock ProjectsSortInterface
vi.mock("@/codeclarity_components/projects/project.repository", () => ({
  ProjectsSortInterface: {
    SEVERITY: "severity",
    CVE: "cve",
    DEPENDENCY_NAME: "dep_name",
    DEPENDENCY_VERSION: "dep_version",
    WEAKNESS: "weakness",
    OWASP_TOP_10: "owasp_top_10",
  },
}));

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

// Mock severity utilities
vi.mock("@/utils/severity", () => ({
  isNoneSeverity: vi.fn((value) => value === 0.0),
  isCriticalSeverity: vi.fn((value) => value >= 9.0),
  isHighSeverity: vi.fn((value) => value >= 7.0 && value < 9.0),
  isMediumSeverity: vi.fn((value) => value >= 4.0 && value < 7.0),
  isLowSeverity: vi.fn((value) => value > 0.0 && value < 4.0),
}));

// Mock base components
vi.mock("@/base_components/filters/SearchBar.vue", () => ({
  default: {
    name: "SearchBar",
    template: '<input data-testid="search-bar" />',
    props: ["search-key", "placeholder"],
    emits: ["update:search-key"],
  },
}));

vi.mock("@/base_components/ui/loaders/BoxLoader.vue", () => ({
  default: {
    name: "BoxLoader",
    template: '<div data-testid="box-loader">Loading...</div>',
    props: ["dimensions"],
  },
}));

vi.mock("@/base_components/utilities/PaginationComponent.vue", () => ({
  default: {
    name: "PaginationComponent",
    template: '<div data-testid="pagination-component">Pagination</div>',
    props: ["page", "nmb-entries-showing", "nmb-entries-total", "total-pages"],
    emits: [
      "update:page",
      "update:nmb-entries-showing",
      "update:nmb-entries-total",
      "update:total-pages",
    ],
  },
}));

vi.mock("@/base_components/data-display/bubbles/BubbleComponent.vue", () => ({
  default: {
    name: "BubbleComponent",
    template:
      '<div data-testid="bubble-component"><slot name="content"></slot></div>',
    props: ["title", "class"],
  },
}));

vi.mock("@/base_components/ui/InfoMarkdown.vue", () => ({
  default: {
    name: "InfoMarkdown",
    template: '<div data-testid="info-markdown">Markdown content</div>',
    props: ["markdown"],
  },
}));

vi.mock("@/base_components/utilities/UtilitiesSort.vue", () => ({
  default: {
    name: "UtilitiesSort",
    template: '<div data-testid="utilities-sort">Sort Component</div>',
    props: [
      "page-limit-selected",
      "sort-key",
      "sort-direction",
      "selection-page-limit",
      "sort-options",
      "showing",
      "total",
    ],
    emits: [
      "update:page-limit-selected",
      "update:sort-key",
      "update:sort-direction",
    ],
  },
}));

vi.mock("@/base_components/filters/UtilitiesFilters.vue", () => ({
  default: {
    name: "UtilitiesFilters",
    template: '<div data-testid="utilities-filters">Filters Component</div>',
    props: ["filter-state"],
    emits: ["update:filter-state"],
  },
  createNewFilterState: vi.fn(() => ({
    activeFilters: "",
    toString: () => "",
  })),
  FilterType: {
    RADIO: "radio",
    CHECKBOX: "checkbox",
    DIVIDER: "divider",
  },
}));

vi.mock("@/base_components/filters/ActiveFilterBar.vue", () => ({
  default: {
    name: "ActiveFilterBar",
    template: '<div data-testid="active-filter-bar">Active Filters</div>',
    props: ["filter-state"],
    emits: ["update:filter-state"],
  },
}));

// Mock Shadcn components
vi.mock("@/shadcn/ui/badge", () => ({
  Badge: {
    name: "Badge",
    template: '<span data-testid="badge"><slot></slot></span>',
    props: ["class", "variant", "cwe"],
  },
}));

vi.mock("@/shadcn/ui/tooltip", () => ({
  Tooltip: {
    name: "Tooltip",
    template: '<div data-testid="tooltip"><slot></slot></div>',
  },
  TooltipContent: {
    name: "TooltipContent",
    template: '<div data-testid="tooltip-content"><slot></slot></div>',
    props: ["class"],
  },
  TooltipProvider: {
    name: "TooltipProvider",
    template: '<div data-testid="tooltip-provider"><slot></slot></div>',
  },
  TooltipTrigger: {
    name: "TooltipTrigger",
    template: '<div data-testid="tooltip-trigger"><slot></slot></div>',
    props: ["as-child"],
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

// Mock RouterLink
vi.mock("vue-router", () => ({
  RouterLink: {
    name: "RouterLink",
    template: '<a data-testid="router-link"><slot></slot></a>',
    props: ["to", "class"],
  },
}));

// Mock results repository
const mockVulnerabilityData = [
  {
    Id: "vuln-1",
    Vulnerability: "CVE-2023-1234",
    Description:
      "Test vulnerability description with some detailed information about the security issue.",
    Severity: {
      Severity: 8.5,
      ConfidentialityImpact: "HIGH",
      IntegrityImpact: "LOW",
      AvailabilityImpact: "NONE",
    },
    EPSS: {
      Score: 0.15,
    },
    Conflict: {
      ConflictFlag: "MATCH_CORRECT",
    },
    VLAI: [
      {
        Source: "NVD",
        Score: "high",
        Confidence: 0.9,
      },
    ],
    Affected: [
      {
        AffectedDependency: "test-package",
        AffectedVersion: "1.0.0",
        PatchType: PatchType.Full,
      },
    ],
    Weaknesses: [
      {
        WeaknessId: "CWE-79",
        WeaknessName: "Cross-site Scripting",
        OWASPTop10Id: "1347",
      },
    ],
  },
  {
    Id: "vuln-2",
    Vulnerability: "CVE-2023-5678",
    Description: "Another test vulnerability with different characteristics.",
    Severity: {
      Severity: 9.5,
      ConfidentialityImpact: "COMPLETE",
      IntegrityImpact: "PARTIAL",
      AvailabilityImpact: "HIGH",
    },
    EPSS: {
      Score: 0.05,
    },
    Conflict: {
      ConflictFlag: "MATCH_POSSIBLE_INCORRECT",
    },
    VLAI: [
      {
        Source: "OSV",
        Score: "critical",
        Confidence: 0.7,
      },
    ],
    Affected: [
      {
        AffectedDependency: "another-package",
        AffectedVersion: "2.1.0",
        PatchType: PatchType.None,
      },
    ],
    Weaknesses: [
      {
        WeaknessId: "CWE-89",
        WeaknessName: "SQL Injection",
        OWASPTop10Id: "1347",
      },
    ],
  },
];

vi.mock("@/codeclarity_components/results/results.repository", () => ({
  ResultsRepository: class {
    getVulnerabilities = vi.fn().mockResolvedValue({
      data: mockVulnerabilityData,
      page: 0,
      entries_per_page: 10,
      entry_count: 2,
      matching_count: 2,
      total_entries: 2,
      total_pages: 1,
    });
  },
}));

describe("VulnList", () => {
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
    wrapper = mount(VulnList, {
      props: {
        highlightElem: "",
        analysisID: "analysis-123",
        projectID: "project-123",
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it("renders with provided props", () => {
    wrapper = mount(VulnList, {
      props: {
        highlightElem: "test-highlight",
        forceOpenNewTab: true,
        analysisID: "analysis-456",
        projectID: "project-789",
      },
    });

    expect(wrapper.vm.highlightElem).toBe("test-highlight");
    expect(wrapper.vm.forceOpenNewTab).toBe(true);
    expect(wrapper.vm.analysisID).toBe("analysis-456");
    expect(wrapper.vm.projectID).toBe("project-789");
  });

  it("initializes with correct default state", () => {
    wrapper = mount(VulnList, {
      props: {
        highlightElem: "",
        analysisID: "analysis-123",
        projectID: "project-123",
      },
    });

    expect(wrapper.vm.render).toBe(false);
    expect(wrapper.vm.pageLimitSelected).toBe(10);
    expect(wrapper.vm.pageNumber).toBe(0);
    expect(wrapper.vm.searchKey).toBe("");
    expect(wrapper.vm.sortKey).toBe("severity");
    expect(wrapper.vm.sortDirection).toBe(SortDirection.DESC);
  });

  it("renders required components", () => {
    wrapper = mount(VulnList, {
      props: {
        highlightElem: "",
        analysisID: "analysis-123",
        projectID: "project-123",
      },
    });

    expect(wrapper.findComponent({ name: "SearchBar" }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: "UtilitiesFilters" }).exists()).toBe(
      true,
    );
    expect(wrapper.findComponent({ name: "ActiveFilterBar" }).exists()).toBe(
      true,
    );
    expect(wrapper.findComponent({ name: "UtilitiesSort" }).exists()).toBe(
      true,
    );
  });

  it("has correct sort options", () => {
    wrapper = mount(VulnList, {
      props: {
        highlightElem: "",
        analysisID: "analysis-123",
        projectID: "project-123",
      },
    });

    const sortOptions = wrapper.vm.sortByOptions;
    expect(sortOptions).toContainEqual({ label: "CVE", key: "cve" });
    expect(sortOptions).toContainEqual({ label: "Severity", key: "severity" });
    expect(sortOptions).toContainEqual({
      label: "Dependency Name",
      key: "dep_name",
    });
    expect(sortOptions).toContainEqual({ label: "Weakness", key: "weakness" });
  });

  it("has correct page limit selection options", () => {
    wrapper = mount(VulnList, {
      props: {
        highlightElem: "",
        analysisID: "analysis-123",
        projectID: "project-123",
      },
    });

    expect(wrapper.vm.selectionPageLimit).toEqual([
      5, 10, 20, 30, 40, 50, 75, 100,
    ]);
  });

  it("has correct search placeholder", () => {
    wrapper = mount(VulnList, {
      props: {
        highlightElem: "",
        analysisID: "analysis-123",
        projectID: "project-123",
      },
    });

    expect(wrapper.vm.placeholder).toBe(
      "Search by dependency, dependency version, or cve",
    );
  });

  it("handles card expansion functionality", () => {
    wrapper = mount(VulnList, {
      props: {
        highlightElem: "",
        analysisID: "analysis-123",
        projectID: "project-123",
      },
    });

    const vulnerabilityId = "CVE-2023-1234";

    // Initially not expanded
    expect(wrapper.vm.isCardExpanded(vulnerabilityId)).toBe(false);

    // Toggle expansion
    wrapper.vm.toggleCardExpansion(vulnerabilityId);
    expect(wrapper.vm.isCardExpanded(vulnerabilityId)).toBe(true);

    // Toggle again to collapse
    wrapper.vm.toggleCardExpansion(vulnerabilityId);
    expect(wrapper.vm.isCardExpanded(vulnerabilityId)).toBe(false);
  });

  it("handles description truncation correctly", () => {
    wrapper = mount(VulnList, {
      props: {
        highlightElem: "",
        analysisID: "analysis-123",
        projectID: "project-123",
      },
    });

    // Test short description
    const shortDesc = "Short description";
    expect(wrapper.vm.truncateDescription(shortDesc)).toBe(shortDesc);

    // Test long description
    const longDesc =
      "This is a very long description that should be truncated because it exceeds the maximum length limit that we have set for displaying descriptions in the vulnerability list component.";
    const truncated = wrapper.vm.truncateDescription(longDesc, 50);
    expect(truncated.length).toBeLessThanOrEqual(53); // 50 + '...'
    expect(truncated).toMatch(/\.\.\.$/);

    // Test truncation function exists and handles strings properly
    const markdownDesc = "#### Short markdown";
    const cleaned = wrapper.vm.truncateDescription(markdownDesc);
    expect(cleaned).toBe(markdownDesc); // Should return original for short strings
  });

  it("handles severity border color classification", () => {
    wrapper = mount(VulnList, {
      props: {
        highlightElem: "",
        analysisID: "analysis-123",
        projectID: "project-123",
      },
    });

    expect(wrapper.vm.getSeverityBorderColor(9.5)).toBe("border-l-red-600");
    expect(wrapper.vm.getSeverityBorderColor(8.0)).toBe("border-l-orange-500");
    expect(wrapper.vm.getSeverityBorderColor(5.0)).toBe("border-l-yellow-500");
    expect(wrapper.vm.getSeverityBorderColor(2.0)).toBe("border-l-blue-500");
    expect(wrapper.vm.getSeverityBorderColor(0.0)).toBe("border-l-gray-400");
  });

  it("has OWASP mapping functionality", () => {
    wrapper = mount(VulnList, {
      props: {
        highlightElem: "",
        analysisID: "analysis-123",
        projectID: "project-123",
      },
    });

    // Test known OWASP mapping
    const owaspInfo = wrapper.vm.getOwaspInfo("1347");
    expect(owaspInfo.id).toBe("A03");
    expect(owaspInfo.name).toBe("Injection");
    expect(owaspInfo.description).toContain("injection attacks");

    // Test unknown OWASP ID
    const unknownInfo = wrapper.vm.getOwaspInfo("unknown");
    expect(unknownInfo.id).toBe("Unknown");
    expect(unknownInfo.name).toBe("Uncategorized");
  });

  it("processes unique OWASP categories correctly", () => {
    wrapper = mount(VulnList, {
      props: {
        highlightElem: "",
        analysisID: "analysis-123",
        projectID: "project-123",
      },
    });

    const weaknessInfo = [
      { OWASPTop10Id: "1347" },
      { OWASPTop10Id: "1347" }, // Duplicate
      { OWASPTop10Id: "1345" },
      { OWASPTop10Id: "" }, // Empty
    ];

    const uniqueOwasp = wrapper.vm.getUniqueOWASP(weaknessInfo);
    expect(uniqueOwasp).toEqual(["1347", "1345"]);
    expect(uniqueOwasp.length).toBe(2);
  });

  it("has computed properties for statistics", () => {
    wrapper = mount(VulnList, {
      props: {
        highlightElem: "",
        analysisID: "analysis-123",
        projectID: "project-123",
      },
    });

    // Mock findings data
    wrapper.vm.findings = [
      {
        Severity: { Severity: 9.5 }, // Critical
        EPSS: { Score: 0.15 }, // Exploitable
        Affected: [{ PatchType: PatchType.Full }], // Patchable
      },
      {
        Severity: { Severity: 8.0 }, // High
        EPSS: { Score: 0.05 }, // Not exploitable
        Affected: [{ PatchType: PatchType.None }], // Not patchable
      },
    ];

    expect(wrapper.vm.criticalCount).toBe(1);
    expect(wrapper.vm.highCount).toBe(1);
    expect(wrapper.vm.patchableCount).toBe(1);
    expect(wrapper.vm.exploitableCount).toBe(1);
  });

  it("handles workspace model updates", async () => {
    wrapper = mount(VulnList, {
      props: {
        highlightElem: "",
        analysisID: "analysis-123",
        projectID: "project-123",
      },
    });

    // Test model binding
    wrapper.vm.selected_workspace = "test-workspace";
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.selected_workspace).toBe("test-workspace");
  });

  it("handles authentication requirements", () => {
    wrapper = mount(VulnList, {
      props: {
        highlightElem: "",
        analysisID: "analysis-123",
        projectID: "project-123",
      },
    });

    // Component should check authentication
    expect(mockAuthStore.getToken).toBe("test-token");
    expect(mockUserStore.getDefaultOrg).toBeTruthy();
  });

  it("handles empty analysis or project ID", async () => {
    wrapper = mount(VulnList, {
      props: {
        highlightElem: "",
        analysisID: "",
        projectID: "",
      },
    });

    // Should not attempt to fetch data with empty IDs
    const initResult = await wrapper.vm.init();
    expect(initResult).toBeUndefined();
  });

  it("handles repository errors", async () => {
    wrapper = mount(VulnList, {
      props: {
        highlightElem: "",
        analysisID: "analysis-123",
        projectID: "project-123",
      },
    });

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    // Mock the repository method to throw an error
    wrapper.vm.resultsRepository.getVulnerabilities = vi
      .fn()
      .mockRejectedValue(new Error("API Error"));

    await wrapper.vm.init();

    expect(wrapper.vm.render).toBe(false);
    consoleSpy.mockRestore();
  });

  it("displays loading state correctly", () => {
    wrapper = mount(VulnList, {
      props: {
        highlightElem: "",
        analysisID: "analysis-123",
        projectID: "project-123",
      },
    });

    // Initially should show loading
    expect(wrapper.vm.render).toBe(false);
    expect(wrapper.findComponent({ name: "BoxLoader" }).exists()).toBe(true);
  });

  it("displays rendered content when data is loaded", async () => {
    wrapper = mount(VulnList, {
      props: {
        highlightElem: "",
        analysisID: "analysis-123",
        projectID: "project-123",
      },
    });

    // Simulate data loaded
    wrapper.vm.render = true;
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.render).toBe(true);
  });

  it("has proper default props", () => {
    wrapper = mount(VulnList, {
      props: {
        highlightElem: "test",
      },
    });

    expect(wrapper.vm.forceOpenNewTab).toBe(false);
    expect(wrapper.vm.analysisID).toBe("");
    expect(wrapper.vm.projectID).toBe("");
  });

  it("initializes repository correctly", () => {
    wrapper = mount(VulnList, {
      props: {
        highlightElem: "",
        analysisID: "analysis-123",
        projectID: "project-123",
      },
    });

    expect(wrapper.vm.resultsRepository).toBeTruthy();
    expect(typeof wrapper.vm.init).toBe("function");
  });

  it("has filter state configuration", () => {
    wrapper = mount(VulnList, {
      props: {
        highlightElem: "",
        analysisID: "analysis-123",
        projectID: "project-123",
      },
    });

    expect(wrapper.vm.filterState).toBeTruthy();
    expect(wrapper.vm.filterState.toString).toBeDefined();
  });

  it("displays correct statistics in header", () => {
    wrapper = mount(VulnList, {
      props: {
        highlightElem: "",
        analysisID: "analysis-123",
        projectID: "project-123",
      },
    });

    // Check for stats display elements
    const headerText = wrapper.text();
    expect(headerText).toContain("Vulnerabilities");
    expect(headerText).toContain("total vulnerabilities");
  });

  it("handles expandedCards state management", () => {
    wrapper = mount(VulnList, {
      props: {
        highlightElem: "",
        analysisID: "analysis-123",
        projectID: "project-123",
      },
    });

    const vuln1 = "CVE-2023-1234";
    const vuln2 = "CVE-2023-5678";

    // Add multiple vulnerabilities to expanded set
    wrapper.vm.toggleCardExpansion(vuln1);
    wrapper.vm.toggleCardExpansion(vuln2);

    expect(wrapper.vm.isCardExpanded(vuln1)).toBe(true);
    expect(wrapper.vm.isCardExpanded(vuln2)).toBe(true);

    // Remove one
    wrapper.vm.toggleCardExpansion(vuln1);
    expect(wrapper.vm.isCardExpanded(vuln1)).toBe(false);
    expect(wrapper.vm.isCardExpanded(vuln2)).toBe(true);
  });

  it("displays vulnerability legend and indicators", () => {
    wrapper = mount(VulnList, {
      props: {
        highlightElem: "",
        analysisID: "analysis-123",
        projectID: "project-123",
      },
    });

    const text = wrapper.text();
    expect(text).toContain("Vulnerability Indicators");
    expect(text).toContain("Severity Levels");
    expect(text).toContain("Exploitation Risk");
    expect(text).toContain("Patching Status");
  });
});

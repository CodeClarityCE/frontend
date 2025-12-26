import { ResultsRepository } from "@/codeclarity_components/results/results.repository";
import { DependencyDetails } from "@/codeclarity_components/results/sbom/SbomDetails/SbomDetails";
import type { DataResponse } from "@/utils/api/responses/DataResponse";
import { mount, type VueWrapper } from "@vue/test-utils";
import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import SbomDetails from "./SbomDetails.vue";

// Mock vue router
vi.mock("vue-router", () => ({
  useRoute: () => ({
    params: {},
    query: {},
  }),
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock router.ts to prevent import errors
vi.mock("@/router", () => ({
  default: {
    push: vi.fn(),
    back: vi.fn(),
  },
}));

// Mock BaseRepository to avoid dependency issues
vi.mock("@/utils/api/BaseRepository", () => ({
  BaseRepository: class MockBaseRepository {
    constructor() {}
  },
}));

// Mock stores
const mockUserStore = {
  getDefaultOrg: { id: "test-org-id", name: "Test Org" },
};

const mockAuthStore = {
  getToken: "test-token",
};

vi.mock("@/stores/user", () => ({
  useUserStore: vi.fn(() => mockUserStore),
}));

vi.mock("@/stores/auth", () => ({
  useAuthStore: vi.fn(() => mockAuthStore),
}));

// Mock the repository
vi.mock("@/codeclarity_components/results/results.repository");

// Mock child components
vi.mock("./SbomDetails/SbomDetailsLoader.vue", () => ({
  default: {
    name: "SbomDetailsLoader",
    template: '<div class="mock-loader">Loading...</div>',
  },
}));

vi.mock("./SbomDetails/SbomDetailsHeader.vue", () => ({
  default: {
    name: "SbomDetailsHeader",
    props: ["dependency"],
    template: '<div class="mock-header">Header Mock</div>',
  },
}));

vi.mock("./SbomDetails/SbomInformation.vue", () => ({
  default: {
    name: "SbomInformation",
    props: ["dependency"],
    template: '<div class="mock-information">Information Mock</div>',
  },
}));

vi.mock("./SbomDetails/SbomDependencyHealth.vue", () => ({
  default: {
    name: "SbomDependencyHealth",
    props: ["dependency"],
    template: '<div class="mock-health">Health Mock</div>',
  },
}));

vi.mock("./SbomDetails/SbomImportPaths.vue", () => ({
  default: {
    name: "SbomImportPaths",
    props: ["dependency", "analysisID", "projectID"],
    template: '<div class="mock-import-paths">Import Paths Mock</div>',
  },
}));

// Mock common components
vi.mock("@/base_components/ui/cards/InfoCard.vue", () => ({
  default: {
    name: "InfoCard",
    props: ["title", "description", "icon", "variant"],
    template: '<div class="mock-info-card"><slot></slot></div>',
  },
}));

vi.mock("@/base_components/ui/cards/StatCard.vue", () => ({
  default: {
    name: "StatCard",
    props: ["label", "value", "icon", "variant", "subtitle", "subtitleIcon"],
    template: '<div class="mock-stat-card">{{ value }}</div>',
  },
}));

vi.mock("@/shadcn/ui/badge/Badge.vue", () => ({
  default: {
    name: "Badge",
    props: ["variant", "title"],
    template: '<div class="mock-badge"><slot></slot></div>',
  },
}));

// Mock Icon component
vi.mock("@iconify/vue", () => ({
  Icon: {
    name: "Icon",
    props: ["icon"],
    template: '<span class="mock-icon">{{ icon }}</span>',
  },
}));

describe.skip("SbomDetails.vue", () => {
  let wrapper: VueWrapper;
  let mockResultsRepository: any;
  let windowLocationSpy: any;
  let routerBackSpy: any;

  const mockDependency = new DependencyDetails();
  mockDependency.name = "test-package";
  mockDependency.version = "1.0.0";
  mockDependency.latest_version = "2.0.0";
  mockDependency.license = "MIT";
  mockDependency.package_manager = "npm";
  mockDependency.vulnerabilities = ["CVE-2021-1234", "CVE-2021-5678"];
  mockDependency.severity_dist = {
    critical: 1,
    high: 1,
    medium: 0,
    low: 0,
    none: 0,
  };
  mockDependency.transitive = false;
  mockDependency.release_date = new Date("2023-01-01");
  mockDependency.lastest_release_date = new Date("2024-01-01");

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock window.location
    windowLocationSpy = vi.spyOn(window, "location", "get").mockImplementation(
      () =>
        ({
          href: "http://localhost:3000/results?package_id=test-package",
          search: "?package_id=test-package",
        }) as any,
    );

    // Mock router.go
    const { default: router } = await vi.importMock("@/router");
    routerBackSpy = vi.spyOn(router as any, "back");

    // Mock repository responses
    mockResultsRepository = {
      getDependency: vi.fn().mockResolvedValue({
        data: mockDependency,
      } as DataResponse<DependencyDetails>),
    };

    (ResultsRepository as Mock).mockImplementation(() => mockResultsRepository);
  });

  const createWrapper = (props = {}) => {
    return mount(SbomDetails, {
      props: {
        showBack: true,
        analysisID: "test-analysis-id",
        projectID: "test-project-id",
        ...props,
      },
    });
  };

  describe("Component Initialization", () => {
    it("should render loading state initially", async () => {
      wrapper = createWrapper();

      expect(wrapper.find(".mock-loader").exists()).toBe(true);
      expect(wrapper.find(".content-wrapper").exists()).toBe(false);
    });

    it("should fetch dependency data on mount", async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      expect(mockResultsRepository.getDependency).toHaveBeenCalledWith({
        orgId: "test-org-id",
        projectId: "test-project-id",
        analysisId: "test-analysis-id",
        dependency: "test-package",
        bearerToken: "test-token",
        workspace: ".",
        handleBusinessErrors: true,
      });
    });

    it("should render content after data is loaded", async () => {
      wrapper = createWrapper();

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      expect(wrapper.find(".content-wrapper").exists()).toBe(true);
      expect(wrapper.find(".mock-loader").exists()).toBe(false);
    });

    it("should handle missing package_id parameter", async () => {
      windowLocationSpy.mockImplementation(
        () =>
          ({
            href: "http://localhost:3000/results",
            search: "",
          }) as any,
      );

      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      expect(mockResultsRepository.getDependency).not.toHaveBeenCalled();
      expect(wrapper.find(".mock-loader").exists()).toBe(true);
    });
  });

  describe("Navigation", () => {
    it("should render back button when showBack is true", async () => {
      wrapper = createWrapper({ showBack: true });
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      expect(wrapper.find(".navigation-section").exists()).toBe(true);
      expect(wrapper.find(".back-button").exists()).toBe(true);
    });

    it("should not render back button when showBack is false", async () => {
      wrapper = createWrapper({ showBack: false });
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      expect(wrapper.find(".navigation-section").exists()).toBe(false);
    });

    it("should navigate back when back button is clicked", async () => {
      wrapper = createWrapper({ showBack: true });
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      await wrapper.find(".back-button").trigger("click");

      expect(routerBackSpy).toHaveBeenCalled();
    });
  });

  describe("Security Score Calculation", () => {
    it("should calculate security score A for no vulnerabilities", async () => {
      const safeDependency = {
        ...mockDependency,
        vulnerabilities: [],
        severity_dist: {},
      };
      mockResultsRepository.getDependency.mockResolvedValue({
        data: safeDependency,
      });

      wrapper = createWrapper();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      const scoreCard = wrapper.findAll(".mock-stat-card")[0]!;
      expect(scoreCard.text()).toBe("A");
    });

    it("should calculate security score F for critical vulnerabilities", async () => {
      wrapper = createWrapper();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      const scoreCard = wrapper.findAll(".mock-stat-card")[0]!;
      expect(scoreCard.text()).toBe("F");
    });

    it("should calculate security score D for high vulnerabilities", async () => {
      const highVulnDependency = {
        ...mockDependency,
        severity_dist: { critical: 0, high: 1, medium: 0, low: 0 },
      };
      mockResultsRepository.getDependency.mockResolvedValue({
        data: highVulnDependency,
      });

      wrapper = createWrapper();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      const scoreCard = wrapper.findAll(".mock-stat-card")[0]!;
      expect(scoreCard.text()).toBe("D");
    });
  });

  describe("Statistics Display", () => {
    it("should display correct vulnerability count", async () => {
      wrapper = createWrapper();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      const vulnCard = wrapper.findAll(".mock-stat-card")[1]!;
      expect(vulnCard.text()).toBe("2");
    });

    it("should display correct critical & high count", async () => {
      wrapper = createWrapper();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      const criticalHighCard = wrapper.findAll(".mock-stat-card")[2]!;
      expect(criticalHighCard.text()).toBe("2");
    });

    it("should display version status", async () => {
      wrapper = createWrapper();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      const versionCard = wrapper.findAll(".mock-stat-card")[3]!;
      expect(versionCard.text()).toBe("v1.0.0");
    });

    it("should display license information", async () => {
      wrapper = createWrapper();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      const licenseCard = wrapper.findAll(".mock-stat-card")[4]!;
      expect(licenseCard.text()).toBe("MIT");
    });

    it("should display package manager", async () => {
      wrapper = createWrapper();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      const pmCard = wrapper.findAll(".mock-stat-card")[5]!;
      expect(pmCard.text()).toBe("npm");
    });
  });

  describe("Child Component Rendering", () => {
    it("should render all child components with correct props", async () => {
      wrapper = createWrapper();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      // Header component
      const header = wrapper.findComponent({ name: "SbomDetailsHeader" });
      expect(header.exists()).toBe(true);
      expect(header.props("dependency")).toEqual(mockDependency);

      // Information component
      const info = wrapper.findComponent({ name: "SbomInformation" });
      expect(info.exists()).toBe(true);
      expect(info.props("dependency")).toEqual(mockDependency);

      // Health component
      const health = wrapper.findComponent({ name: "SbomDependencyHealth" });
      expect(health.exists()).toBe(true);
      expect(health.props("dependency")).toEqual(mockDependency);

      // Import paths component
      const importPaths = wrapper.findComponent({ name: "SbomImportPaths" });
      expect(importPaths.exists()).toBe(true);
      expect(importPaths.props("dependency")).toEqual(mockDependency);
      expect(importPaths.props("analysisID")).toBe("test-analysis-id");
      expect(importPaths.props("projectID")).toBe("test-project-id");
    });
  });

  describe("Vulnerability Section", () => {
    it("should render vulnerability section when vulnerabilities exist", async () => {
      wrapper = createWrapper();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      expect(wrapper.find(".vulnerability-section").exists()).toBe(true);
      expect(wrapper.find(".vulnerability-card").exists()).toBe(true);
    });

    it("should not render vulnerability section when no vulnerabilities", async () => {
      const safeDependency = { ...mockDependency, vulnerabilities: [] };
      mockResultsRepository.getDependency.mockResolvedValue({
        data: safeDependency,
      });

      wrapper = createWrapper();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      expect(wrapper.find(".vulnerability-section").exists()).toBe(false);
    });

    it("should display vulnerability badges", async () => {
      wrapper = createWrapper();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      const vulnBadges = wrapper.findAll(".vulnerability-badge");
      expect(vulnBadges.length).toBe(2);
      expect(vulnBadges[0]!.text()).toBe("CVE-2021-1234");
      expect(vulnBadges[1]!.text()).toBe("CVE-2021-5678");
    });

    it("should display severity distribution", async () => {
      wrapper = createWrapper();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      const severityItems = wrapper.findAll(".severity-item");
      expect(severityItems.length).toBeGreaterThan(0);

      const criticalCount = wrapper.find(
        ".severity-item.critical .severity-count",
      );
      expect(criticalCount.text()).toBe("1");

      const highCount = wrapper.find(".severity-item.high .severity-count");
      expect(highCount.text()).toBe("1");
    });
  });

  describe("Recommendations", () => {
    it("should show update recommendation when not on latest version", async () => {
      wrapper = createWrapper();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      const updateRecommendation = wrapper.find(".recommendation-item.update");
      expect(updateRecommendation.exists()).toBe(true);
      expect(updateRecommendation.text()).toContain("v1.0.0");
      expect(updateRecommendation.text()).toContain("v2.0.0");
    });

    it("should show critical attention recommendation", async () => {
      wrapper = createWrapper();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      const criticalRecommendation = wrapper.find(
        ".recommendation-item.critical",
      );
      expect(criticalRecommendation.exists()).toBe(true);
      expect(criticalRecommendation.text()).toContain("2");
    });

    it("should not show transitive recommendation for direct dependencies", async () => {
      wrapper = createWrapper();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      const transitiveRecommendation = wrapper.find(
        ".recommendation-item.transitive",
      );
      expect(transitiveRecommendation.exists()).toBe(false);
    });

    it("should show transitive recommendation for transitive dependencies", async () => {
      const transitiveDep = { ...mockDependency, transitive: true };
      mockResultsRepository.getDependency.mockResolvedValue({
        data: transitiveDep,
      });

      wrapper = createWrapper();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      const transitiveRecommendation = wrapper.find(
        ".recommendation-item.transitive",
      );
      expect(transitiveRecommendation.exists()).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle repository errors gracefully", async () => {
      mockResultsRepository.getDependency.mockRejectedValue(
        new Error("API Error"),
      );
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      wrapper = createWrapper();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(wrapper.find(".mock-loader").exists()).toBe(true);
    });

    it("should handle missing default org", async () => {
      (mockUserStore as any).getDefaultOrg = null;
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      wrapper = createWrapper();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));

      // Restore for next tests
      mockUserStore.getDefaultOrg = { id: "test-org-id", name: "Test Org" };
    });

    it("should handle missing auth token", async () => {
      mockAuthStore.getToken = "";
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      wrapper = createWrapper();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));

      // Restore for next tests
      mockAuthStore.getToken = "test-token";
    });
  });

  describe("Package Status Helpers", () => {
    it("should identify outdated packages", async () => {
      wrapper = createWrapper();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      // Package is outdated (release dates differ by a year)
      const versionCard = wrapper.findAll(".mock-stat-card")[3]!;
      expect(versionCard.text()).toBe("v1.0.0");
    });

    it("should handle missing version information", async () => {
      const noVersionDep = {
        ...mockDependency,
        version: null,
        latest_version: null,
      };
      mockResultsRepository.getDependency.mockResolvedValue({
        data: noVersionDep,
      });

      wrapper = createWrapper();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      const versionCard = wrapper.findAll(".mock-stat-card")[3]!;
      expect(versionCard.text()).toBe("Unknown");
    });

    it("should show Latest status when on latest version", async () => {
      const latestDep = {
        ...mockDependency,
        version: "2.0.0",
        latest_version: "2.0.0",
      };
      mockResultsRepository.getDependency.mockResolvedValue({
        data: latestDep,
      });

      wrapper = createWrapper();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      const versionCard = wrapper.findAll(".mock-stat-card")[3]!;
      expect(versionCard.text()).toBe("Latest");
    });
  });
});

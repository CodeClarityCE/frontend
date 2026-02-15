import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import { type DependencyDetails } from "./SbomDetails";
import SbomInformation from "./SbomInformation.vue";

// Mock Icon component
vi.mock("@iconify/vue", () => ({
  Icon: {
    name: "Icon",
    props: ["icon", "class", "style"],
    template: '<span class="mock-icon" :class="$props.class">{{ icon }}</span>',
  },
}));

// Mock Badge component
vi.mock("@/shadcn/ui/badge", () => ({
  Badge: {
    name: "Badge",
    props: ["variant", "class"],
    template:
      '<div class="mock-badge" :class="$props.class" :variant="$props.variant"><slot></slot></div>',
  },
}));

// Mock Collapsible components
vi.mock("@/shadcn/ui/collapsible", () => ({
  Collapsible: {
    name: "Collapsible",
    props: ["class"],
    template:
      '<div class="mock-collapsible" :class="$props.class"><slot :open="false"></slot></div>',
  },
  CollapsibleContent: {
    name: "CollapsibleContent",
    template: '<div class="mock-collapsible-content"><slot></slot></div>',
  },
  CollapsibleTrigger: {
    name: "CollapsibleTrigger",
    props: ["class"],
    template:
      '<button class="mock-collapsible-trigger" :class="$props.class"><slot></slot></button>',
  },
}));

// Mock auth store
vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({
    getAuthenticated: true,
  }),
}));

// Mock date utils
vi.mock("@/utils/dateUtils", () => ({
  calculateDateDifference: vi.fn((_date1, _date2, _unit) => {
    return 200; // Default 200 days difference
  }),
  formatRelativeTime: vi.fn((date) => {
    return `${date} ago`;
  }),
  isValidDate: vi.fn((date) => {
    return date !== null && date !== undefined;
  }),
}));

describe("SbomInformation.vue", () => {
  const createMockDependency = (overrides = {}): DependencyDetails => {
    return {
      name: "test-package",
      version: "1.2.3",
      latest_version: "1.5.0",
      package_manager: "NPM",
      transitive: false,
      license: "MIT",
      release_date: new Date("2023-01-01"),
      lastest_release_date: new Date("2023-06-01"),
      engines: {
        node: ">=14.0.0",
        npm: ">=6.0.0",
      },
      dependencies: {},
      dev_dependencies: {},
      vulnerabilities: [],
      severity_dist: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        none: 0,
      },
      ...overrides,
    } as DependencyDetails;
  };

  const createWrapper = (dependency = createMockDependency()) => {
    return mount(SbomInformation, {
      props: {
        dependency,
      },
    });
  };

  describe("Component Rendering", () => {
    it("should render the main information panel", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".information-panel").exists()).toBe(true);
    });

    it("should render both main sections", () => {
      const wrapper = createWrapper();

      const cards = wrapper.findAll(".compact-card");
      expect(cards.length).toBeGreaterThanOrEqual(2);

      expect(wrapper.text()).toContain("Version & Release");
      expect(wrapper.text()).toContain("Package Details");
    });

    it("should render section labels", () => {
      const wrapper = createWrapper();

      const labels = wrapper.findAll(".compact-card-label");
      expect(labels.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Version & Release Section", () => {
    it("should display current and latest version columns", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("Current");
      expect(wrapper.text()).toContain("1.2.3");
      expect(wrapper.text()).toContain("Latest");
      expect(wrapper.text()).toContain("1.5.0");
    });

    it("should display version arrow between columns", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".version-arrow").exists()).toBe(true);
      expect(wrapper.text()).toContain("solar:arrow-right-linear");
    });

    it("should display release dates when valid", () => {
      const wrapper = createWrapper();

      const dates = wrapper.findAll(".version-date");
      expect(dates.length).toBeGreaterThanOrEqual(1);
    });

    it("should show outdated version status when version is old", () => {
      // Mock returns 200 days difference, which is > 182 days (6 months)
      const wrapper = createWrapper();

      const statusBar = wrapper.find(".version-status-bar.outdated");
      expect(statusBar.exists()).toBe(true);
      expect(wrapper.text()).toContain("behind latest");
      expect(wrapper.text()).toContain("solar:clock-circle-bold");
    });

    it("should show current version status when up to date", () => {
      const dependency = createMockDependency({
        version: "1.5.0",
        latest_version: "1.5.0",
      });
      const wrapper = createWrapper(dependency);

      const statusBar = wrapper.find(".version-status-bar.current");
      expect(statusBar.exists()).toBe(true);
      expect(wrapper.text()).toContain("Using the latest version");
      expect(wrapper.text()).toContain("solar:check-circle-bold");
    });

    it("should show minor update status when not severely outdated", async () => {
      const { calculateDateDifference } = await import("@/utils/dateUtils");
      vi.mocked(calculateDateDifference).mockReturnValue(100); // 100 days < 182

      const wrapper = createWrapper();

      const statusBar = wrapper.find(".version-status-bar.minor-update");
      expect(statusBar.exists()).toBe(true);
      expect(wrapper.text()).toContain("Update available");
      expect(wrapper.text()).toContain("solar:info-circle-bold");

      // Reset mock
      vi.mocked(calculateDateDifference).mockReturnValue(200);
    });

    it("should handle missing release dates", () => {
      const dependency = createMockDependency({
        release_date: null,
        lastest_release_date: null,
      });
      const wrapper = createWrapper(dependency);

      // Should not crash and should render version badges
      expect(wrapper.find(".version-badge").exists()).toBe(true);
    });

    it("should display custom version information", () => {
      const dependency = createMockDependency({
        version: "2.1.0",
        latest_version: "3.0.0",
      });
      const wrapper = createWrapper(dependency);

      expect(wrapper.text()).toContain("2.1.0");
      expect(wrapper.text()).toContain("3.0.0");
    });
  });

  describe("Package Details Section", () => {
    it("should display license information for licensed packages", () => {
      const dependency = createMockDependency({ license: "MIT" });
      const wrapper = createWrapper(dependency);

      expect(wrapper.text()).toContain("License");
      expect(wrapper.text()).toContain("MIT");

      const licenseBadge = wrapper.find(".license-badge.valid");
      expect(licenseBadge.exists()).toBe(true);
    });

    it("should display unlicensed warning for packages without license", () => {
      const dependency = createMockDependency({ license: "" });
      const wrapper = createWrapper(dependency);

      expect(wrapper.text()).toContain("Unlicensed");
      expect(wrapper.text()).toContain("solar:danger-triangle-bold");
    });

    it("should display release age information", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("Release Age");
      expect(wrapper.find(".age-dot").exists()).toBe(true);
      expect(wrapper.find(".age-value").exists()).toBe(true);
    });

    it("should display ecosystem information", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("Ecosystem");
      expect(wrapper.text()).toContain("JavaScript");
    });

    it("should display ecosystem link when website available", () => {
      const wrapper = createWrapper();

      const ecosystemLink = wrapper.find(".ecosystem-link");
      expect(ecosystemLink.exists()).toBe(true);
      expect(ecosystemLink.attributes("target")).toBe("_blank");
    });

    it("should display engine support when available", () => {
      const dependency = createMockDependency({
        engines: {
          node: ">=14.0.0",
          npm: ">=6.0.0",
          yarn: ">=1.22.0",
        },
      });
      const wrapper = createWrapper(dependency);

      expect(wrapper.text()).toContain("Engines");
      expect(wrapper.text()).toContain("Node");
      expect(wrapper.text()).toContain(">=14.0.0");
      expect(wrapper.text()).toContain("Npm");
      expect(wrapper.text()).toContain(">=6.0.0");
      expect(wrapper.text()).toContain("Yarn");
      expect(wrapper.text()).toContain(">=1.22.0");
    });

    it("should not display engine badges when engines not available", () => {
      const dependency = createMockDependency({ engines: {} });
      const wrapper = createWrapper(dependency);

      expect(wrapper.findAll(".engine-badge").length).toBe(0);
    });

    it("should display compatible tools", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("Tools");
      expect(wrapper.findAll(".tool-badge").length).toBeGreaterThan(0);
    });

    it("should display detail rows", () => {
      const wrapper = createWrapper();

      const detailRows = wrapper.findAll(".detail-row");
      expect(detailRows.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Engine Icon Mapping", () => {
    it("should map engine names to correct icons", () => {
      const dependency = createMockDependency({
        engines: {
          node: ">=14.0.0",
          npm: ">=6.0.0",
          yarn: ">=1.22.0",
          python: ">=3.8",
          java: ">=8",
          go: ">=1.16",
          rust: ">=1.50",
          php: ">=7.4",
        },
      });
      const wrapper = createWrapper(dependency);

      expect(wrapper.text()).toContain("akar-icons:node-fill");
      expect(wrapper.text()).toContain("akar-icons:npm-fill");
      expect(wrapper.text()).toContain("akar-icons:yarn-fill");
      expect(wrapper.text()).toContain("akar-icons:python-fill");
      expect(wrapper.text()).toContain("skill-icons:java-dark");
      expect(wrapper.text()).toContain("skill-icons:golang");
      expect(wrapper.text()).toContain("skill-icons:rust");
      expect(wrapper.text()).toContain("skill-icons:php-dark");
    });

    it("should use default icon for unknown engines", () => {
      const dependency = createMockDependency({
        engines: {
          unknown: ">=1.0.0",
        },
      });
      const wrapper = createWrapper(dependency);

      expect(wrapper.text()).toContain("solar:cpu-bolt-bold");
    });
  });

  describe("Package Age Calculations", () => {
    it("should display release age with dot indicator", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".age-dot").exists()).toBe(true);
      expect(wrapper.find(".age-value").exists()).toBe(true);
    });

    it("should handle packages without release date", () => {
      const dependency = createMockDependency({ release_date: null });
      const wrapper = createWrapper(dependency);

      // Should handle gracefully without crashing
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find(".age-value").exists()).toBe(true);
    });
  });

  describe("Version Lag Calculations", () => {
    it("should calculate version lag correctly", () => {
      const wrapper = createWrapper();

      const statusBar = wrapper.find(".version-status-bar");
      expect(statusBar.exists()).toBe(true);
    });

    it("should handle missing version dates", () => {
      const dependency = createMockDependency({
        release_date: null,
        lastest_release_date: null,
      });
      const wrapper = createWrapper(dependency);

      expect(wrapper.exists()).toBe(true);
    });
  });

  describe("Component Integration", () => {
    it("should pass correct props to Icon components", () => {
      const wrapper = createWrapper();

      const icons = wrapper.findAllComponents({ name: "Icon" });
      expect(icons.length).toBeGreaterThan(5);

      icons.forEach((icon) => {
        expect(icon.props("icon")).toBeDefined();
        expect(typeof icon.props("icon")).toBe("string");
      });
    });

    it("should pass correct props to Badge components", () => {
      const wrapper = createWrapper();

      const badges = wrapper.findAllComponents({ name: "Badge" });
      expect(badges.length).toBeGreaterThan(0);

      badges.forEach((badge) => {
        expect(badge.props("variant")).toBeDefined();
      });
    });

    it("should render external links with correct attributes", () => {
      const wrapper = createWrapper();

      const externalLinks = wrapper.findAll('a[target="_blank"]');
      expect(externalLinks.length).toBeGreaterThan(0);

      externalLinks.forEach((link) => {
        expect(link.attributes("target")).toBe("_blank");
        expect(link.attributes("href")).toBeDefined();
      });
    });
  });

  describe("Props Validation", () => {
    it("should accept dependency prop", () => {
      const dependency = createMockDependency();
      const wrapper = createWrapper(dependency);

      expect(wrapper.props("dependency")).toEqual(dependency);
    });

    it("should require dependency prop", () => {
      expect(SbomInformation["props"]?.dependency?.required).toBe(true);
    });
  });

  describe("Responsive Design", () => {
    it("should have top grid layout", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".top-grid").exists()).toBe(true);
    });

    it("should render all compact card components", () => {
      const wrapper = createWrapper();

      const cards = wrapper.findAll(".compact-card");
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle dependency with all null fields", () => {
      const dependency = createMockDependency({
        name: "",
        version: "",
        latest_version: "",
        package_manager: "",
        license: "",
        release_date: null,
        lastest_release_date: null,
        engines: {},
      });
      const wrapper = createWrapper(dependency);

      expect(wrapper.exists()).toBe(true);
    });

    it("should handle dependency with special characters", () => {
      const dependency = createMockDependency({
        name: "@scope/package-name",
        license: "Apache-2.0",
      });
      const wrapper = createWrapper(dependency);

      expect(wrapper.text()).toContain("Apache-2.0");
    });

    it("should handle very old packages", async () => {
      const { calculateDateDifference } = await import("@/utils/dateUtils");
      vi.mocked(calculateDateDifference).mockReturnValue(800);

      const wrapper = createWrapper();

      expect(wrapper.find(".age-dot").exists()).toBe(true);
      expect(wrapper.find(".age-value").exists()).toBe(true);

      // Reset mock
      vi.mocked(calculateDateDifference).mockReturnValue(200);
    });

    it("should handle complex engine requirements", () => {
      const dependency = createMockDependency({
        engines: {
          node: ">=14.0.0 <17.0.0",
          npm: ">=6.0.0",
          "custom-engine": ">=1.0.0",
        },
      });
      const wrapper = createWrapper(dependency);

      expect(wrapper.text()).toContain(">=14.0.0 <17.0.0");
      expect(wrapper.text()).toContain("Custom-engine");
    });
  });

  describe("Styling and Layout", () => {
    it("should have correct CSS classes for main sections", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".information-panel").exists()).toBe(true);
      expect(wrapper.find(".compact-card").exists()).toBe(true);
      expect(wrapper.find(".compact-card-label").exists()).toBe(true);
    });

    it("should render version comparison section", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".version-comparison").exists()).toBe(true);
      expect(wrapper.findAll(".version-column").length).toBe(2);
    });

    it("should apply appropriate styling classes for different states", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".version-badge").exists()).toBe(true);
      expect(wrapper.find(".version-status-bar").exists()).toBe(true);
      expect(wrapper.find(".detail-rows").exists()).toBe(true);
    });
  });
});

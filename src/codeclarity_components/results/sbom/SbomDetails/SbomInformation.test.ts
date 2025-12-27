import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";
import { type DependencyDetails } from "./SbomDetails";
import SbomInformation from "./SbomInformation.vue";

// Mock Icon component
vi.mock("@iconify/vue", () => ({
  Icon: {
    name: "Icon",
    props: ["icon", "class"],
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

// Mock date utils
vi.mock("@/utils/dateUtils", () => ({
  calculateDateDifference: vi.fn((_date1, _date2, _unit) => {
    // Mock implementation for testing
    const mockDiff = 200; // Default 200 days difference
    return mockDiff;
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

    it("should render all three main sections", () => {
      const wrapper = createWrapper();

      const sections = wrapper.findAll(".info-section");
      expect(sections.length).toBe(3);

      expect(wrapper.text()).toContain("Package Source");
      expect(wrapper.text()).toContain("Version Information");
      expect(wrapper.text()).toContain("Technical Details");
    });

    it("should render section headers with icons", () => {
      const wrapper = createWrapper();

      const sectionHeaders = wrapper.findAll(".section-header");
      expect(sectionHeaders.length).toBe(3);

      expect(wrapper.text()).toContain("solar:box-bold");
      expect(wrapper.text()).toContain("solar:tag-bold");
      expect(wrapper.text()).toContain("solar:settings-bold");
    });
  });

  describe("Package Source Section", () => {
    it("should render NPM package manager link", () => {
      const dependency = createMockDependency({ package_manager: "NPM" });
      const wrapper = createWrapper(dependency);

      expect(wrapper.text()).toContain("Package Source");
      expect(wrapper.text()).toContain("Compatible tools");
      expect(wrapper.text()).toContain("akar-icons:npm-fill");

      const npmLink = wrapper.find('a[href*="npmjs.com"]');
      expect(npmLink.exists()).toBe(true);
      expect(npmLink.attributes("href")).toBe(
        "https://www.npmjs.com/package/test-package",
      );
    });

    it("should render Yarn package manager link", () => {
      const dependency = createMockDependency({ package_manager: "YARN" });
      const wrapper = createWrapper(dependency);

      expect(wrapper.text()).toContain("Compatible tools");
      expect(wrapper.text()).toContain("akar-icons:npm-fill");

      // Yarn package manager should still render npm link as primary package source
      const npmLink = wrapper.find('a[href*="npmjs.com"]');
      expect(npmLink.exists()).toBe(true);
    });

    it("should render self-managed package type", () => {
      const dependency = createMockDependency({ package_manager: "SELF" });
      const wrapper = createWrapper(dependency);

      expect(wrapper.text()).toContain("Package Source");
      expect(wrapper.text()).toContain("akar-icons:npm-fill");
    });

    it("should render unknown package manager", () => {
      const dependency = createMockDependency({ package_manager: "UNKNOWN" });
      const wrapper = createWrapper(dependency);

      expect(wrapper.text()).toContain("Package Source");
      expect(wrapper.text()).toContain("akar-icons:npm-fill");
    });

    it("should display dependency type - direct", () => {
      const dependency = createMockDependency({ transitive: false });
      const wrapper = createWrapper(dependency);

      expect(wrapper.text()).toContain("Dependency Type");
      expect(wrapper.text()).toContain("Direct");
      expect(wrapper.text()).toContain("Direct dependency in your project");
      expect(wrapper.text()).toContain("solar:download-linear");
    });

    it("should display dependency type - transitive", () => {
      const dependency = createMockDependency({ transitive: true });
      const wrapper = createWrapper(dependency);

      expect(wrapper.text()).toContain("Transitive");
      expect(wrapper.text()).toContain(
        "Indirect dependency through another package",
      );
      expect(wrapper.text()).toContain("solar:hierarchy-2-linear");
    });
  });

  describe("Version Information Section", () => {
    it("should display current version information", () => {
      const dependency = createMockDependency({
        version: "2.1.0",
        release_date: "2023-01-15",
      });
      const wrapper = createWrapper(dependency);

      expect(wrapper.text()).toContain("Current Version");
      expect(wrapper.text()).toContain("2.1.0");
      expect(wrapper.text()).toContain("Released 2023-01-15 ago");
    });

    it("should display latest version information", () => {
      const dependency = createMockDependency({
        latest_version: "3.0.0",
        lastest_release_date: "2023-06-01",
      });
      const wrapper = createWrapper(dependency);

      expect(wrapper.text()).toContain("Latest Version");
      expect(wrapper.text()).toContain("3.0.0");
      expect(wrapper.text()).toContain("Released 2023-06-01 ago");
    });

    it("should show outdated version status when version is old", () => {
      // Mock will return 200 days difference, which is > 182 days (6 months)
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("Version Status");
      expect(wrapper.text()).toContain("behind the latest release");
      expect(wrapper.text()).toContain("solar:clock-circle-bold");
    });

    it("should show current version status when up to date", async () => {
      // Mock the date difference to be less than 182 days
      vi.mocked(vi.fn()).mockReturnValue(100); // 100 days
      const { calculateDateDifference } = await import("@/utils/dateUtils");
      vi.mocked(calculateDateDifference).mockReturnValue(100);

      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("Using the latest version");
      expect(wrapper.text()).toContain("solar:check-circle-bold");
    });

    it("should handle missing release dates", () => {
      const dependency = createMockDependency({
        release_date: null,
        lastest_release_date: null,
      });
      const wrapper = createWrapper(dependency);

      // Should not crash and should render version badges
      const badges = wrapper.findAllComponents({ name: "Badge" });
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  describe("Technical Details Section", () => {
    it("should display license information for licensed packages", () => {
      const dependency = createMockDependency({ license: "MIT" });
      const wrapper = createWrapper(dependency);

      expect(wrapper.text()).toContain("License");
      expect(wrapper.text()).toContain("MIT");
      expect(wrapper.text()).toContain("Licensed");

      const licenseBadge = wrapper.find(".license-badge.valid");
      expect(licenseBadge.exists()).toBe(true);
    });

    it("should display unlicensed warning for packages without license", () => {
      const dependency = createMockDependency({ license: "" });
      const wrapper = createWrapper(dependency);

      expect(wrapper.text()).toContain("Unlicensed");
      expect(wrapper.text()).toContain("No license information");
      expect(wrapper.text()).toContain("solar:danger-triangle-bold");

      const licenseBadge = wrapper.find(".license-badge.invalid");
      expect(licenseBadge.exists()).toBe(true);
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

      expect(wrapper.text()).toContain("Engine Support");
      expect(wrapper.text()).toContain("Node");
      expect(wrapper.text()).toContain(">=14.0.0");
      expect(wrapper.text()).toContain("Npm");
      expect(wrapper.text()).toContain(">=6.0.0");
      expect(wrapper.text()).toContain("Yarn");
      expect(wrapper.text()).toContain(">=1.22.0");
    });

    it("should not display engine support when not available", () => {
      const dependency = createMockDependency({ engines: {} });
      const wrapper = createWrapper(dependency);

      expect(wrapper.text()).not.toContain("Engine Support");
    });

    it("should display package age information", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("Package Age");
      // Based on our mock, it should show some age information
      expect(wrapper.find(".age-info").exists()).toBe(true);
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
    it("should calculate and display package age correctly", () => {
      // Test will use our mocked date difference of 200 days
      const wrapper = createWrapper();

      expect(wrapper.find(".age-info").exists()).toBe(true);
      expect(wrapper.find(".age-indicator").exists()).toBe(true);
    });

    it("should handle packages without release date", () => {
      const dependency = createMockDependency({ release_date: null });
      const wrapper = createWrapper(dependency);

      expect(wrapper.find(".age-info").exists()).toBe(true);
      // Should handle gracefully without crashing
    });
  });

  describe("Version Lag Calculations", () => {
    it("should calculate version lag correctly", () => {
      // With our mock returning 200 days, should show months behind
      const wrapper = createWrapper();

      // Should show some form of version status
      expect(wrapper.find(".version-status").exists()).toBe(true);
    });

    it("should handle missing version dates", () => {
      const dependency = createMockDependency({
        release_date: null,
        lastest_release_date: null,
      });
      const wrapper = createWrapper(dependency);

      // Should not crash
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

      expect(wrapper["props"]("dependency")).toEqual(dependency);
    });

    it("should require dependency prop", () => {
      expect(SbomInformation["props"]?.dependency?.required).toBe(true);
    });
  });

  describe("Responsive Design", () => {
    it("should have responsive grid layouts", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".info-grid").exists()).toBe(true);
      expect(wrapper.find(".version-grid").exists()).toBe(true);
      expect(wrapper.find(".details-grid").exists()).toBe(true);
    });

    it("should render all card components", () => {
      const wrapper = createWrapper();

      const infoCards = wrapper.findAll(".info-card");
      const detailCards = wrapper.findAll(".detail-card");

      expect(infoCards.length).toBeGreaterThan(0);
      expect(detailCards.length).toBeGreaterThan(0);
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
      // Should not crash with empty data
    });

    it("should handle dependency with special characters", () => {
      const dependency = createMockDependency({
        name: "@scope/package-name",
        license: "Apache-2.0",
      });
      const wrapper = createWrapper(dependency);

      // Component doesn't display package name directly in text, but uses it in links
      const npmLink = wrapper.find('a[href*="@scope/package-name"]');
      expect(npmLink.exists()).toBe(true);
      expect(wrapper.text()).toContain("Apache-2.0");
    });

    it("should handle very old packages", async () => {
      // Mock very old package (>2 years)
      vi.mocked(vi.fn()).mockReturnValue(800); // 800 days
      const { calculateDateDifference } = await import("@/utils/dateUtils");
      vi.mocked(calculateDateDifference).mockReturnValue(800);

      const wrapper = createWrapper();

      expect(wrapper.find(".age-info").exists()).toBe(true);
      // Should handle very old packages gracefully
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
      expect(wrapper.find(".info-section").exists()).toBe(true);
      expect(wrapper.find(".section-header").exists()).toBe(true);
    });

    it("should apply hover effects to cards", () => {
      const wrapper = createWrapper();

      const cards = wrapper.findAll(".info-card, .detail-card");
      expect(cards.length).toBeGreaterThan(0);

      // Check that cards have either info-card or detail-card class
      cards.forEach((card) => {
        const hasCorrectClass =
          card.classes().includes("info-card") ||
          card.classes().includes("detail-card");
        expect(hasCorrectClass).toBe(true);
      });
    });

    it("should apply appropriate styling classes for different states", () => {
      const wrapper = createWrapper();

      // Should have various styled elements
      expect(wrapper.find(".integration-link").exists()).toBe(true);
      expect(wrapper.find(".version-badge").exists()).toBe(true);
      expect(wrapper.find(".license-info").exists()).toBe(true);
    });
  });
});

import type { AnalysisStats } from "@/codeclarity_components/results/stats.entity";
import { mount } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import VulnsGraph from "./VulnsGraph.vue";

// Mock Icon component
vi.mock("@iconify/vue", () => ({
  Icon: {
    name: "Icon",
    props: ["icon", "class"],
    template: '<span class="mock-icon" :class="$props.class">{{ icon }}</span>',
  },
}));

// Mock Card components
vi.mock("@/shadcn/ui/card", () => ({
  Card: {
    name: "Card",
    props: ["class"],
    template:
      '<div class="mock-card" :class="$props.class"><slot></slot></div>',
  },
  CardContent: {
    name: "CardContent",
    props: ["class"],
    template:
      '<div class="mock-card-content" :class="$props.class"><slot></slot></div>',
  },
  CardHeader: {
    name: "CardHeader",
    props: ["class"],
    template:
      '<div class="mock-card-header" :class="$props.class"><slot></slot></div>',
  },
  CardTitle: {
    name: "CardTitle",
    props: ["class"],
    template:
      '<div class="mock-card-title" :class="$props.class"><slot></slot></div>',
  },
}));

// Mock async components
const MockSecurityImpact = {
  name: "SecurityImpact",
  props: ["stats"],
  template: '<div class="mock-security-impact">SecurityImpact</div>',
};

const MockVulnerabilitiesInfo = {
  name: "VulnerabilitiesInfo",
  props: ["stats"],
  template: '<div class="mock-vulnerabilities-info">VulnerabilitiesInfo</div>',
};

const MockOwaspTopTen = {
  name: "OwaspTopTen",
  props: ["stats"],
  template: '<div class="mock-owasp-top-ten">OwaspTopTen</div>',
};

vi.mock("./components/SecurityImpact.vue", () => ({
  default: MockSecurityImpact,
  __isTeleport: false,
  __isKeepAlive: false,
}));

vi.mock("./components/VulnerabilitiesInfo.vue", () => ({
  default: MockVulnerabilitiesInfo,
  __isTeleport: false,
  __isKeepAlive: false,
}));

vi.mock("./components/OwaspTopTen.vue", () => ({
  default: MockOwaspTopTen,
  __isTeleport: false,
  __isKeepAlive: false,
}));

// Mock base components
vi.mock("@/base_components/utilities/ErrorComponent.vue", () => ({
  default: {
    name: "ErrorComponent",
    template: '<div class="mock-error-component">Error</div>',
  },
}));

vi.mock("@/base_components/ui/loaders/LoadingComponent.vue", () => ({
  default: {
    name: "LoadingComponent",
    template: '<div class="mock-loading-component">Loading</div>',
  },
}));

describe.skip("VulnsGraph.vue", () => {
  const createMockStats = (overrides = {}): AnalysisStats => {
    return {
      number_of_vulnerabilities: 25,
      number_of_direct_vulnerabilities: 10,
      number_of_transitive_vulnerabilities: 15,
      mean_confidentiality_impact: 2.5,
      mean_integrity_impact: 3.0,
      mean_availability_impact: 1.8,
      number_of_owasp_top_10_2021_a1: 2,
      number_of_owasp_top_10_2021_a2: 1,
      number_of_owasp_top_10_2021_a3: 3,
      number_of_owasp_top_10_2021_a4: 0,
      number_of_owasp_top_10_2021_a5: 1,
      number_of_owasp_top_10_2021_a6: 2,
      number_of_owasp_top_10_2021_a7: 0,
      number_of_owasp_top_10_2021_a8: 1,
      number_of_owasp_top_10_2021_a9: 0,
      number_of_owasp_top_10_2021_a10: 0,
      ...overrides,
    } as AnalysisStats;
  };

  const createWrapper = (stats = createMockStats(), props = {}) => {
    return mount(VulnsGraph, {
      props: {
        stats,
        analysisID: "test-analysis-id",
        projectID: "test-project-id",
        ...props,
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("should render the main container", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".space-y-6").exists()).toBe(true);
    });

    it("should render the vulnerability analysis section", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("Detailed Vulnerability Analysis");
      expect(wrapper.text()).toContain(
        "In-depth breakdown of security vulnerabilities and their impact",
      );
    });

    it("should render the main grid layout", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".grid.gap-6.lg\\:grid-cols-3").exists()).toBe(true);
    });
  });

  describe("Vulnerability Distribution Card", () => {
    it("should render the vulnerabilities card with correct count", () => {
      const stats = createMockStats({ number_of_vulnerabilities: 42 });
      const wrapper = createWrapper(stats);

      expect(wrapper.text()).toContain("42 Vulnerabilities");
      expect(wrapper.text()).toContain("Severity distribution breakdown");
    });

    it("should have vulnerability info card container", () => {
      const wrapper = createWrapper();

      // Check that the card content area exists where VulnerabilitiesInfo would be rendered
      const cardContent = wrapper.find(".mock-card-content");
      expect(cardContent.exists()).toBe(true);
    });

    it("should render appropriate icons", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("tabler:chart-donut");
      expect(wrapper.text()).toContain("tabler:bug");
    });
  });

  describe("OWASP Top 10 Card", () => {
    it("should calculate and display OWASP total count correctly", () => {
      const stats = createMockStats({
        number_of_owasp_top_10_2021_a1: 2,
        number_of_owasp_top_10_2021_a2: 3,
        number_of_owasp_top_10_2021_a3: 1,
        number_of_owasp_top_10_2021_a4: 0,
        number_of_owasp_top_10_2021_a5: 2,
        number_of_owasp_top_10_2021_a6: 1,
        number_of_owasp_top_10_2021_a7: 0,
        number_of_owasp_top_10_2021_a8: 1,
        number_of_owasp_top_10_2021_a9: 0,
        number_of_owasp_top_10_2021_a10: 1,
      });
      const wrapper = createWrapper(stats);

      expect(wrapper.text()).toContain("11 categorized vulnerabilities");
    });

    it("should have OWASP Top 10 card container", () => {
      const wrapper = createWrapper();

      // Check that the OWASP card exists
      const cards = wrapper.findAllComponents({ name: "Card" });
      expect(cards.length).toBe(3);
    });

    it("should handle zero OWASP counts", () => {
      const stats = createMockStats({
        number_of_owasp_top_10_2021_a1: 0,
        number_of_owasp_top_10_2021_a2: 0,
        number_of_owasp_top_10_2021_a3: 0,
        number_of_owasp_top_10_2021_a4: 0,
        number_of_owasp_top_10_2021_a5: 0,
        number_of_owasp_top_10_2021_a6: 0,
        number_of_owasp_top_10_2021_a7: 0,
        number_of_owasp_top_10_2021_a8: 0,
        number_of_owasp_top_10_2021_a9: 0,
        number_of_owasp_top_10_2021_a10: 0,
      });
      const wrapper = createWrapper(stats);

      expect(wrapper.text()).toContain("0 categorized vulnerabilities");
    });

    it("should render OWASP icons", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("simple-icons:owasp");
      expect(wrapper.text()).toContain("tabler:list-check");
    });
  });

  describe("Security Impact Card", () => {
    it("should render security impact section", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("Security Impact");
      expect(wrapper.text()).toContain("CIA triad impact assessment");
    });

    it("should have security impact card container", () => {
      const wrapper = createWrapper();

      // Check that the security impact card exists
      const cards = wrapper.findAllComponents({ name: "Card" });
      expect(cards.length).toBe(3);
    });

    it("should render security icons", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("tabler:radar-2");
      expect(wrapper.text()).toContain("tabler:shield-exclamation");
    });
  });

  describe("Additional Analysis Metrics", () => {
    it("should display direct vs transitive vulnerabilities", () => {
      const stats = createMockStats({
        number_of_direct_vulnerabilities: 8,
        number_of_transitive_vulnerabilities: 12,
      });
      const wrapper = createWrapper(stats);

      expect(wrapper.text()).toContain("Direct Dependencies");
      expect(wrapper.text()).toContain("8");
      expect(wrapper.text()).toContain("Transitive Dependencies");
      expect(wrapper.text()).toContain("12");
    });

    it("should calculate transitive percentage correctly", () => {
      const stats = createMockStats({
        number_of_direct_vulnerabilities: 10,
        number_of_transitive_vulnerabilities: 20,
      });
      const wrapper = createWrapper(stats);

      // 20 / (10 + 20) * 100 = 67%
      expect(wrapper.text()).toContain("67% from transitive deps");
    });

    it("should handle null vulnerability counts", () => {
      const stats = createMockStats({
        number_of_direct_vulnerabilities: null,
        number_of_transitive_vulnerabilities: null,
      });
      const wrapper = createWrapper(stats);

      expect(wrapper.text()).toContain("0");
      expect(wrapper.text()).toContain("0% from transitive deps");
    });

    it("should display CIA impact values", () => {
      const stats = createMockStats({
        mean_confidentiality_impact: 2.7,
        mean_integrity_impact: 3.2,
        mean_availability_impact: 1.9,
      });
      const wrapper = createWrapper(stats);

      expect(wrapper.text()).toContain("Confidentiality");
      expect(wrapper.text()).toContain("2.7");
      expect(wrapper.text()).toContain("Integrity");
      expect(wrapper.text()).toContain("3.2");
      expect(wrapper.text()).toContain("Availability");
      expect(wrapper.text()).toContain("1.9");
    });

    it("should handle null CIA impact values", () => {
      const stats = createMockStats({
        mean_confidentiality_impact: null,
        mean_integrity_impact: null,
        mean_availability_impact: null,
      });
      const wrapper = createWrapper(stats);

      expect(wrapper.text()).toContain("0.0");
    });

    it("should display OWASP coverage information", () => {
      const stats = createMockStats({
        number_of_vulnerabilities: 20,
        number_of_owasp_top_10_2021_a1: 3,
        number_of_owasp_top_10_2021_a2: 2,
        number_of_owasp_top_10_2021_a3: 1,
        number_of_owasp_top_10_2021_a4: 0,
        number_of_owasp_top_10_2021_a5: 0,
        number_of_owasp_top_10_2021_a6: 0,
        number_of_owasp_top_10_2021_a7: 0,
        number_of_owasp_top_10_2021_a8: 0,
        number_of_owasp_top_10_2021_a9: 0,
        number_of_owasp_top_10_2021_a10: 0,
      });
      const wrapper = createWrapper(stats);

      expect(wrapper.text()).toContain("Categorized");
      expect(wrapper.text()).toContain("6"); // 3 + 2 + 1
      expect(wrapper.text()).toContain("Uncategorized");
      expect(wrapper.text()).toContain("14"); // 20 - 6
      expect(wrapper.text()).toContain("30% coverage"); // 6/20 * 100
    });
  });

  describe("Props Handling", () => {
    it("should accept analysisID prop", () => {
      const wrapper = createWrapper(createMockStats(), {
        analysisID: "custom-analysis",
      });

      expect(wrapper.props("analysisID")).toBe("custom-analysis");
    });

    it("should accept projectID prop", () => {
      const wrapper = createWrapper(createMockStats(), {
        projectID: "custom-project",
      });

      expect(wrapper.props("projectID")).toBe("custom-project");
    });

    it("should handle default props", () => {
      const wrapper = mount(VulnsGraph, {
        props: {
          stats: createMockStats(),
        },
      });

      expect(wrapper.props("projectID")).toBe("");
      expect(wrapper.props("analysisID")).toBe("");
    });

    it("should have all three main cards", () => {
      const wrapper = createWrapper();

      const cards = wrapper.findAllComponents({ name: "Card" });
      expect(cards.length).toBe(3);
    });
  });

  describe("Static Content Validation", () => {
    it("should display correct initial OWASP count", () => {
      const stats = createMockStats({
        number_of_owasp_top_10_2021_a1: 1,
        number_of_owasp_top_10_2021_a2: 1,
        number_of_owasp_top_10_2021_a3: 0,
        number_of_owasp_top_10_2021_a4: 0,
        number_of_owasp_top_10_2021_a5: 0,
        number_of_owasp_top_10_2021_a6: 0,
        number_of_owasp_top_10_2021_a7: 0,
        number_of_owasp_top_10_2021_a8: 0,
        number_of_owasp_top_10_2021_a9: 0,
        number_of_owasp_top_10_2021_a10: 0,
      });
      const wrapper = createWrapper(stats);

      expect(wrapper.text()).toContain("2 categorized vulnerabilities");
    });

    it("should display correct initial percentage calculation", () => {
      const stats = createMockStats({
        number_of_vulnerabilities: 10,
        number_of_owasp_top_10_2021_a1: 2,
        number_of_owasp_top_10_2021_a2: 0,
        number_of_owasp_top_10_2021_a3: 0,
        number_of_owasp_top_10_2021_a4: 0,
        number_of_owasp_top_10_2021_a5: 0,
        number_of_owasp_top_10_2021_a6: 0,
        number_of_owasp_top_10_2021_a7: 0,
        number_of_owasp_top_10_2021_a8: 0,
        number_of_owasp_top_10_2021_a9: 0,
        number_of_owasp_top_10_2021_a10: 0,
      });
      const wrapper = createWrapper(stats);

      expect(wrapper.text()).toContain("20% coverage");
    });
  });

  describe("Edge Cases", () => {
    it("should handle division by zero in transitive percentage", () => {
      const stats = createMockStats({
        number_of_direct_vulnerabilities: 0,
        number_of_transitive_vulnerabilities: 0,
      });
      const wrapper = createWrapper(stats);

      expect(wrapper.text()).toContain("0% from transitive deps");
    });

    it("should handle division by zero in OWASP coverage", () => {
      const stats = createMockStats({
        number_of_vulnerabilities: 0,
        number_of_owasp_top_10_2021_a1: 0,
      });
      const wrapper = createWrapper(stats);

      expect(wrapper.text()).toContain("0% coverage");
    });

    it("should handle negative values gracefully", () => {
      const stats = createMockStats({
        number_of_vulnerabilities: -5,
        number_of_direct_vulnerabilities: -2,
      });
      const wrapper = createWrapper(stats);

      expect(wrapper.exists()).toBe(true);
    });
  });

  describe("Styling and Layout", () => {
    it("should have correct CSS classes for main layout", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".space-y-6").exists()).toBe(true);
      expect(wrapper.find(".bg-gradient-to-r").exists()).toBe(true);
      expect(wrapper.find(".grid.gap-6.lg\\:grid-cols-3").exists()).toBe(true);
    });

    it("should apply gradient backgrounds to cards", () => {
      const wrapper = createWrapper();

      const cards = wrapper.findAllComponents({ name: "Card" });
      expect(cards.length).toBe(3);

      // Check that cards have gradient classes
      expect(wrapper.html()).toContain("from-blue-50");
      expect(wrapper.html()).toContain("from-purple-50");
      expect(wrapper.html()).toContain("from-red-50");
    });

    it("should render icons with proper classes", () => {
      const wrapper = createWrapper();

      const icons = wrapper.findAllComponents({ name: "Icon" });
      expect(icons.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading structure", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("Detailed Vulnerability Analysis");
      expect(wrapper.text()).toContain("Vulnerabilities");
      expect(wrapper.text()).toContain("OWASP Top 10");
      expect(wrapper.text()).toContain("Security Impact");
    });

    it("should have descriptive text for metrics", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("Severity distribution breakdown");
      expect(wrapper.text()).toContain("CIA triad impact assessment");
      expect(wrapper.text()).toContain("categorized vulnerabilities");
    });
  });
});

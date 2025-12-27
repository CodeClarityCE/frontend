import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";
import { VulnerabilityDetails } from "./VulnDetails";
import VulnSummaryContent from "./VulnSummaryContent.vue";

// Mock date utils
vi.mock("@/utils/dateUtils", () => ({
  formatDate: vi.fn((date, _format) => `formatted-${date}`),
}));

// Mock Icon component
vi.mock("@iconify/vue", () => ({
  Icon: {
    name: "Icon",
    props: ["icon"],
    template: '<span class="mock-icon">{{ icon }}</span>',
  },
}));

// Mock BubbleComponent
vi.mock("@/base_components/data-display/bubbles/BubbleComponent.vue", () => ({
  default: {
    name: "BubbleComponent",
    props: ["slim"],
    template: '<div class="mock-bubble"><slot name="content"></slot></div>',
  },
}));

// Mock InfoMarkdown
vi.mock("@/base_components/ui/InfoMarkdown.vue", () => ({
  default: {
    name: "InfoMarkdown",
    props: ["markdown"],
    template: '<div class="mock-info-markdown">{{ markdown }}</div>',
  },
}));

// Mock Card components
vi.mock("@/shadcn/ui/card", () => ({
  Card: {
    name: "Card",
    template: '<div class="mock-card"><slot></slot></div>',
  },
  CardContent: {
    name: "CardContent",
    template: '<div class="mock-card-content"><slot></slot></div>',
  },
  CardDescription: {
    name: "CardDescription",
    template: '<div class="mock-card-description"><slot></slot></div>',
  },
  CardHeader: {
    name: "CardHeader",
    template: '<div class="mock-card-header"><slot></slot></div>',
  },
  CardTitle: {
    name: "CardTitle",
    template: '<div class="mock-card-title"><slot></slot></div>',
  },
}));

// Mock CenteredModal
vi.mock("@/base_components/ui/modals/CenteredModal.vue", () => ({
  default: {
    name: "CenteredModal",
    template: '<div class="mock-centered-modal"></div>',
  },
}));

describe("VulnSummaryContent.vue", () => {
  const createMockFinding = (overrides = {}) => {
    const finding = new VulnerabilityDetails();
    finding.vulnerability_info = {
      vulnerability_id: "CVE-2021-1234",
      published: "2021-01-01",
      last_modified: "2021-06-01",
      description: "This is a test vulnerability description.",
      aliases: ["GHSA-abcd-1234", "SNYK-JS-TEST-1234"],
      sources: [
        {
          name: "NVD",
          vuln_url: "https://nvd.nist.gov/vuln/detail/CVE-2021-1234",
        },
        { name: "OSV", vuln_url: "https://osv.dev/CVE-2021-1234" },
      ],
      version_info: {
        affected_versions_string: ">= 1.0.0, < 2.0.0",
        patched_versions_string: ">= 2.0.0",
        versions: [],
      },
    } as any;
    finding.weaknesses = [
      {
        id: "CWE-79",
        name: "Cross-site Scripting (XSS)",
        description: "XSS vulnerability description",
      },
    ] as any;
    finding.owasp_top_10 = {
      name: "A03:2021 – Injection",
      description: "OWASP Top 10 description",
    } as any;
    finding.common_consequences = {
      "CWE-79": [
        {
          consequence: "Common consequences for XSS vulnerabilities",
          impact: ["Confidentiality", "Integrity"],
        },
      ],
    } as any;
    finding.other = {
      package_manager: "NPM",
    } as any;

    return Object.assign(finding, overrides);
  };

  const createWrapper = (finding = createMockFinding(), props = {}) => {
    return mount(VulnSummaryContent, {
      props: {
        finding,
        readMeModalRef: {
          show: vi.fn(),
          hide: vi.fn(),
          toggle: vi.fn(),
        } as any,
        readme: "Test readme content",
        activeView: "patches",
        ...props,
      },
    });
  };

  describe("Component Rendering", () => {
    it("should render the main vulnerability information section", () => {
      const wrapper = createWrapper();

      expect(wrapper.find("section.bg-white").exists()).toBe(true);
      expect(wrapper.text()).toContain("Vulnerability Information");
    });

    it("should render weakness information section", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("Weakness information");
    });

    it("should use grid layout for two columns", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".grid.grid-cols-2").exists()).toBe(true);
    });
  });

  describe("Vulnerability Information", () => {
    it("should display formatted publication date", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("Published:");
      expect(wrapper.text()).toContain("formatted-2021-01-01");
    });

    it("should display formatted last modified date", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("Last modified:");
      expect(wrapper.text()).toContain("formatted-2021-06-01");
    });

    it("should display aliases", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("Aliases:");
      expect(wrapper.text()).toContain("GHSA-abcd-1234");
      expect(wrapper.text()).toContain("SNYK-JS-TEST-1234");
    });

    it("should render alias bubbles", () => {
      const wrapper = createWrapper();

      const bubbles = wrapper.findAllComponents({ name: "BubbleComponent" });
      expect(bubbles.length).toBeGreaterThan(0);
    });

    it("should display vulnerability description", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("Description");
      const infoMarkdown = wrapper.findComponent({ name: "InfoMarkdown" });
      expect(infoMarkdown.exists()).toBe(true);
      expect(infoMarkdown.props("markdown")).toBe(
        "This is a test vulnerability description.",
      );
    });
  });

  describe("Sources Section", () => {
    it("should display sources label", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("Sources:");
    });

    it("should render Vulnerability Lookup link", () => {
      const wrapper = createWrapper();

      const vulnLookupLink = wrapper.find('a[href*="vulnerability.circl.lu"]');
      expect(vulnLookupLink.exists()).toBe(true);
      expect(vulnLookupLink.attributes("target")).toBe("_blank");
      expect(vulnLookupLink.text()).toBe("Vulnerability Lookup");
    });

    it("should render NVD source link when available", () => {
      const wrapper = createWrapper();

      const nvdLink = wrapper.find('a[href*="nvd.nist.gov"]');
      expect(nvdLink.exists()).toBe(true);
      expect(nvdLink.text()).toBe("NVD");
    });

    it("should render OSV source link when available", () => {
      const wrapper = createWrapper();

      const osvLink = wrapper.find('a[href*="osv.dev"]');
      expect(osvLink.exists()).toBe(true);
      expect(osvLink.text()).toBe("OSV");
    });

    it("should show warning when sources disagree (less than 2 sources)", () => {
      const finding = createMockFinding({
        vulnerability_info: {
          ...createMockFinding().vulnerability_info,
          sources: [
            {
              name: "NVD",
              vuln_url: "https://nvd.nist.gov/vuln/detail/CVE-2021-1234",
            },
          ],
        },
      });

      const wrapper = createWrapper(finding);

      expect(wrapper.text()).toContain("NVD and OSV do not agree");
      expect(wrapper.find(".text-severity-medium").exists()).toBe(true);
    });

    it("should not show warning when sources agree (2 or more sources)", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).not.toContain("NVD and OSV do not agree");
    });
  });

  describe("Weakness Information", () => {
    it("should display weakness section when weaknesses exist", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("Weakness information");
      expect(wrapper.text()).toContain(
        "The following aims to provide details on the type of flaw",
      );
    });

    it("should show no weakness information message when no weaknesses", () => {
      const finding = createMockFinding({
        weaknesses: [],
        owasp_top_10: null,
      });

      const wrapper = createWrapper(finding);

      expect(wrapper.text()).toContain("No information on weaknesess");
      expect(wrapper.text()).toContain(
        "If the vulnerability has only recently been published",
      );
    });

    it("should display OWASP Top 10 information when available", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("Owasp Top 10 2021");
      expect(wrapper.text()).toContain("A03:2021 – Injection");
      expect(wrapper.text()).toContain("OWASP Top 10 description");
    });

    it("should render OWASP icon", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("simple-icons:owasp");
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing aliases", () => {
      const finding = createMockFinding({
        vulnerability_info: {
          ...createMockFinding().vulnerability_info,
          aliases: [],
        },
      });

      const wrapper = createWrapper(finding);

      expect(wrapper.text()).toContain("Aliases:");
      // Should not crash and should render empty aliases section
    });

    it("should handle missing sources", () => {
      const finding = createMockFinding({
        vulnerability_info: {
          ...createMockFinding().vulnerability_info,
          sources: [],
        },
      });

      const wrapper = createWrapper(finding);

      expect(wrapper.text()).toContain("Sources:");
      expect(wrapper.text()).toContain("NVD and OSV do not agree");
    });

    it("should handle missing publication dates", () => {
      const finding = createMockFinding({
        vulnerability_info: {
          ...createMockFinding().vulnerability_info,
          published: null,
          last_modified: null,
        },
      });

      const wrapper = createWrapper(finding);

      expect(wrapper.text()).toContain("Published:");
      expect(wrapper.text()).toContain("Last modified:");
    });

    it("should handle empty description", () => {
      const finding = createMockFinding({
        vulnerability_info: {
          ...createMockFinding().vulnerability_info,
          description: "",
        },
      });

      const wrapper = createWrapper(finding);

      const infoMarkdown = wrapper.findComponent({ name: "InfoMarkdown" });
      expect(infoMarkdown.props("markdown")).toBe("");
    });
  });

  describe("Component Integration", () => {
    it("should pass correct props to BubbleComponent", () => {
      const wrapper = createWrapper();

      const bubbles = wrapper.findAllComponents({ name: "BubbleComponent" });
      bubbles.forEach((bubble) => {
        expect(bubble.props("slim")).toBe(true);
      });
    });

    it("should pass correct props to InfoMarkdown", () => {
      const wrapper = createWrapper();

      const infoMarkdown = wrapper.findComponent({ name: "InfoMarkdown" });
      expect(infoMarkdown.props("markdown")).toBe(
        "This is a test vulnerability description.",
      );
    });

    it("should render help icons", () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain("material-symbols:help-outline");
    });
  });

  describe("Links and External Navigation", () => {
    it("should create correct vulnerability lookup URL", () => {
      const wrapper = createWrapper();

      const vulnLookupLink = wrapper.find('a[href*="vulnerability.circl.lu"]');
      expect(vulnLookupLink.attributes("href")).toBe(
        "https://vulnerability.circl.lu/vuln/CVE-2021-1234",
      );
    });

    it("should open external links in new tabs", () => {
      const wrapper = createWrapper();

      const externalLinks = wrapper.findAll('a[target="_blank"]');
      expect(externalLinks.length).toBeGreaterThan(0);

      externalLinks.forEach((link) => {
        expect(link.attributes("target")).toBe("_blank");
      });
    });
  });

  describe("Styling and Layout", () => {
    it("should have correct CSS classes for sections", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".bg-white.shadow-md.rounded-lg").exists()).toBe(
        true,
      );
      expect(wrapper.find(".grid.grid-cols-2.gap-6").exists()).toBe(true);
    });

    it("should style vulnerability title correctly", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".font-black.text-xl.text-gray-800").exists()).toBe(
        true,
      );
      expect(wrapper.find(".text-primary.text-3xl").exists()).toBe(true);
    });

    it("should have overflow handling for description", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".overflow-y-auto").exists()).toBe(true);
    });
  });
});

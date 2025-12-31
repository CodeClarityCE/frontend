import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { License } from "./License";
import LicenseComponent from "./LicenseComponent.vue";

// Mock child components
vi.mock("@/shadcn/ui/popover/Popover.vue", () => ({
  default: {
    name: "Popover",
    template: '<div data-testid="popover"><slot></slot></div>',
  },
}));

vi.mock("@/shadcn/ui/popover/PopoverTrigger.vue", () => ({
  default: {
    name: "PopoverTrigger",
    template: '<div data-testid="popover-trigger"><slot></slot></div>',
    props: ["as-child"],
  },
}));

vi.mock("@/shadcn/ui/popover/PopoverContent.vue", () => ({
  default: {
    name: "PopoverContent",
    template: '<div data-testid="popover-content"><slot></slot></div>',
    props: ["class"],
  },
}));

vi.mock("@/shadcn/ui/badge/Badge.vue", () => ({
  default: {
    name: "Badge",
    template: '<div data-testid="badge"><slot></slot></div>',
    props: ["variant", "class"],
  },
}));

vi.mock("@/shadcn/ui/card", () => ({
  Card: {
    name: "Card",
    template: '<div data-testid="card"><slot></slot></div>',
    props: ["class"],
  },
  CardContent: {
    name: "CardContent",
    template: '<div data-testid="card-content"><slot></slot></div>',
    props: ["class"],
  },
}));

vi.mock("@/shadcn/ui/button", () => ({
  Button: {
    name: "Button",
    template: '<button data-testid="button"><slot></slot></button>',
    props: ["variant", "size"],
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

describe("LicenseComponent.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const createMockLicense = (): License => {
    const license = new License();
    license.id = "MIT";
    license.licenseId = "MIT";
    license.name = "MIT License";
    license.description = "A permissive license";
    license.license_category = "Permissive";
    license.deps_using_license = ["package1", "package2"];
    license.references = ["https://opensource.org/licenses/MIT"];
    license.license_compliance_violation = false;
    license.unable_to_infer = false;
    license.license_properties = {
      permissions: ["commercial-use", "modifications", "distribution"],
      conditions: ["include-copyright"],
      limitations: ["liability", "warranty"],
      usage: "Permissive use",
    };
    license._key = "license_key_123";
    return license;
  };

  const createWrapper = (props = {}) => {
    const defaultProps = {
      license: createMockLicense(),
    };

    return mount(LicenseComponent, {
      props: { ...defaultProps, ...props },
      global: {
        stubs: {
          Icon: true,
          RouterLink: true,
        },
      },
    });
  };

  it("renders correctly with required props", () => {
    const wrapper = createWrapper();

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('[data-testid="card"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="card-content"]').exists()).toBe(true);
  });

  it("displays license name and ID correctly", () => {
    const mockLicense = createMockLicense();
    mockLicense.id = "Apache-2.0";
    mockLicense.name = "Apache License 2.0";

    const wrapper = createWrapper({ license: mockLicense });

    expect(wrapper.text()).toContain("Apache License 2.0");
    expect(wrapper.text()).toContain("(Apache-2.0)");
  });

  it("shows license category information", () => {
    const wrapper = createWrapper();

    expect(wrapper.text()).toContain("Category:");
    expect(wrapper.text()).toContain("Permissive");
  });

  it("displays dependency count", () => {
    const wrapper = createWrapper();

    expect(wrapper.text()).toContain("Dependencies:");
    expect(wrapper.text()).toContain("2");
  });

  it("shows references when available", () => {
    const wrapper = createWrapper();

    expect(wrapper.text()).toContain("References:");
    expect(wrapper.text()).toContain("opensource.org");
  });

  it("handles license with no name (only ID)", () => {
    const mockLicense = createMockLicense();
    mockLicense.name = "";

    const wrapper = createWrapper({ license: mockLicense });

    expect(wrapper.text()).toContain("MIT");
    expect(wrapper.text()).not.toContain("()");
  });

  it("categorizes permissive license correctly", () => {
    const mockLicense = createMockLicense();
    mockLicense.license_category = "Permissive";

    const wrapper = createWrapper({ license: mockLicense });

    expect((wrapper.vm as any).licenseCategory).toBe("permissive");
    expect((wrapper.vm as any).licenseTypeInfo.riskLevel).toBe("Low Risk");
  });

  it("categorizes copyleft license correctly", () => {
    const mockLicense = createMockLicense();
    mockLicense.license_category = "Copyleft";

    const wrapper = createWrapper({ license: mockLicense });

    expect((wrapper.vm as any).licenseCategory).toBe("copyleft");
    expect((wrapper.vm as any).licenseTypeInfo.riskLevel).toBe("Medium Risk");
  });

  it("categorizes strong copyleft license correctly", () => {
    const mockLicense = createMockLicense();
    mockLicense.license_category = "Strong";

    const wrapper = createWrapper({ license: mockLicense });

    expect((wrapper.vm as any).licenseCategory).toBe("strong-copyleft");
    expect((wrapper.vm as any).licenseTypeInfo.riskLevel).toBe("High Risk");
  });

  it("categorizes weak copyleft license correctly", () => {
    const mockLicense = createMockLicense();
    mockLicense.license_category = "Weak";

    const wrapper = createWrapper({ license: mockLicense });

    expect((wrapper.vm as any).licenseCategory).toBe("weak-copyleft");
    expect((wrapper.vm as any).licenseTypeInfo.riskLevel).toBe("Medium Risk");
  });

  it("handles unknown license category", () => {
    const mockLicense = createMockLicense();
    mockLicense.license_category = "Unknown Category";

    const wrapper = createWrapper({ license: mockLicense });

    expect((wrapper.vm as any).licenseCategory).toBe("unknown");
    expect((wrapper.vm as any).licenseTypeInfo.riskLevel).toBe(
      "Review Required",
    );
  });

  it("calculates dependency count correctly", () => {
    const mockLicense = createMockLicense();
    mockLicense.deps_using_license = ["pkg1", "pkg2", "pkg3"];

    const wrapper = createWrapper({ license: mockLicense });

    expect((wrapper.vm as any).dependencyCount).toBe(3);
  });

  it("handles empty dependencies array", () => {
    const mockLicense = createMockLicense();
    mockLicense.deps_using_license = [];

    const wrapper = createWrapper({ license: mockLicense });

    expect((wrapper.vm as any).dependencyCount).toBe(0);
  });

  it("detects compliance violation issues", () => {
    const mockLicense = createMockLicense();
    mockLicense.license_compliance_violation = true;

    const wrapper = createWrapper({ license: mockLicense });

    expect((wrapper.vm as any).hasIssues).toBe(true);
    expect(wrapper.text()).toContain("License Compliance Violation");
  });

  it("detects unable to infer issues", () => {
    const mockLicense = createMockLicense();
    mockLicense.unable_to_infer = true;

    const wrapper = createWrapper({ license: mockLicense });

    expect((wrapper.vm as any).hasIssues).toBe(true);
    expect(wrapper.text()).toContain("Unknown license reference");
  });

  it("toggles expanded state correctly", async () => {
    const wrapper = createWrapper();

    expect((wrapper.vm as any).isExpanded).toBe(false);

    const expandButton = wrapper.find('[data-testid="button"]');
    await expandButton.trigger("click");

    expect((wrapper.vm as any).isExpanded).toBe(true);
  });

  it("displays description when expanded", async () => {
    const mockLicense = createMockLicense();
    mockLicense.description = "This is a test description";

    const wrapper = createWrapper({ license: mockLicense });

    // Set expanded to true and update
    (wrapper.vm as any).isExpanded = true;
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("Description");
    expect(wrapper.text()).toContain("This is a test description");
  });

  it("shows permissions section when expanded", async () => {
    const wrapper = createWrapper();

    // Set expanded to true and update
    (wrapper.vm as any).isExpanded = true;
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("Permissions");
    expect(wrapper.text()).toContain("Commercial Use");
    expect(wrapper.text()).toContain("Modifications");
  });

  it("shows conditions section when expanded", async () => {
    const wrapper = createWrapper();

    // Set expanded to true and update
    (wrapper.vm as any).isExpanded = true;
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("Conditions");
    expect(wrapper.text()).toContain("Include Copyright");
  });

  it("shows limitations section when expanded", async () => {
    const wrapper = createWrapper();

    // Set expanded to true and update
    (wrapper.vm as any).isExpanded = true;
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("Limitations");
    expect(wrapper.text()).toContain("Liability");
    expect(wrapper.text()).toContain("Warranty");
  });

  it("formats property names correctly", () => {
    const wrapper = createWrapper();

    expect((wrapper.vm as any).formatPropertyName("commercial-use")).toBe(
      "Commercial Use",
    );
    expect((wrapper.vm as any).formatPropertyName("include-copyright")).toBe(
      "Include Copyright",
    );
    expect((wrapper.vm as any).formatPropertyName("same-license-file")).toBe(
      "Same License File",
    );
  });

  it("extracts domain from reference URL correctly", () => {
    const wrapper = createWrapper();

    expect(
      (wrapper.vm as any).referenceDomain(
        "https://opensource.org/licenses/MIT",
      ),
    ).toBe("opensource.org");
    expect(
      (wrapper.vm as any).referenceDomain(
        "https://www.apache.org/licenses/LICENSE-2.0",
      ),
    ).toBe("www.apache.org");
  });

  it("handles invalid reference URL gracefully", () => {
    const wrapper = createWrapper();

    // Mock console.error to prevent it from showing in test output
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect((wrapper.vm as any).referenceDomain("invalid-url")).toBe("");

    consoleSpy.mockRestore();
  });

  it("gets correct property descriptions", () => {
    const wrapper = createWrapper();

    expect(
      (wrapper.vm as any).getPermissionDescription("commercial-use"),
    ).toContain("commercial purposes");
    expect(
      (wrapper.vm as any).getConditionDescription("include-copyright"),
    ).toContain("copyright notice");
    expect((wrapper.vm as any).getLimitationDescription("liability")).toContain(
      "limitation of liability",
    );
  });

  it("gets correct property icons", () => {
    const wrapper = createWrapper();

    expect((wrapper.vm as any).getPropertyIcon("commercial-use")).toBe(
      "tabler:building-store",
    );
    expect((wrapper.vm as any).getPropertyIcon("modifications")).toBe(
      "tabler:edit",
    );
    expect((wrapper.vm as any).getPropertyIcon("liability")).toBe(
      "tabler:shield-off",
    );
  });

  it("handles props correctly", () => {
    const wrapper = createWrapper({
      analysisID: "analysis-123",
      projectID: "project-456",
      last: true,
    });

    expect(wrapper.props("analysisID")).toBe("analysis-123");
    expect(wrapper.props("projectID")).toBe("project-456");
    expect(wrapper.props("last")).toBe(true);
  });

  it("has correct default props", () => {
    const wrapper = createWrapper();

    expect(wrapper.props("last")).toBe(false);
    expect(wrapper.props("analysisID")).toBe("");
    expect(wrapper.props("projectID")).toBe("");
  });
});

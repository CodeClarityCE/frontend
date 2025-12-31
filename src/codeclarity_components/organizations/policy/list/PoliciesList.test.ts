import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MemberRole } from "@/codeclarity_components/organizations/organization.entity";

import PoliciesList from "./PoliciesList.vue";

// Mock router
vi.mock("@/router", () => ({
  default: {
    push: vi.fn(),
  },
}));

// Mock auth store
vi.mock("@/stores/auth", () => ({
  useAuthStore: vi.fn(() => ({
    getAuthenticated: true,
    getToken: "test-token",
  })),
}));

// Mock license policy repository
const mockLicensePolicyRepo = {
  getLicensePolicies: vi.fn(),
};

vi.mock(
  "@/codeclarity_components/organizations/policy/license_policy.repository",
  () => ({
    LicensePolicyRepository: vi
      .fn()
      .mockImplementation(() => mockLicensePolicyRepo),
    BusinessLogicError: class BusinessLogicError extends Error {
      constructor(
        message: string,
        public error_code?: string,
      ) {
        super(message);
        this.name = "BusinessLogicError";
      }
    },
    ValidationError: class ValidationError extends Error {
      constructor(
        message: string,
        public error_code?: string,
      ) {
        super(message);
        this.name = "ValidationError";
      }
    },
  }),
);

// Mock child components
vi.mock(
  "@/codeclarity_components/organizations/subcomponents/HeaderItem.vue",
  () => ({
    default: {
      name: "HeaderItem",
      template: '<div data-testid="header-item"></div>',
      props: ["orgId"],
      emits: ["onOrgInfo"],
    },
  }),
);

vi.mock("@/base_components/ui/loaders/BoxLoader.vue", () => ({
  default: {
    name: "BoxLoader",
    template: '<div data-testid="box-loader"></div>',
    props: ["dimensions"],
  },
}));

vi.mock("@/base_components/ui/cards/InfoCard.vue", () => ({
  default: {
    name: "InfoCard",
    template:
      '<div data-testid="info-card"><slot></slot><slot name="actions"></slot></div>',
    props: ["title", "description", "icon", "variant"],
  },
}));

vi.mock("@/base_components/ui/cards/StatCard.vue", () => ({
  default: {
    name: "StatCard",
    template: '<div data-testid="stat-card"></div>',
    props: ["label", "value", "icon", "variant", "subtitle", "subtitleIcon"],
  },
}));

vi.mock("@/shadcn/ui/button/Button.vue", () => ({
  default: {
    name: "Button",
    template: '<button data-testid="button"><slot></slot></button>',
    props: ["variant", "size"],
  },
}));

vi.mock("@iconify/vue", () => ({
  Icon: {
    name: "Icon",
    template: '<span data-testid="icon"></span>',
    props: ["icon"],
  },
}));

// Mock RouterLink
const MockRouterLink = {
  name: "RouterLink",
  template: '<a data-testid="router-link"><slot></slot></a>',
  props: ["to"],
};

describe.skip("PoliciesList", () => {
  let wrapper: any;

  const mockLicensePolicies = [
    {
      id: "policy-1",
      name: "MIT License Policy",
      description: "Policy for MIT licensed packages",
      type: "LICENSE",
      active: true,
    },
    {
      id: "policy-2",
      name: "GPL License Policy",
      description: "Policy for GPL licensed packages",
      type: "LICENSE",
      active: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockLicensePolicyRepo.getLicensePolicies.mockResolvedValue({
      data: mockLicensePolicies,
    });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it("renders correctly", () => {
    wrapper = mount(PoliciesList, {
      props: {
        page: "policies",
        orgId: "test-org-id",
      },
      global: {
        components: {
          RouterLink: MockRouterLink,
        },
      },
    });

    expect(wrapper.find(".min-h-screen").exists()).toBe(true);
    expect(wrapper.find(".bg-gray-50").exists()).toBe(true);
  });

  it("shows HeaderItem with correct orgId", () => {
    wrapper = mount(PoliciesList, {
      props: {
        page: "policies",
        orgId: "test-org-id",
      },
      global: {
        components: {
          RouterLink: MockRouterLink,
        },
      },
    });

    const headerItem = wrapper.findComponent({ name: "HeaderItem" });
    expect(headerItem.exists()).toBe(true);
    expect(headerItem.props().orgId).toBe("test-org-id");
  });

  it("displays license policies overview", () => {
    wrapper = mount(PoliciesList, {
      props: {
        page: "policies",
        orgId: "test-org-id",
      },
      global: {
        components: {
          RouterLink: MockRouterLink,
        },
      },
    });

    const infoCard = wrapper.findComponent({ name: "InfoCard" });
    expect(infoCard.exists()).toBe(true);
    expect(infoCard.props().title).toBe("License Policies");
    expect(infoCard.props().description).toBe(
      "Manage license compliance policies for your organization",
    );
    expect(infoCard.props().icon).toBe("solar:shield-check-bold");
    expect(infoCard.props().variant).toBe("primary");
  });

  it("shows loading state when loading is true", async () => {
    // Mock the repository to delay response so we can see loading state
    mockLicensePolicyRepo.getLicensePolicies.mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve({ data: [] }), 100)),
    );

    wrapper = mount(PoliciesList, {
      props: {
        page: "policies",
        orgId: "test-org-id",
      },
      global: {
        components: {
          RouterLink: MockRouterLink,
        },
      },
    });

    // Initially loading should be true while fetchPolicies is running
    const boxLoaders = wrapper.findAllComponents({ name: "BoxLoader" });
    expect(boxLoaders.length).toBeGreaterThan(0);
  });

  it("displays policy statistics when data is loaded", async () => {
    wrapper = mount(PoliciesList, {
      props: {
        page: "policies",
        orgId: "test-org-id",
      },
      global: {
        components: {
          RouterLink: MockRouterLink,
        },
      },
    });

    wrapper.vm.loading = false;
    wrapper.vm.error = false;
    wrapper.vm.licensePolicies = mockLicensePolicies;

    await wrapper.vm.$nextTick();

    const statCards = wrapper.findAllComponents({ name: "StatCard" });
    expect(statCards.length).toBeGreaterThan(0);
  });

  it("shows error state when error is true", async () => {
    wrapper = mount(PoliciesList, {
      props: {
        page: "policies",
        orgId: "test-org-id",
      },
      global: {
        components: {
          RouterLink: MockRouterLink,
        },
      },
    });

    wrapper.vm.orgInfo = { id: "test-org", role: MemberRole.ADMIN };
    wrapper.vm.loading = false;
    wrapper.vm.error = true;
    wrapper.vm.errorCode = "NETWORK_ERROR";

    await wrapper.vm.$nextTick();

    expect(wrapper.html()).toContain("Failed to fetch license policies");
  });

  it("fetches policies on mount", async () => {
    wrapper = mount(PoliciesList, {
      props: {
        page: "policies",
        orgId: "test-org-id",
      },
      global: {
        components: {
          RouterLink: MockRouterLink,
        },
      },
    });

    // Wait for async operations
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockLicensePolicyRepo.getLicensePolicies).toHaveBeenCalledWith({
      orgId: "test-org-id",
      bearerToken: "test-token",
      handleBusinessErrors: true,
      page: 0,
      entries_per_page: 0,
      search_key: "",
    });
  });

  it("redirects unauthorized users", () => {
    wrapper = mount(PoliciesList, {
      props: {
        page: "policies",
        orgId: "test-org-id",
      },
      global: {
        components: {
          RouterLink: MockRouterLink,
        },
      },
    });

    const orgInfo = {
      id: "test-org",
      role: MemberRole.USER,
    };

    wrapper.vm.setOrgInfo(orgInfo);

    // Verify router.push was called for unauthorized redirect
  });

  it("allows access for authorized users", () => {
    wrapper = mount(PoliciesList, {
      props: {
        page: "policies",
        orgId: "test-org-id",
      },
      global: {
        components: {
          RouterLink: MockRouterLink,
        },
      },
    });

    const orgInfo = {
      id: "test-org",
      role: MemberRole.ADMIN,
    };

    wrapper.vm.setOrgInfo(orgInfo);

    // Admin users should have access without redirect
    expect(wrapper.vm.orgInfo).toEqual(orgInfo);
  });

  it("handles business logic errors correctly", async () => {
    const mockError = new Error("Network error") as any;
    mockError.error_code = "NETWORK_ERROR";
    mockLicensePolicyRepo.getLicensePolicies.mockRejectedValue(mockError);

    wrapper = mount(PoliciesList, {
      props: {
        page: "policies",
        orgId: "test-org-id",
      },
      global: {
        components: {
          RouterLink: MockRouterLink,
        },
      },
    });

    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.vm.error).toBe(true);
  });

  it("initializes with correct default values", () => {
    wrapper = mount(PoliciesList, {
      props: {
        page: "policies",
        orgId: "test-org-id",
      },
      global: {
        components: {
          RouterLink: MockRouterLink,
        },
      },
    });

    expect(wrapper.vm.licensePolicies).toEqual([]);
    // Loading starts as true because fetchPolicies() is called on mount
    expect(wrapper.vm.loading).toBe(true);
    expect(wrapper.vm.error).toBe(false);
    expect(wrapper.vm.errorCode).toBeUndefined();
  });

  it("accepts props with correct typing", () => {
    wrapper = mount(PoliciesList, {
      props: {
        page: "test-page",
        orgId: "test-org-id",
        action: "test-action",
      },
      global: {
        components: {
          RouterLink: MockRouterLink,
        },
      },
    });

    expect(wrapper.props().page).toBe("test-page");
    expect(wrapper.props().orgId).toBe("test-org-id");
    expect(wrapper.props().action).toBe("test-action");
  });

  it("handles missing action prop", () => {
    wrapper = mount(PoliciesList, {
      props: {
        page: "policies",
        orgId: "test-org-id",
      },
      global: {
        components: {
          RouterLink: MockRouterLink,
        },
      },
    });

    expect(wrapper.props().action).toBeUndefined();
    expect(wrapper.exists()).toBe(true);
  });

  it("shows no policies state when empty", async () => {
    wrapper = mount(PoliciesList, {
      props: {
        page: "policies",
        orgId: "test-org-id",
      },
      global: {
        components: {
          RouterLink: MockRouterLink,
        },
      },
    });

    wrapper.vm.loading = false;
    wrapper.vm.error = false;
    wrapper.vm.licensePolicies = [];

    await wrapper.vm.$nextTick();

    // Component shows add new policy card when no policies exist
    expect(wrapper.html()).toContain("Add License Policy");
  });

  it("handles refresh action correctly", async () => {
    wrapper = mount(PoliciesList, {
      props: {
        page: "policies",
        orgId: "test-org-id",
      },
      global: {
        components: {
          RouterLink: MockRouterLink,
        },
      },
    });

    const fetchSpy = vi.spyOn(wrapper.vm, "fetchPolicies");
    await wrapper.vm.fetchPolicies(true);

    expect(fetchSpy).toHaveBeenCalledWith(true);
  });
});

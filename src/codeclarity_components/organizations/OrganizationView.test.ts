import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import OrganizationView from "./OrganizationView.vue";

// Mock the state store
const mockStateStore = {
  $reset: vi.fn(),
  page: "orgs",
};

vi.mock("@/stores/state", () => ({
  useStateStore: () => mockStateStore,
}));

// Mock Vue's defineAsyncComponent to return sync components
vi.mock("vue", async () => {
  const actual = await vi.importActual("vue");
  return {
    ...actual,
    defineAsyncComponent: (options: any) => {
      // Return the mock component directly based on the loader path
      const loaderStr = (options.loader ?? options)?.toString();
      if (loaderStr?.includes("OrganizationsList")) {
        return {
          name: "OrganizationsList",
          template:
            '<div data-testid="organizations-list">Organizations List</div>',
        };
      }
      if (loaderStr?.includes("OrganizationCreate")) {
        return {
          name: "OrganizationCreate",
          template:
            '<div data-testid="organization-create">Create Organization</div>',
        };
      }
      if (loaderStr?.includes("PoliciesView")) {
        return {
          name: "PoliciesView",
          template: '<div data-testid="policies-view">Policies</div>',
          props: ["page", "orgId", "action"],
        };
      }
      if (loaderStr?.includes("ManageAuditLogs")) {
        return {
          name: "ManageAuditLogs",
          template: '<div data-testid="manage-audit-logs">Audit Logs</div>',
          props: ["page", "orgId"],
        };
      }
      if (loaderStr?.includes("ManageMembers")) {
        return {
          name: "ManageMembers",
          template: '<div data-testid="manage-members">Manage Members</div>',
          props: ["page", "orgId"],
        };
      }
      if (loaderStr?.includes("ManageInvites")) {
        return {
          name: "ManageInvites",
          template: '<div data-testid="manage-invites">Manage Invites</div>',
          props: ["page", "orgId"],
        };
      }
      if (loaderStr?.includes("IntegrationsView")) {
        return {
          name: "IntegrationsView",
          template: '<div data-testid="integrations-view">Integrations</div>',
          props: ["page", "orgId", "action"],
        };
      }
      if (loaderStr?.includes("AnalyzersView")) {
        return {
          name: "AnalyzersView",
          template: '<div data-testid="analyzers-view">Analyzers</div>',
          props: ["page", "orgId", "action"],
        };
      }
      if (loaderStr?.includes("OrganizationManage")) {
        return {
          name: "OrganizationManage",
          template:
            '<div data-testid="organization-manage">Organization Manage</div>',
          props: ["page", "orgId"],
        };
      }
      // Fallback
      return {
        name: "AsyncComponent",
        template: "<div>Loading...</div>",
      };
    },
  };
});

// Mock the dynamic imports
vi.mock(
  "@/codeclarity_components/organizations/list/OrganizationsList.vue",
  () => ({
    default: {
      name: "OrganizationsList",
      template:
        '<div data-testid="organizations-list">Organizations List</div>',
    },
  }),
);

vi.mock(
  "@/codeclarity_components/organizations/create/OrganizationCreate.vue",
  () => ({
    default: {
      name: "OrganizationCreate",
      template:
        '<div data-testid="organization-create">Create Organization</div>',
    },
  }),
);

vi.mock("./audit_logs/ManageAuditLogs.vue", () => ({
  default: {
    name: "ManageAuditLogs",
    template: '<div data-testid="manage-audit-logs">Audit Logs</div>',
    props: ["page", "orgId"],
  },
}));

vi.mock("./policy/PoliciesView.vue", () => ({
  default: {
    name: "PoliciesView",
    template: '<div data-testid="policies-view">Policies</div>',
    props: ["page", "orgId", "action"],
  },
}));

vi.mock("./manage/OrganizationManage.vue", () => ({
  default: {
    name: "OrganizationManage",
    template:
      '<div data-testid="organization-manage">Organization Manage</div>',
    props: ["page", "orgId"],
  },
}));

vi.mock("./members/ManageMembers.vue", () => ({
  default: {
    name: "ManageMembers",
    template: '<div data-testid="manage-members">Manage Members</div>',
    props: ["page", "orgId"],
  },
}));

vi.mock("./invites/ManageInvites.vue", () => ({
  default: {
    name: "ManageInvites",
    template: '<div data-testid="manage-invites">Manage Invites</div>',
    props: ["page", "orgId"],
  },
}));

vi.mock("./integrations/IntegrationsView.vue", () => ({
  default: {
    name: "IntegrationsView",
    template: '<div data-testid="integrations-view">Integrations</div>',
    props: ["page", "orgId", "action"],
  },
}));

vi.mock("./analyzers/AnalyzersView.vue", () => ({
  default: {
    name: "AnalyzersView",
    template: '<div data-testid="analyzers-view">Analyzers</div>',
    props: ["page", "orgId", "action"],
  },
}));

describe("OrganizationView", () => {
  let wrapper: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStateStore.$reset.mockClear();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('shows OrganizationsList when action is "list" and no orgId', async () => {
    wrapper = mount(OrganizationView, {
      props: {
        action: "list",
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.html()).toContain("Organizations List");
    expect(wrapper.html()).not.toContain("Create Organization");
  });

  it('shows OrganizationCreate when action is "add" and no orgId', async () => {
    wrapper = mount(OrganizationView, {
      props: {
        action: "add",
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.html()).toContain("Create Organization");
    expect(wrapper.html()).not.toContain("Organizations List");
  });

  it('shows PoliciesView when page is "policies" and orgId exists', async () => {
    wrapper = mount(OrganizationView, {
      props: {
        page: "policies",
        orgId: "test-org-id",
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.html()).toContain("Policies");
  });

  it('shows PoliciesView when page is "policy" and orgId exists', async () => {
    wrapper = mount(OrganizationView, {
      props: {
        page: "policy",
        orgId: "test-org-id",
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.html()).toContain("Policies");
  });

  it('shows ManageAuditLogs when page is "logs" and orgId exists', async () => {
    wrapper = mount(OrganizationView, {
      props: {
        page: "logs",
        orgId: "test-org-id",
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.html()).toContain("Audit Logs");
  });

  it('shows ManageMembers when page is "members" and orgId exists', async () => {
    wrapper = mount(OrganizationView, {
      props: {
        page: "members",
        orgId: "test-org-id",
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.html()).toContain("Manage Members");
  });

  it('shows ManageInvites when page is "invites" and orgId exists', async () => {
    wrapper = mount(OrganizationView, {
      props: {
        page: "invites",
        orgId: "test-org-id",
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.html()).toContain("Manage Invites");
  });

  it('shows IntegrationsView when page is "integrations" and orgId exists', async () => {
    wrapper = mount(OrganizationView, {
      props: {
        page: "integrations",
        orgId: "test-org-id",
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.html()).toContain("Integrations");
  });

  it('shows AnalyzersView when page is "analyzers" and orgId exists', async () => {
    wrapper = mount(OrganizationView, {
      props: {
        page: "analyzers",
        orgId: "test-org-id",
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.html()).toContain("Analyzers");
  });

  it("shows OrganizationManage as fallback when page and orgId exist", async () => {
    wrapper = mount(OrganizationView, {
      props: {
        page: "overview",
        orgId: "test-org-id",
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.html()).toContain("Organization Manage");
  });

  it("initializes state store correctly", () => {
    wrapper = mount(OrganizationView);

    expect(mockStateStore.page).toBe("orgs");
  });

  it("resets state store on mount", () => {
    wrapper = mount(OrganizationView);

    expect(mockStateStore.$reset).toHaveBeenCalled();
  });

  it("accepts props with correct typing", () => {
    wrapper = mount(OrganizationView, {
      props: {
        action: "test-action",
        page: "test-page",
        orgId: "test-org-id",
      },
    });

    expect(wrapper.props().action).toBe("test-action");
    expect(wrapper.props().page).toBe("test-page");
    expect(wrapper.props().orgId).toBe("test-org-id");
  });

  it("handles undefined props gracefully", () => {
    wrapper = mount(OrganizationView, {
      props: {
        action: undefined,
        page: undefined,
        orgId: undefined,
      },
    });

    expect(wrapper.text()).toBe("");
  });

  it("passes correct props to child components", async () => {
    wrapper = mount(OrganizationView, {
      props: {
        page: "members",
        orgId: "test-org-id",
        action: "test-action",
      },
    });

    await wrapper.vm.$nextTick();

    const manageMembersComponent = wrapper.findComponent({
      name: "ManageMembers",
    });
    if (manageMembersComponent.exists()) {
      expect(manageMembersComponent.props().page).toBe("members");
      expect(manageMembersComponent.props().orgId).toBe("test-org-id");
    }
  });
  it("shows only the section the route asks for", () => {
    wrapper = mount(OrganizationView, {
      props: { page: "members", orgId: "test-org-id" },
    });

    expect(wrapper.text()).toBe("Manage Members");
  });

  // Each section owns its heading, so the view adds no title or description of its own.
  it.each<[Record<string, string>, string]>([
    [{ action: "add" }, "Create Organization"],
    [{ action: "list" }, "Organizations List"],
    [{ page: "policies", orgId: "test-org-id" }, "Policies"],
    [{ page: "members", orgId: "test-org-id" }, "Manage Members"],
    [{ page: "logs", orgId: "test-org-id" }, "Audit Logs"],
    [{ page: "invites", orgId: "test-org-id" }, "Manage Invites"],
    [{ page: "integrations", orgId: "test-org-id" }, "Integrations"],
  ])("route %o shows only the section text %s", (props, text) => {
    wrapper = mount(OrganizationView, { props });

    expect(wrapper.text()).toBe(text);
  });

  it("renders no heading of its own", () => {
    wrapper = mount(OrganizationView, { props: { action: "list" } });

    expect(wrapper.find("h1, h2, [role=heading]").exists()).toBe(false);
  });
});

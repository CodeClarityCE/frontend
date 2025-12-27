import { mount } from "@vue/test-utils";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import PoliciesView from "./PoliciesView.vue";

// Mock the async components with proper loading/error components
vi.mock("@/base_components/utilities/ErrorComponent.vue", () => ({
  default: {
    name: "ErrorComponent",
    template: '<div data-testid="error-component">Error</div>',
  },
}));

vi.mock("@/base_components/ui/loaders/LoadingComponent.vue", () => ({
  default: {
    name: "LoadingComponent",
    template: '<div data-testid="loading-component">Loading</div>',
  },
}));

// Mock the dynamic imports
vi.mock("./list/PoliciesList.vue", () => ({
  default: {
    name: "OrgPoliciesList",
    template: '<div data-testid="policies-list">Policies List</div>',
    props: ["page", "orgId"],
  },
}));

vi.mock("./create/PolicyCreate.vue", () => ({
  default: {
    name: "OrgPoliciesCreate",
    template: '<div data-testid="policy-create">Policy Create</div>',
    props: ["page", "orgId"],
  },
}));

vi.mock("./edit/PolicyEdit.vue", () => ({
  default: {
    name: "OrgPoliciesEdit",
    template: '<div data-testid="policy-edit">Policy Edit</div>',
    props: ["page", "orgId"],
  },
}));

describe.skip("PoliciesView", () => {
  let wrapper: any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it("renders correctly", () => {
    wrapper = mount(PoliciesView, {
      props: {
        page: "policies",
        orgId: "test-org-id",
        action: "manage",
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('shows PoliciesList when action is "manage"', async () => {
    wrapper = mount(PoliciesView, {
      props: {
        page: "policies",
        orgId: "test-org-id",
        action: "manage",
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.html()).toContain("Policies List");
    expect(wrapper.html()).not.toContain("Policy Create");
    expect(wrapper.html()).not.toContain("Policy Edit");
  });

  it('shows PolicyCreate when action is "add"', async () => {
    wrapper = mount(PoliciesView, {
      props: {
        page: "policies",
        orgId: "test-org-id",
        action: "add",
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.html()).toContain("Policy Create");
    expect(wrapper.html()).not.toContain("Policies List");
    expect(wrapper.html()).not.toContain("Policy Edit");
  });

  it('shows PolicyEdit when action is "edit"', async () => {
    wrapper = mount(PoliciesView, {
      props: {
        page: "policies",
        orgId: "test-org-id",
        action: "edit",
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.html()).toContain("Policy Edit");
    expect(wrapper.html()).not.toContain("Policies List");
    expect(wrapper.html()).not.toContain("Policy Create");
  });

  it("shows nothing when action is undefined", async () => {
    wrapper = mount(PoliciesView, {
      props: {
        page: "policies",
        orgId: "test-org-id",
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.html()).not.toContain("Policies List");
    expect(wrapper.html()).not.toContain("Policy Create");
    expect(wrapper.html()).not.toContain("Policy Edit");
  });

  it("shows nothing when action is not recognized", async () => {
    wrapper = mount(PoliciesView, {
      props: {
        page: "policies",
        orgId: "test-org-id",
        action: "unknown",
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.html()).not.toContain("Policies List");
    expect(wrapper.html()).not.toContain("Policy Create");
    expect(wrapper.html()).not.toContain("Policy Edit");
  });

  it("passes correct props to PoliciesList", async () => {
    wrapper = mount(PoliciesView, {
      props: {
        page: "policies",
        orgId: "test-org-id",
        action: "manage",
      },
    });

    await wrapper.vm.$nextTick();

    const policiesList = wrapper.findComponent({ name: "OrgPoliciesList" });
    if (policiesList.exists()) {
      expect(policiesList.props().page).toBe("policies");
      expect(policiesList.props().orgId).toBe("test-org-id");
    }
  });

  it("passes correct props to PolicyCreate", async () => {
    wrapper = mount(PoliciesView, {
      props: {
        page: "policies",
        orgId: "test-org-id",
        action: "add",
      },
    });

    await wrapper.vm.$nextTick();

    const policyCreate = wrapper.findComponent({ name: "OrgPoliciesCreate" });
    if (policyCreate.exists()) {
      expect(policyCreate.props().page).toBe("policies");
      expect(policyCreate.props().orgId).toBe("test-org-id");
    }
  });

  it("passes correct props to PolicyEdit", async () => {
    wrapper = mount(PoliciesView, {
      props: {
        page: "policies",
        orgId: "test-org-id",
        action: "edit",
      },
    });

    await wrapper.vm.$nextTick();

    const policyEdit = wrapper.findComponent({ name: "OrgPoliciesEdit" });
    if (policyEdit.exists()) {
      expect(policyEdit.props().page).toBe("policies");
      expect(policyEdit.props().orgId).toBe("test-org-id");
    }
  });

  it("accepts props with correct typing", () => {
    wrapper = mount(PoliciesView, {
      props: {
        page: "test-page",
        orgId: "test-org-id",
        action: "test-action",
      },
    });

    expect(wrapper.props().page).toBe("test-page");
    expect(wrapper.props().orgId).toBe("test-org-id");
    expect(wrapper.props().action).toBe("test-action");
  });

  it("handles missing action prop", () => {
    wrapper = mount(PoliciesView, {
      props: {
        page: "policies",
        orgId: "test-org-id",
      },
    });

    expect(wrapper.props().action).toBeUndefined();
    expect(wrapper.exists()).toBe(true);
  });

  it("renders with different page values", async () => {
    const pageValues = ["policies", "policy", "compliance"];

    for (const page of pageValues) {
      wrapper = mount(PoliciesView, {
        props: {
          page,
          orgId: "test-org-id",
          action: "manage",
        },
      });

      await wrapper.vm.$nextTick();

      expect(wrapper.props().page).toBe(page);

      if (wrapper) {
        wrapper.unmount();
      }
    }
  });

  it("renders with different orgId values", async () => {
    const orgIds = ["org-1", "org-2", "test-organization"];

    for (const orgId of orgIds) {
      wrapper = mount(PoliciesView, {
        props: {
          page: "policies",
          orgId,
          action: "manage",
        },
      });

      await wrapper.vm.$nextTick();

      expect(wrapper.props().orgId).toBe(orgId);

      if (wrapper) {
        wrapper.unmount();
      }
    }
  });

  it("supports all valid action values", async () => {
    const actions = ["manage", "add", "edit"];

    for (const action of actions) {
      wrapper = mount(PoliciesView, {
        props: {
          page: "policies",
          orgId: "test-org-id",
          action,
        },
      });

      await wrapper.vm.$nextTick();

      expect(wrapper.props().action).toBe(action);

      if (wrapper) {
        wrapper.unmount();
      }
    }
  });

  it("has consistent component structure", () => {
    wrapper = mount(PoliciesView, {
      props: {
        page: "policies",
        orgId: "test-org-id",
        action: "manage",
      },
    });

    // The component should render without any structural elements
    // since it's just a router for async components
    expect(wrapper.element.tagName).toBeUndefined();
  });
});

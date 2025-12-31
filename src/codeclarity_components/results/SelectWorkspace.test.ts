import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SelectWorkspace from "./SelectWorkspace.vue";
import { WorkspacesOutput } from "./workspace.entity";

// Mock stores - these need to be mutable for per-test overrides
let mockUserStore = {
  getDefaultOrg: { id: "org-1", name: "Test Org" } as {
    id: string;
    name: string;
  } | null,
  getUser: {
    default_org: { id: "org-1", name: "Test Org" },
  } as { default_org: { id: string; name: string } } | null,
};

let mockAuthStore = {
  getToken: "test-token" as string | null,
  getAuthenticated: true,
};

vi.mock("@/stores/user", () => ({
  useUserStore: vi.fn(() => mockUserStore),
}));

vi.mock("@/stores/auth", () => ({
  useAuthStore: vi.fn(() => mockAuthStore),
}));

// Mock results repository - shared mock function for per-test control
const mockWorkspacesResponse = {
  data: {
    workspaces: ["workspace1", "workspace2", "workspace3"],
    package_manager: "npm",
  },
};

const mockGetSbomWorkspaces = vi.fn().mockResolvedValue(mockWorkspacesResponse);
const mockGetResultByType = vi
  .fn()
  .mockImplementation(({ type }: { type: string }) => {
    if (type === "js-sbom") return Promise.resolve({ data: {} });
    if (type === "php-sbom") return Promise.reject(new Error("No results"));
    return Promise.reject(new Error("Unknown type"));
  });

vi.mock("./results.repository", () => ({
  ResultsRepository: class {
    getSbomWorkspaces = mockGetSbomWorkspaces;
    getResultByType = mockGetResultByType;
  },
}));

// Mock Shadcn select components
vi.mock("@/shadcn/ui/select", () => ({
  Select: {
    name: "Select",
    template: '<div data-testid="select"><slot></slot></div>',
    emits: ["update:modelValue"],
  },
  SelectContent: {
    name: "SelectContent",
    template: '<div data-testid="select-content"><slot></slot></div>',
  },
  SelectGroup: {
    name: "SelectGroup",
    template: '<div data-testid="select-group"><slot></slot></div>',
  },
  SelectItem: {
    name: "SelectItem",
    template:
      '<div data-testid="select-item" :data-value="value"><slot></slot></div>',
    props: ["value"],
  },
  SelectLabel: {
    name: "SelectLabel",
    template: '<div data-testid="select-label"><slot></slot></div>',
  },
  SelectTrigger: {
    name: "SelectTrigger",
    template:
      '<button data-testid="select-trigger" class="w-[180px]"><slot></slot></button>',
    props: ["class"],
  },
  SelectValue: {
    name: "SelectValue",
    template: '<span data-testid="select-value">Select a workspace</span>',
    props: ["placeholder"],
  },
}));

describe("SelectWorkspace", () => {
  let wrapper: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock stores to default values
    mockUserStore = {
      getDefaultOrg: { id: "org-1", name: "Test Org" },
      getUser: { default_org: { id: "org-1", name: "Test Org" } },
    };
    mockAuthStore = {
      getToken: "test-token",
      getAuthenticated: true,
    };
    // Reset mock functions to default behavior
    mockGetSbomWorkspaces.mockResolvedValue(mockWorkspacesResponse);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it("renders correctly with default props", async () => {
    wrapper = mount(SelectWorkspace, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    await flushPromises();

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('[data-testid="select"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="select-trigger"]').exists()).toBe(true);
  });

  it("renders with provided projectID and analysisID props", async () => {
    wrapper = mount(SelectWorkspace, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    await flushPromises();
    expect(wrapper.exists()).toBe(true);
  });

  it("displays workspace options after loading", async () => {
    wrapper = mount(SelectWorkspace, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    await flushPromises();

    const selectItems = wrapper.findAll('[data-testid="select-item"]');
    expect(selectItems.length).toBe(3);
    expect(selectItems[0].text()).toBe("workspace1");
    expect(selectItems[1].text()).toBe("workspace2");
    expect(selectItems[2].text()).toBe("workspace3");
  });

  it("shows select label correctly", async () => {
    wrapper = mount(SelectWorkspace, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    await flushPromises();

    const selectLabel = wrapper.find('[data-testid="select-label"]');
    expect(selectLabel.exists()).toBe(true);
    expect(selectLabel.text()).toBe("Available Workspaces");
  });

  it("displays placeholder text", async () => {
    wrapper = mount(SelectWorkspace, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    await flushPromises();

    const selectValue = wrapper.find('[data-testid="select-value"]');
    expect(selectValue.exists()).toBe(true);
    expect(selectValue.text()).toBe("Select a workspace");
  });

  it("has correct CSS classes on trigger", async () => {
    wrapper = mount(SelectWorkspace, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    await flushPromises();

    const selectTrigger = wrapper.find('[data-testid="select-trigger"]');
    expect(selectTrigger.classes()).toContain("w-[180px]");
  });

  it("handles repository error gracefully", async () => {
    // Configure mock to reject
    mockGetSbomWorkspaces.mockRejectedValue(new Error("API Error"));

    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    wrapper = mount(SelectWorkspace, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    await flushPromises();

    expect(consoleError).toHaveBeenCalled();
    expect(wrapper.vm.error).toBe(true);

    consoleError.mockRestore();
  });

  it("does not call repository when no default org", async () => {
    // Configure mock stores for this test
    mockUserStore.getDefaultOrg = null;
    mockUserStore.getUser = null;

    wrapper = mount(SelectWorkspace, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    await flushPromises();

    expect(mockGetSbomWorkspaces).not.toHaveBeenCalled();
  });

  it("does not call repository when not authenticated", async () => {
    // Configure mock stores for this test
    mockAuthStore.getToken = null;
    mockAuthStore.getAuthenticated = false;

    wrapper = mount(SelectWorkspace, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    await flushPromises();

    expect(mockGetSbomWorkspaces).not.toHaveBeenCalled();
  });

  it("calls repository with correct parameters", async () => {
    wrapper = mount(SelectWorkspace, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    await flushPromises();

    expect(mockGetSbomWorkspaces).toHaveBeenCalledWith({
      orgId: "org-1",
      projectId: "project-123",
      analysisId: "analysis-456",
      bearerToken: "test-token",
      handleBusinessErrors: true,
    });
  });

  it("updates selected workspace model on selection", async () => {
    wrapper = mount(SelectWorkspace, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
        "onUpdate:selected_workspace": (value: string) => {
          wrapper.setProps({ selected_workspace: value });
        },
      },
      global: {
        plugins: [],
      },
    });

    await flushPromises();

    const select = wrapper.findComponent({ name: "Select" });
    await select.vm.$emit("update:modelValue", "workspace2");

    expect(wrapper.vm.selected_workspace).toBe("workspace2");
  });

  it("handles null/undefined selection gracefully", async () => {
    wrapper = mount(SelectWorkspace, {
      props: {
        projectID: "project-123",
        analysisID: "analysis-456",
      },
      global: {
        plugins: [],
      },
    });

    await flushPromises();

    const select = wrapper.findComponent({ name: "Select" });
    await select.vm.$emit("update:modelValue", null);

    expect(wrapper.vm.selected_workspace).toBe("");
  });

  it("has correct default values for props", () => {
    wrapper = mount(SelectWorkspace, {
      global: {
        plugins: [],
      },
    });

    expect(wrapper.vm.projectID).toBe("");
    expect(wrapper.vm.analysisID).toBe("");
  });

  it("initializes workspaces as empty WorkspacesOutput", () => {
    wrapper = mount(SelectWorkspace, {
      global: {
        plugins: [],
      },
    });

    expect(wrapper.vm.workspaces).toBeInstanceOf(WorkspacesOutput);
    expect(wrapper.vm.workspaces.workspaces).toBeUndefined();
  });

  it("has correct model defaults", () => {
    wrapper = mount(SelectWorkspace, {
      global: {
        plugins: [],
      },
    });

    expect(wrapper.vm.error).toBe(false);
    expect(wrapper.vm.selected_workspace).toBe(".");
  });
});

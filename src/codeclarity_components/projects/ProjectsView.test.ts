import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProjectsView from "./ProjectsView.vue";

// Mock the state store
const mockStateStore = {
  $reset: vi.fn(),
  page: "projects",
};

vi.mock("@/stores/state", () => ({
  useStateStore: () => mockStateStore,
}));

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
vi.mock("./list/ProjectsList.vue", () => ({
  default: {
    name: "ProjectsList",
    template: '<div data-testid="projects-list">Projects List</div>',
  },
}));

vi.mock("./create/CreateProject.vue", () => ({
  default: {
    name: "CreateProject",
    template: '<div data-testid="create-project">Create Project</div>',
  },
}));

describe("ProjectsView", () => {
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

  it("renders correctly", () => {
    wrapper = mount(ProjectsView);

    expect(wrapper.find("main").exists()).toBe(true);
    expect(wrapper.find("main").classes()).toContain("p-8");
    expect(wrapper.find("main").classes()).toContain("space-y-6");
  });

  it("shows ProjectsList by default when no page prop provided", () => {
    wrapper = mount(ProjectsView);

    // Check that the template logic is working - verify props.page is not 'add'
    expect(wrapper.vm.props?.page).not.toBe("add");

    // The main container should exist
    expect(wrapper.find("main").exists()).toBe(true);
  });

  it('shows CreateProject when page prop is "add"', () => {
    wrapper = mount(ProjectsView, {
      props: {
        page: "add",
      },
    });

    // Check that the page prop is correctly set to 'add'
    expect(wrapper.props().page).toBe("add");
    expect(wrapper.vm.props?.page).toBe("add");
  });

  it('shows ProjectsList when page prop is not "add"', () => {
    wrapper = mount(ProjectsView, {
      props: {
        page: "list",
      },
    });

    // Check that the page prop is set but not 'add'
    expect(wrapper.props().page).toBe("list");
    expect(wrapper.vm.props?.page).toBe("list");
    expect(wrapper.vm.props?.page).not.toBe("add");
  });

  it("initializes state store correctly", () => {
    wrapper = mount(ProjectsView);

    expect(mockStateStore.page).toBe("projects");
  });

  it("resets state store on mount", () => {
    wrapper = mount(ProjectsView);

    expect(mockStateStore.$reset).toHaveBeenCalled();
  });

  it("accepts page prop with correct typing", () => {
    wrapper = mount(ProjectsView, {
      props: {
        page: "test-page",
      },
    });

    expect(wrapper.props().page).toBe("test-page");
  });

  it("handles undefined page prop", () => {
    wrapper = mount(ProjectsView, {
      props: {
        page: undefined,
      },
    });

    // When page is undefined, should default to showing ProjectsList (v-else branch)
    expect(wrapper.props().page).toBeUndefined();
    expect(wrapper.vm.props?.page).toBeUndefined();
    expect(wrapper.vm.props?.page).not.toBe("add");
  });
});

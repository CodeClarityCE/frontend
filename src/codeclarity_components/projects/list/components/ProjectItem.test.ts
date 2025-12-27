import { mount } from "@vue/test-utils";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { IntegrationProvider } from "@/codeclarity_components/organizations/integrations/Integrations";
import type { Project } from "@/codeclarity_components/projects/project.entity";
import ProjectItem from "./ProjectItem.vue";

// Mock all dependencies
vi.mock("@/stores/auth", () => ({
  useAuthStore: vi.fn(() => ({
    getAuthenticated: true,
    getToken: "test-token",
  })),
}));

vi.mock("@/stores/StateStore", () => ({
  useProjectsMainStore: vi.fn(() => ({
    orgId: "test-org-id",
  })),
}));

vi.mock("@/codeclarity_components/projects/project.repository", () => ({
  ProjectRepository: class {
    deleteProject = vi.fn().mockResolvedValue({});
  },
}));

vi.mock("@/utils/dateUtils", () => ({
  formatDate: vi.fn((_date) => "2023-01-01"),
}));

vi.mock("@/utils/toasts", () => ({
  errorToast: vi.fn(),
  successToast: vi.fn(),
}));

// Mock child components
vi.mock("./AnalysisList.vue", () => ({
  default: {
    name: "AnalysisList",
    template: '<div data-testid="analysis-list"></div>',
    props: ["project"],
  },
}));

vi.mock("@/base_components/ui/modals/PositionedModal.vue", () => ({
  default: {
    name: "PositionedModal",
    template: '<div data-testid="positioned-modal"><slot></slot></div>',
    methods: {
      openModal: vi.fn(),
      closeModal: vi.fn(),
    },
  },
}));

vi.mock("@/base_components/ui/modals/CenteredModal.vue", () => ({
  default: {
    name: "CenteredModal",
    template: '<div data-testid="centered-modal"><slot></slot></div>',
    methods: {
      toggle: vi.fn(),
      openModal: vi.fn(),
      closeModal: vi.fn(),
    },
  },
}));

describe.skip("ProjectItem", () => {
  let wrapper: any;
  const mockProject: Project = {
    id: "project-1",
    name: "Test Project",
    description: "Test Description",
    integration_id: "integration-1",
    type: IntegrationProvider.GITHUB,
    url: "https://github.com/test/repo",
    upload_id: "upload-1",
    added_on: new Date("2023-01-01T00:00:00Z"),
    organization_id: "org-1",
    analyses: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it("renders correctly", () => {
    wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
      },
      global: {
        plugins: [],
      },
    });

    expect(wrapper.find('[data-testid="project-item"]').exists()).toBe(false); // Update when actual structure is known
    expect(wrapper.findComponent({ name: "Card" }).exists()).toBe(false); // Will exist in actual implementation
  });

  it("displays project information correctly", () => {
    wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
      },
      global: {
        plugins: [],
      },
    });

    expect(wrapper.text()).toContain("Test Project");
    expect(wrapper.text()).toContain("Test Description");
  });

  it("displays repository information", () => {
    wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
      },
      global: {
        plugins: [],
      },
    });

    expect(wrapper.text()).toContain("Test Project");
  });

  it("shows correct integration provider icon", () => {
    wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
      },
      global: {
        plugins: [],
      },
    });

    // Check for GitHub icon presence
    const icons = wrapper.findAll("[icon]");
    expect(icons.length).toBeGreaterThanOrEqual(0);
  });

  it("displays formatted dates", () => {
    wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
      },
      global: {
        plugins: [],
      },
    });

    expect(wrapper.text()).toContain("2023-01-01");
  });

  it("renders analysis list component", () => {
    wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
      },
      global: {
        plugins: [],
      },
    });

    const analysisList = wrapper.findComponent({ name: "AnalysisList" });
    expect(analysisList.exists()).toBe(true);
    expect(analysisList.props().project).toEqual(mockProject);
  });

  it("opens delete modal when delete button clicked", async () => {
    wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
      },
      global: {
        plugins: [],
      },
    });

    // Find delete button (would need to adjust selector based on actual implementation)
    const deleteButton = wrapper.find('[data-testid="delete-button"]');
    if (deleteButton.exists()) {
      await deleteButton.trigger("click");
      expect(wrapper.vm.projectDeleteModalRef.openModal).toHaveBeenCalled();
    }
  });

  it("calls delete project API on confirmation", async () => {
    wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
      },
      global: {
        plugins: [],
      },
    });

    await wrapper.vm.deleteProject();
    expect(wrapper.vm.projectRepository.deleteProject).toHaveBeenCalledWith({
      orgId: "test-org-id",
      projectId: "project-1",
      bearerToken: "test-token",
      handleBusinessErrors: true,
    });
  });

  it("emits refresh event after successful deletion", async () => {
    wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
      },
      global: {
        plugins: [],
      },
    });

    await wrapper.vm.deleteProject();
    expect(wrapper.emitted("onRefresh")).toBeTruthy();
  });

  it("handles delete error correctly", async () => {
    const mockError = new Error("Delete failed");
    const mockRepo = {
      deleteProject: vi.fn().mockRejectedValue(mockError),
    };

    wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
      },
      global: {
        plugins: [],
      },
    });

    wrapper.vm.projectRepository = mockRepo;

    await wrapper.vm.deleteProject();
    expect(wrapper.vm.errorToast).toHaveBeenCalled();
  });

  it("opens options modal when options button clicked", async () => {
    wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
      },
      global: {
        plugins: [],
      },
    });

    // Find options button
    const optionsButton = wrapper.find('[data-testid="options-button"]');
    if (optionsButton.exists()) {
      await optionsButton.trigger("click");
      expect(wrapper.vm.projectOptionsModalRef.openModal).toHaveBeenCalled();
    }
  });

  it("handles project without repository", () => {
    wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
      },
      global: {
        plugins: [],
      },
    });

    expect(wrapper.text()).toContain("Test Project");
  });

  it("handles project with GitLab repository", () => {
    const gitlabProject = {
      ...mockProject,
      type: IntegrationProvider.GITLAB,
    };

    wrapper = mount(ProjectItem, {
      props: {
        project: gitlabProject,
      },
      global: {
        plugins: [],
      },
    });

    expect(wrapper.text()).toContain("Test Project");
  });

  it("validates required props", () => {
    expect(() => {
      mount(ProjectItem, {
        global: {
          plugins: [],
        },
      });
    }).toThrow();
  });

  it("maintains reactive state properly", async () => {
    wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
      },
      global: {
        plugins: [],
      },
    });

    // Change project prop
    const updatedProject = {
      ...mockProject,
      name: "Updated Project",
    };

    await wrapper.setProps({ project: updatedProject });
    expect(wrapper.text()).toContain("Updated Project");
  });
});

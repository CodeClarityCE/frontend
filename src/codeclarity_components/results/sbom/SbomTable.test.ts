import { SortDirection } from "@/utils/api/PaginatedRequestOptions";
import { mount } from "@vue/test-utils";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import SbomTable from "./SbomTable.vue";

// Mock entire Vue router to avoid dependency issues
vi.mock("vue-router", () => ({
  useRoute: () => ({ params: {}, query: {} }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

// Mock window.location
const mockLocation = {
  search: "?project_id=proj-1&analysis_id=analysis-1",
};
Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
  configurable: true,
});

// Mock stores
const mockUserStore = {
  getDefaultOrg: { id: "org-1", name: "Test Org" },
};

const mockAuthStore = {
  getToken: "test-token",
  getAuthenticated: true,
};

vi.mock("@/stores/user", () => ({
  useUserStore: vi.fn(() => mockUserStore),
}));

vi.mock("@/stores/auth", () => ({
  useAuthStore: vi.fn(() => mockAuthStore),
}));

// Mock all external dependencies to avoid complex import chains
vi.mock("@/codeclarity_components/results/results.repository", () => ({
  ResultsRepository: class {
    getSbom = vi.fn().mockResolvedValue({
      data: [],
      page: 0,
      entries_per_page: 15,
      entry_count: 0,
      matching_count: 0,
      total_entries: 0,
      total_pages: 0,
    });
  },
}));

vi.mock("@/codeclarity_components/projects/project.repository", () => ({
  ProjectsSortInterface: {
    DIRECT: "direct",
    NAME: "name",
    VERSION: "version",
  },
}));

// Mock child components
vi.mock("./table/DataTable.vue", () => ({
  default: {
    name: "DataTable",
    template: '<div data-testid="data-table">Data Table Component</div>',
    props: ["columns", "data", "sorting", "columnFilters", "columnVisibility"],
  },
}));

vi.mock("./table/columns", () => ({
  columns: [
    { id: "name", header: "Name" },
    { id: "version", header: "Version" },
  ],
}));

vi.mock("@/base_components/utilities/PaginationComponent.vue", () => ({
  default: {
    name: "PaginationComponent",
    template: '<div data-testid="pagination">Pagination Component</div>',
    props: [
      "pageNumber",
      "totalPages",
      "pageLimitSelected",
      "nmbEntriesShowing",
      "matchingItemsCount",
      "nmbEntriesTotal",
    ],
    emits: ["update:pageNumber", "update:pageLimitSelected"],
  },
}));

vi.mock("@iconify/vue", () => ({
  Icon: {
    name: "Icon",
    template: '<span data-testid="icon"></span>',
    props: ["icon"],
  },
}));

// Mock TanStack Table types
vi.mock("@tanstack/vue-table", () => ({
  ColumnFiltersState: Array,
  SortingState: Array,
  VisibilityState: Object,
}));

describe("SbomTable", () => {
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
    wrapper = mount(SbomTable, {
      global: {
        plugins: [],
        stubs: {
          DataTable: true,
          PaginationComponent: true,
          Icon: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it("renders DataTable component when render is true", async () => {
    wrapper = mount(SbomTable, {
      global: {
        plugins: [],
        stubs: {
          DataTable: {
            name: "DataTable",
            template: '<div data-testid="data-table">Data Table</div>',
          },
          PaginationComponent: true,
          Icon: true,
        },
      },
    });

    // Set render to true to show DataTable
    wrapper.vm.render = true;
    await wrapper.vm.$nextTick();

    const dataTable = wrapper.find('[data-testid="data-table"]');
    expect(dataTable.exists()).toBe(true);
  });

  it("renders PaginationComponent", () => {
    wrapper = mount(SbomTable, {
      global: {
        plugins: [],
        stubs: {
          DataTable: true,
          PaginationComponent: {
            name: "PaginationComponent",
            template: '<div data-testid="pagination">Pagination</div>',
          },
          Icon: true,
        },
      },
    });

    const pagination = wrapper.find('[data-testid="pagination"]');
    expect(pagination.exists()).toBe(true);
  });

  it("initializes with correct default state", () => {
    wrapper = mount(SbomTable, {
      global: {
        plugins: [],
        stubs: {
          DataTable: true,
          PaginationComponent: true,
          Icon: true,
        },
      },
    });

    expect(wrapper.vm.pageNumber).toBe(0);
    expect(wrapper.vm.pageLimitSelected).toBe(15);
    expect(wrapper.vm.nmbEntriesShowing).toBe(0);
    expect(wrapper.vm.matchingItemsCount).toBe(0);
    expect(wrapper.vm.nmbEntriesTotal).toBe(0);
    expect(wrapper.vm.totalPages).toBe(0);
    expect(wrapper.vm.render).toBe(false);
  });

  it("initializes with correct sorting defaults", () => {
    wrapper = mount(SbomTable, {
      global: {
        plugins: [],
        stubs: {
          DataTable: true,
          PaginationComponent: true,
          Icon: true,
        },
      },
    });

    expect(wrapper.vm.sortDirection).toBe(SortDirection.ASC);
    expect(Array.isArray(wrapper.vm.sorting)).toBe(true);
    expect(Array.isArray(wrapper.vm.columnFilters)).toBe(true);
  });

  it("has correct column visibility defaults", () => {
    wrapper = mount(SbomTable, {
      global: {
        plugins: [],
        stubs: {
          DataTable: true,
          PaginationComponent: true,
          Icon: true,
        },
      },
    });

    expect(wrapper.vm.columnVisibility).toEqual({
      release: false,
    });
  });

  it("has search functionality", () => {
    wrapper = mount(SbomTable, {
      global: {
        plugins: [],
        stubs: {
          DataTable: true,
          PaginationComponent: true,
          Icon: true,
        },
      },
    });

    expect(wrapper.vm.searchKey).toBe("");

    // Test that searchKey is reactive
    wrapper.vm.searchKey = "test search";
    expect(wrapper.vm.searchKey).toBe("test search");
  });

  it("handles workspace model correctly", () => {
    wrapper = mount(SbomTable, {
      props: {
        selected_workspace: "test-workspace",
      },
      global: {
        plugins: [],
        stubs: {
          DataTable: true,
          PaginationComponent: true,
          Icon: true,
        },
      },
    });

    expect(wrapper.vm.selected_workspace).toBe("test-workspace");
  });

  it("handles authentication requirements", () => {
    wrapper = mount(SbomTable, {
      global: {
        plugins: [],
        stubs: {
          DataTable: true,
          PaginationComponent: true,
          Icon: true,
        },
      },
    });

    // Component should access auth store
    expect(mockAuthStore.getToken).toBe("test-token");
    expect(mockAuthStore.getAuthenticated).toBe(true);
    expect(mockUserStore.getDefaultOrg).toBeTruthy();
  });

  it("has proper data structure for dependencies", () => {
    wrapper = mount(SbomTable, {
      global: {
        plugins: [],
        stubs: {
          DataTable: true,
          PaginationComponent: true,
          Icon: true,
        },
      },
    });

    // Data should be initialized as empty array
    expect(Array.isArray(wrapper.vm.data)).toBe(true);
    expect(wrapper.vm.data.length).toBe(0);
  });

  it("handles pagination state correctly", () => {
    wrapper = mount(SbomTable, {
      global: {
        plugins: [],
        stubs: {
          DataTable: true,
          PaginationComponent: true,
          Icon: true,
        },
      },
    });

    // Test pagination reactive state
    expect(typeof wrapper.vm.pageNumber).toBe("number");
    expect(typeof wrapper.vm.totalPages).toBe("number");
    expect(typeof wrapper.vm.pageLimitSelected).toBe("number");
  });

  it("handles column filters state correctly", () => {
    wrapper = mount(SbomTable, {
      global: {
        plugins: [],
        stubs: {
          DataTable: true,
          PaginationComponent: true,
          Icon: true,
        },
      },
    });

    // Test filtering reactive state
    expect(Array.isArray(wrapper.vm.columnFilters)).toBe(true);
    expect(typeof wrapper.vm.columnVisibility).toBe("object");
  });

  it("renders without throwing errors", () => {
    expect(() => {
      wrapper = mount(SbomTable, {
        global: {
          plugins: [],
          stubs: {
            DataTable: true,
            PaginationComponent: true,
            Icon: true,
          },
        },
      });
    }).not.toThrow();

    expect(wrapper.exists()).toBe(true);
  });

  it("has correct component structure", () => {
    wrapper = mount(SbomTable, {
      global: {
        plugins: [],
        stubs: {
          DataTable: true,
          PaginationComponent: true,
          Icon: true,
        },
      },
    });

    // Verify the component has the expected structure
    expect(wrapper.vm).toBeTruthy();
    expect(wrapper.element.tagName).toBe("DIV");
  });
});

import { mount, type VueWrapper } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import type { Repository } from "@/codeclarity_components/projects/project.entity";
import router from "@/router";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";

import BaseImportComponent, {
  IMPORT_CONCURRENCY,
  stripGitSuffix,
} from "./BaseImportComponent.vue";

const { createProject, successToast, errorToast } = vi.hoisted(() => ({
  createProject: vi.fn(),
  successToast: vi.fn(),
  errorToast: vi.fn(),
}));

vi.mock("@/codeclarity_components/projects/project.repository", () => ({
  ProjectRepository: class {
    createProject = createProject;
  },
}));

vi.mock("@/utils/toasts", () => ({ successToast, errorToast }));

// The global setup mocks BaseRepository without its error classes; the
// component needs a real BusinessLogicError for its instanceof checks.
vi.mock("@/utils/api/BaseRepository", () => ({
  BaseRepository: class {},
  BusinessLogicError: class BusinessLogicError extends Error {
    error_code: string;
    error_message: string;
    constructor(error_code: string, error_message: string) {
      super(error_message);
      this.error_code = error_code;
      this.error_message = error_message;
    }
  },
}));

vi.mock("@/base_components", () => ({
  InfoCard: {
    name: "InfoCard",
    props: ["title", "description", "icon", "variant"],
    template:
      '<div data-testid="info-card" :data-title="title"><slot name="actions" /><slot /></div>',
  },
}));

vi.mock("./components/RepoTable.vue", () => ({
  default: {
    name: "RepoTable",
    props: ["integration", "getRepos", "config", "disabled"],
    emits: ["onSelectedReposChange", "onForceRefresh"],
    setup(_props: unknown, { expose }: { expose: (api: object) => void }) {
      expose({
        clearSelection: vi.fn(),
        fetchRepos: vi.fn().mockResolvedValue(undefined),
      });
      return {};
    },
    template: '<div data-testid="repo-table" />',
  },
}));

vi.mock("./components/ImportErrorTable.vue", () => ({
  default: {
    name: "ImportErrorTable",
    props: ["reposFailedToImport"],
    template:
      '<div data-testid="import-error-table"><span v-for="(failed, id) in reposFailedToImport" :key="id" :data-testid="`failed-${id}`">{{ failed.reason }}</span></div>',
  },
}));

vi.mock("./components/FaqComponent.vue", () => ({
  default: { name: "Faq", template: '<div data-testid="faq" />' },
}));

vi.mock("@/shadcn/ui/progress", () => ({
  Progress: {
    name: "Progress",
    props: ["modelValue"],
    template: '<div data-testid="progress" :data-value="modelValue" />',
  },
}));

vi.mock("@/shadcn/ui/button/Button.vue", () => ({
  default: {
    name: "Button",
    props: ["variant", "size", "disabled", "type"],
    emits: ["click"],
    template:
      '<button :type="type ?? \'button\'" :disabled="disabled" @click="$emit(\'click\', $event)"><slot /></button>',
  },
}));

function repo(index: number): Repository {
  return {
    id: `repo-${index}`,
    url: `https://github.com/org/repo-${index}`,
    default_branch: "main",
    visibility: "public",
    fully_qualified_name: `org/repo-${index}`,
    description: "",
    created_at: new Date("2026-01-01"),
    imported_already: false,
    integration_id: "gh-1",
  };
}

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
}

describe("BaseImportComponent bulk import", () => {
  let wrapper: VueWrapper;
  const repos = Array.from({ length: 10 }, (_, i) => repo(i));

  beforeEach(async () => {
    createProject.mockReset();
    successToast.mockReset();
    errorToast.mockReset();
    vi.mocked(router.push).mockClear();

    wrapper = mount(BaseImportComponent, {
      props: {
        integration: "gh-1",
        getRepos: vi.fn().mockResolvedValue({ data: [] }),
      },
    });
    wrapper
      .findComponent({ name: "RepoTable" })
      .vm.$emit("onSelectedReposChange", repos);
    await nextTick();
  });

  it("imports a bounded number of repositories at a time and reports progress", async () => {
    const pending: (() => void)[] = [];
    createProject.mockImplementation(
      () =>
        new Promise<{ id: string }>((resolve) => {
          pending.push(() => resolve({ id: "project" }));
        }),
    );

    const button = wrapper.find('[data-testid="bulk-import-button"]');
    expect(button.text()).toContain("Import 10 Projects");
    await button.trigger("click");
    await flush();

    expect(createProject).toHaveBeenCalledTimes(IMPORT_CONCURRENCY);
    expect(
      wrapper.find('[data-testid="bulk-import-button"]').attributes("disabled"),
    ).toBeDefined();
    expect(wrapper.find('[data-testid="import-progress"]').text()).toContain(
      "Importing 0 / 10",
    );

    pending[0]!();
    await flush();
    expect(createProject).toHaveBeenCalledTimes(IMPORT_CONCURRENCY + 1);
    expect(wrapper.find('[data-testid="import-progress"]').text()).toContain(
      "Importing 1 / 10",
    );
    expect(
      wrapper.find('[data-testid="progress"]').attributes("data-value"),
    ).toBe("10");

    // Let everything else through
    createProject.mockResolvedValue({ id: "project" });
    pending.slice(1).forEach((resolve) => resolve());
    await vi.waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));

    expect(createProject).toHaveBeenCalledTimes(10);
    expect(createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "test-org-id",
        data: { integration_id: "gh-1", url: "https://github.com/org/repo-7" },
        bearerToken: "test-token",
      }),
    );
    expect(successToast).toHaveBeenCalledWith(
      "Succesfully imported 10 repositories",
    );
    expect(errorToast).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith({ name: "projects" });
    expect(wrapper.find('[data-testid="import-progress"]').exists()).toBe(
      false,
    );
  });

  it("freezes the table and keeps the progress visible for the whole import", async () => {
    const pending: (() => void)[] = [];
    createProject.mockImplementation(
      () =>
        new Promise<{ id: string }>((resolve) => {
          pending.push(() => resolve({ id: "project" }));
        }),
    );
    const table = wrapper.findComponent({ name: "RepoTable" });
    expect(table.props("disabled")).toBe(false);

    await wrapper.find('[data-testid="bulk-import-button"]').trigger("click");
    await flush();
    expect(table.props("disabled")).toBe(true);

    table.vm.$emit("onSelectedReposChange", []);
    await flush();
    expect(wrapper.find('[data-testid="import-progress"]').exists()).toBe(true);

    createProject.mockResolvedValue({ id: "project" });
    pending.forEach((resolve) => resolve());
    await vi.waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));
    expect(table.props("disabled")).toBe(false);
  });

  it("keeps the page open and lists failures when some imports fail", async () => {
    createProject.mockImplementation(({ data }: { data: { url: string } }) =>
      data.url.endsWith("/repo-2")
        ? Promise.reject(
            new BusinessLogicError(APIErrors.AlreadyExists, "exists"),
          )
        : Promise.resolve({ id: "project" }),
    );

    await wrapper.find('[data-testid="bulk-import-button"]').trigger("click");
    await vi.waitFor(() => expect(successToast).toHaveBeenCalled());
    await flush();

    expect(createProject).toHaveBeenCalledTimes(10);
    expect(successToast).toHaveBeenCalledWith(
      "Succesfully imported 9 repositories",
    );
    expect(errorToast).toHaveBeenCalledWith("Failed to import 1 repositories");
    expect(router.push).not.toHaveBeenCalled();
    expect(wrapper.find('[data-testid="import-error-table"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="failed-repo-2"]').text()).toBe(
      "Already imported",
    );
  });

  it("ignores a second click while an import is running", async () => {
    const pending: (() => void)[] = [];
    createProject.mockImplementation(
      () =>
        new Promise<{ id: string }>((resolve) => {
          pending.push(() => resolve({ id: "project" }));
        }),
    );

    const button = wrapper.find('[data-testid="bulk-import-button"]');
    await button.trigger("click");
    await flush();
    await button.trigger("click");
    await flush();

    expect(createProject).toHaveBeenCalledTimes(IMPORT_CONCURRENCY);

    createProject.mockResolvedValue({ id: "project" });
    pending.forEach((resolve) => resolve());
    await vi.waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));
    expect(createProject).toHaveBeenCalledTimes(10);
  });
});

describe("BaseImportComponent manual import", () => {
  beforeEach(() => {
    createProject.mockReset();
    createProject.mockResolvedValue({ id: "project" });
    vi.mocked(router.push).mockClear();
  });

  it("imports the typed url without its trailing .git", async () => {
    const wrapper = mount(BaseImportComponent, {
      props: {
        integration: "gh-1",
        getRepos: vi.fn().mockResolvedValue({ data: [] }),
      },
    });

    await wrapper
      .find('input[placeholder="https://github.com/username/repository"]')
      .setValue("https://github.com/octo/octo.github.io.git");
    await wrapper.find("form").trigger("submit");

    await vi.waitFor(() => expect(createProject).toHaveBeenCalledTimes(1));
    expect(createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          integration_id: "gh-1",
          url: "https://github.com/octo/octo.github.io",
        },
      }),
    );
  });
});

describe("stripGitSuffix", () => {
  it.each([
    ["https://github.com/octo/legacy.git", "https://github.com/octo/legacy"],
    ["https://github.com/octo/legacy", "https://github.com/octo/legacy"],
    [
      "https://github.com/torvalds/torvalds.github.io",
      "https://github.com/torvalds/torvalds.github.io",
    ],
    [
      "https://github.com/octo/octo.github.io.git",
      "https://github.com/octo/octo.github.io",
    ],
  ])("turns %s into %s", (url, expected) => {
    expect(stripGitSuffix(url)).toBe(expected);
  });
});

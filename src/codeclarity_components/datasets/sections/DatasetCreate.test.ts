import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import router from "@/router";

import DatasetCreate from "./DatasetCreate.vue";

const { createDataset, getVCS, successToast, errorToast } = vi.hoisted(() => ({
  createDataset: vi.fn(),
  getVCS: vi.fn(),
  successToast: vi.fn(),
  errorToast: vi.fn(),
}));

vi.mock("../datasets.repository", () => ({
  DatasetsRepository: class {
    createDataset = createDataset;
  },
}));

vi.mock(
  "@/codeclarity_components/organizations/integrations/IntegrationsRepository",
  () => ({
    IntegrationsRepository: class {
      getVCS = getVCS;
    },
  }),
);

vi.mock("@/utils/toasts", () => ({ successToast, errorToast }));

vi.mock("@/utils/api/BaseRepository", () => ({
  BaseRepository: class {},
  BusinessLogicError: class BusinessLogicError extends Error {
    error_code: string;
    constructor(error_code: string) {
      super(error_code);
      this.error_code = error_code;
    }
  },
}));

// @vueuse/core is mocked globally, which breaks the shadcn inputs: plain stand-ins.
vi.mock("@/shadcn/ui/input", () => ({
  Input: {
    props: ["modelValue"],
    emits: ["update:modelValue"],
    template:
      '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
}));

vi.mock("@/shadcn/ui/checkbox", () => ({
  Checkbox: {
    props: ["modelValue"],
    emits: ["update:modelValue"],
    template:
      '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
  },
}));

vi.mock("@/shadcn/ui/select", () => ({
  Select: {
    props: ["modelValue"],
    emits: ["update:modelValue"],
    template:
      '<select data-testid="integration-select" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>',
  },
  SelectTrigger: { template: "<span />" },
  SelectValue: { template: "<span />" },
  SelectContent: { template: "<slot />" },
  SelectItem: {
    props: ["value"],
    template: '<option :value="value"><slot /></option>',
  },
}));

const github = {
  id: "gh-1",
  integration_provider: "GITHUB",
  invalid: false,
  service_domain: "github.com",
  added_by: "John",
};

async function mountForm(
  integrations: object[] = [github],
): Promise<VueWrapper> {
  getVCS.mockResolvedValue({ data: integrations });
  const wrapper = mount(DatasetCreate, {
    global: { stubs: { RouterLink: { template: "<a><slot /></a>" } } },
  });
  await flushPromises();
  return wrapper;
}

describe("DatasetCreate", () => {
  beforeEach(() => {
    createDataset.mockReset();
    getVCS.mockReset();
    successToast.mockReset();
    errorToast.mockReset();
    vi.mocked(router.push).mockClear();
  });

  it("offers only valid GitHub integrations and preselects a single one", async () => {
    const wrapper = await mountForm([
      github,
      { ...github, id: "gh-2", invalid: true },
      { ...github, id: "gl-1", integration_provider: "GITLAB" },
      { ...github, id: "gh-3", expiry_date: new Date("2026-10-29T16:33:12Z") },
    ]);

    const options = wrapper.findAll("option");
    expect(options.map((option) => option.attributes("value"))).toEqual([
      "gh-1",
    ]);
    expect(
      (
        wrapper.find('[data-testid="integration-select"]')
          .element as HTMLSelectElement
      ).value,
    ).toBe("gh-1");
  });

  it("shows the validation errors and does not submit an invalid form", async () => {
    const wrapper = await mountForm();
    await wrapper.find('[data-testid="dataset-limit"]').setValue("0");

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(createDataset).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("A name is required");
    expect(wrapper.text()).toContain("A whole number between 1 and 500");
  });

  it("requires at least one language", async () => {
    const wrapper = await mountForm();
    await wrapper.find('[data-testid="dataset-name"]').setValue("top100");
    await wrapper
      .find('[data-testid="dataset-language-JavaScript"]')
      .setValue(false);
    await wrapper
      .find('[data-testid="dataset-language-TypeScript"]')
      .setValue(false);

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(createDataset).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Pick at least one language");
  });

  it("creates the dataset and opens it", async () => {
    createDataset.mockResolvedValue({ id: "ds-1" });
    const wrapper = await mountForm();
    await wrapper.find('[data-testid="dataset-name"]').setValue("  top50 ");
    await wrapper.find('[data-testid="dataset-limit"]').setValue("50");
    await wrapper.find('[data-testid="dataset-pages"]').setValue("2");
    await wrapper
      .find('[data-testid="dataset-language-TypeScript"]')
      .setValue(false);

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(createDataset).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "test-org-id",
        bearerToken: "test-token",
        data: {
          name: "top50",
          integration_id: "gh-1",
          limit: 50,
          pages: 2,
          min_stars: 1000,
          languages: ["JavaScript"],
        },
      }),
    );
    expect(router.push).toHaveBeenCalledWith({
      name: "datasets",
      params: { page: "detail" },
      query: { id: "ds-1" },
    });
  });

  it("explains a duplicate name", async () => {
    const { BusinessLogicError } = await import("@/utils/api/BaseRepository");
    createDataset.mockRejectedValue(
      new (BusinessLogicError as unknown as new (code: string) => Error)(
        "AlreadyExists",
      ),
    );
    const wrapper = await mountForm();
    await wrapper.find('[data-testid="dataset-name"]').setValue("top100");

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(errorToast).toHaveBeenCalledWith(
      "A dataset with this name already exists",
    );
    expect(router.push).not.toHaveBeenCalled();
  });
});

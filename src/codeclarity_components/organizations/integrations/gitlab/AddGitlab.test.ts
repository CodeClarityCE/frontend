import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AddGitlab from "./AddGitlab.vue";

const {
  addGitlabIntegration,
  getGitlabIntegration,
  updateGitlabIntegration,
  route,
} = vi.hoisted(() => ({
  addGitlabIntegration: vi.fn(),
  getGitlabIntegration: vi.fn(),
  updateGitlabIntegration: vi.fn(),
  route: { params: { orgId: "org-1" }, query: {} },
}));

vi.mock("vue-router", () => ({
  RouterLink: { template: "<a><slot /></a>" },
  useRoute: () => route,
}));

vi.mock("@/router", () => ({ default: { back: vi.fn(), push: vi.fn() } }));

vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getToken: "test-token" }),
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

vi.mock("@/utils/toasts", () => ({ successToast: vi.fn() }));

vi.mock(
  "@/codeclarity_components/organizations/integrations/IntegrationsRepository",
  () => ({
    IntegrationsRepository: class {
      addGitlabIntegration = addGitlabIntegration;
      getGitlabIntegration = getGitlabIntegration;
      updateGitlabIntegration = updateGitlabIntegration;
    },
  }),
);

const BASE = "https://gitlab.example.com";
const TOKEN = "glpat-xxxxxxxxxxxxxxxxxxxx";

// A valid GitLab URL of exactly `length` characters.
function urlOfLength(length: number): string {
  return `${BASE}/${"a".repeat(length - BASE.length - 1)}`;
}

async function submitSelfHosted(url: string): Promise<VueWrapper> {
  const wrapper = mount(AddGitlab);
  await wrapper.find("#integration-token").setValue(TOKEN);
  await wrapper.find("#gitlab-self-hosted").trigger("click");
  await flushPromises();
  await wrapper.find("#gitlab-url").setValue(url);
  await wrapper.find("form").trigger("submit");
  await flushPromises();
  return wrapper;
}

describe("AddGitlab instance URL", () => {
  beforeEach(() => {
    route.query = {};
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows a field error for a URL over 255 characters and sends nothing", async () => {
    const wrapper = await submitSelfHosted(urlOfLength(256));

    expect(wrapper.find("#gitlab-url-error").text()).toBe(
      "Enter a URL of at most 255 characters",
    );
    expect(addGitlabIntegration).not.toHaveBeenCalled();
  });

  it("sends a 255 character URL", async () => {
    const url = urlOfLength(255);

    const wrapper = await submitSelfHosted(url);

    expect(wrapper.find("#gitlab-url-error").exists()).toBe(false);
    expect(addGitlabIntegration).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ gitlab_instance_url: url }),
      }),
    );
  });

  it("counts the URL without its trailing slash", async () => {
    const url = urlOfLength(255);

    await submitSelfHosted(`${url}/`);

    expect(addGitlabIntegration).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ gitlab_instance_url: url }),
      }),
    );
  });
});

describe("AddGitlab replacing a token", () => {
  const SELF_HOSTED = "https://gitlab.acme.io";

  beforeEach(() => {
    route.query = { update: "int-1" };
    getGitlabIntegration.mockResolvedValue({
      id: "int-1",
      service_domain: SELF_HOSTED,
      service_base_url: SELF_HOSTED,
    });
    updateGitlabIntegration.mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows the stored instance URL and offers no way to change it", async () => {
    const wrapper = mount(AddGitlab);
    await flushPromises();

    expect(wrapper.text()).toContain("Replace the GitLab token");
    expect(wrapper.text()).toContain(SELF_HOSTED);
    expect(wrapper.find("#gitlab-self-hosted").exists()).toBe(false);
    expect(wrapper.find("#gitlab-url").exists()).toBe(false);
  });

  it("sends the new token with the stored instance URL", async () => {
    const wrapper = mount(AddGitlab);
    await flushPromises();

    await wrapper.find("#integration-token").setValue(TOKEN);
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(updateGitlabIntegration).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "org-1",
        integrationId: "int-1",
        data: expect.objectContaining({
          token: TOKEN,
          gitlab_instance_url: SELF_HOSTED,
        }),
      }),
    );
    expect(addGitlabIntegration).not.toHaveBeenCalled();
  });
});

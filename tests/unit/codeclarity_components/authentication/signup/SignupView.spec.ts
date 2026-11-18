import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SignupView from "@/codeclarity_components/authentication/signup/SignupView.vue";

const mockStateStore = {
  $reset: vi.fn(),
  page: "",
  publicPage: false,
};

vi.mock("@/stores/state", () => ({
  useStateStore: vi.fn(() => mockStateStore),
}));

const mockLocation = { search: "" };

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

const mountView = (): ReturnType<typeof mount> =>
  mount(SignupView, {
    global: {
      stubs: {
        SignupForm: {
          name: "SignupForm",
          template: '<div class="signup-form">Signup Form</div>',
        },
      },
    },
  });

describe("SignupView.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.search = "";
  });

  it("marks the page as the public signup page", () => {
    mountView();

    expect(mockStateStore.$reset).toHaveBeenCalled();
    expect(mockStateStore.page).toBe("signup");
    expect(mockStateStore.publicPage).toBe(true);
  });

  it("renders the signup form", () => {
    expect(mountView().find(".signup-form").exists()).toBe(true);
  });

  it("renders the signup form even when a sign-in provider is in the URL", () => {
    mockLocation.search = "?provider=github";

    const wrapper = mountView();

    expect(wrapper.find(".signup-form").exists()).toBe(true);
    expect(wrapper.html()).not.toContain("social");
  });
});

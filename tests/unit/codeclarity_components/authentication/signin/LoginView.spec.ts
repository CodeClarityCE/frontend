import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginView from "@/codeclarity_components/authentication/signin/LoginView.vue";

// Mock the stores
const mockStateStore = {
  $reset: vi.fn(),
  page: "signup",
  publicPage: true,
};

vi.mock("@/stores/state", () => ({
  useStateStore: vi.fn(() => mockStateStore),
}));

// Don't mock the UserAuthForm component, handle it in the test config

vi.mock("@/base_components/ui/loaders/LoadingComponent.vue", () => ({
  default: {
    name: "LoadingComponent",
    template: '<div class="loading">Loading...</div>',
  },
}));

vi.mock("@/base_components/utilities/ErrorComponent.vue", () => ({
  default: {
    name: "ErrorComponent",
    template: '<div class="error">Error</div>',
  },
}));

// Mock shadcn utilities
describe("LoginView.vue", () => {
  let wrapper: any;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    mockStateStore.$reset.mockClear();

    wrapper = mount(LoginView, {
      global: {
        stubs: {
          RouterLink: {
            name: "RouterLink",
            template: '<a :href="to.name"><slot /></a>',
            props: ["to"],
          },
          UserAuthForm: {
            name: "UserAuthForm",
            template: '<div class="user-auth-form">User Auth Form</div>',
          },
        },
      },
    });
  });

  describe("Component Structure", () => {
    it("renders the component", () => {
      expect(wrapper.exists()).toBe(true);
    });

    it("shows the logo with alternative text", () => {
      expect(wrapper.find('img[alt="CodeClarity"]').exists()).toBe(true);
    });

    it("has proper heading and description", () => {
      expect(wrapper.find("h1").text()).toBe("Sign in to CodeClarity");
      expect(wrapper.text()).toContain(
        "Welcome back. Please enter your credentials.",
      );
    });

    it("includes the UserAuthForm component", () => {
      const authForm = wrapper.find(".user-auth-form");
      expect(authForm.exists()).toBe(true);
      expect(authForm.text()).toBe("User Auth Form");
    });

    it("initializes the state store correctly", () => {
      expect(mockStateStore.$reset).toHaveBeenCalled();
      expect(mockStateStore.page).toBe("signup");
      expect(mockStateStore.publicPage).toBe(true);
    });
  });

  describe("Router Integration", () => {
    it("links to the signup page", () => {
      const signupLink = wrapper.find('a[href="signup"]');
      expect(signupLink.exists()).toBe(true);
      expect(signupLink.text()).toBe("Create an account");
    });

    it("links to the terms and the privacy policy", () => {
      expect(wrapper.find('a[href="terms"]').text()).toBe("Terms of service");
      expect(wrapper.find('a[href="privacy"]').text()).toBe("Privacy policy");
    });
  });
});

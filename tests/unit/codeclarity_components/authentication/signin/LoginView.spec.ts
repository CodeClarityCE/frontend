import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginView from "@/codeclarity_components/authentication/signin/LoginView.vue";

const route = vi.hoisted((): { query: Record<string, string> } => ({
  query: {},
}));

vi.mock("vue-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("vue-router")>()),
  useRoute: () => route,
}));

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

// Mock shadcn utilities
describe("LoginView.vue", () => {
  let wrapper: any;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    mockStateStore.$reset.mockClear();
    route.query = {};
    wrapper = mountLogin();
  });

  function mountLogin() {
    return mount(LoginView, {
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
  }

  describe("Notices", () => {
    it("shows no notice without one in the URL", () => {
      expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    });

    it("confirms a password reset as good news, not an error", () => {
      route.query = { notice: "password_reset" };
      const alert = mountLogin().find('[role="alert"]');

      expect(alert.text()).toContain(
        "Your password was changed. Sign in with your new password.",
      );
      expect(alert.classes()).not.toContain("text-destructive");
    });

    it("shows a problem notice as an error", () => {
      route.query = { notice: "reset_link_invalid" };
      const alert = mountLogin().find('[role="alert"]');

      expect(alert.text()).toContain("This password reset link is incomplete.");
      expect(alert.classes()).toContain("text-destructive");
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

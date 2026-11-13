import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PasswordResetRequestView from "@/codeclarity_components/authentication/password_reset/PasswordResetRequestView.vue";

const mockStateStore = {
  $reset: vi.fn(),
  page: "",
  publicPage: false,
};

vi.mock("@/stores/state", () => ({
  useStateStore: () => mockStateStore,
}));

describe("PasswordResetRequestView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStateStore.page = "";
    mockStateStore.publicPage = false;
  });

  describe("Component Structure", () => {
    it("should handle async component configuration", () => {
      const wrapper = mount(PasswordResetRequestView, {
        global: {
          stubs: ["PasswordResetRequestForm"],
        },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm).toBeDefined();
    });
  });

  describe("State Management", () => {
    it("should reset the state store on component setup", () => {
      mount(PasswordResetRequestView, {
        global: {
          stubs: ["PasswordResetRequestForm"],
        },
      });

      expect(mockStateStore.$reset).toHaveBeenCalledOnce();
    });

    it('should set page to "password-recovery"', () => {
      mount(PasswordResetRequestView, {
        global: {
          stubs: ["PasswordResetRequestForm"],
        },
      });

      expect(mockStateStore.page).toBe("password-recovery");
    });

    it("should set publicPage to true", () => {
      mount(PasswordResetRequestView, {
        global: {
          stubs: ["PasswordResetRequestForm"],
        },
      });

      expect(mockStateStore.publicPage).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should render without errors when all dependencies are available", () => {
      expect(() =>
        mount(PasswordResetRequestView, {
          global: {
            stubs: ["PasswordResetRequestForm"],
          },
        }),
      ).not.toThrow();
    });

    it("should handle store initialization properly", () => {
      const wrapper = mount(PasswordResetRequestView, {
        global: {
          stubs: ["PasswordResetRequestForm"],
        },
      });

      expect(wrapper.vm).toBeDefined();
      expect(mockStateStore.$reset).toHaveBeenCalled();
    });
  });
});

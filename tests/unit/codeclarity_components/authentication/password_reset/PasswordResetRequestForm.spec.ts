import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PasswordResetRequestForm from "@/codeclarity_components/authentication/password_reset/PasswordResetRequestForm.vue";
import { BusinessLogicError } from "@/utils/api/BaseRepository";

const { requestPasswordReset } = vi.hoisted(() => ({
  requestPasswordReset: vi.fn(),
}));

vi.mock("@/codeclarity_components/authentication/auth.repository", () => ({
  AuthRepository: class {
    requestPasswordReset = requestPasswordReset;
  },
}));

vi.mock("@/utils/api/BaseRepository", () => ({
  BusinessLogicError: class extends Error {
    constructor(public error_code: string) {
      super();
    }
  },
  ValidationError: class extends Error {},
}));

const RouterLink = {
  props: ["to"],
  template: '<a :href="to.name"><slot /></a>',
};

async function submitEmail(email: string) {
  const wrapper = mount(PasswordResetRequestForm, {
    global: { stubs: { RouterLink } },
  });
  await wrapper.find('input[placeholder="Enter your email"]').setValue(email);
  await wrapper.find("form").trigger("submit");
  await flushPromises();
  return wrapper;
}

describe("PasswordResetRequestForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestPasswordReset.mockResolvedValue({});
  });

  it("asks for the account email", () => {
    const wrapper = mount(PasswordResetRequestForm, {
      global: { stubs: { RouterLink } },
    });
    expect(wrapper.find("h1").text()).toBe("Reset your password");
    expect(wrapper.find("button[type=submit]").text()).toBe("Send reset link");
    expect(wrapper.find('a[href="login"]').text()).toBe("Back to sign in");
  });

  it("sends the reset request and confirms it", async () => {
    const wrapper = await submitEmail("john.doe@codeclarity.io");
    await vi.waitFor(() =>
      expect(wrapper.find("h1").text()).toBe("Check your email"),
    );
    expect(requestPasswordReset).toHaveBeenCalledWith({
      data: { email: "john.doe@codeclarity.io" },
      handleBusinessErrors: true,
    });
    expect(wrapper.text()).toContain("5 minutes");
    expect(wrapper.find("form").exists()).toBe(false);
  });

  it("does not send an invalid email", async () => {
    const wrapper = await submitEmail("not-an-email");
    await vi.waitFor(() =>
      expect(wrapper.text()).toContain("Please enter a valid email"),
    );
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  it("shows an error when the request fails", async () => {
    requestPasswordReset.mockRejectedValue(
      new BusinessLogicError("InternalError", ""),
    );
    const wrapper = await submitEmail("john.doe@codeclarity.io");
    await vi.waitFor(() =>
      expect(wrapper.find('[role="alert"]').text()).toContain(
        "An error occured during the processing of the request.",
      ),
    );
    expect(wrapper.find("form").exists()).toBe(true);
  });
});

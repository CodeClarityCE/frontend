import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PasswordResetForm from "@/codeclarity_components/authentication/email/PasswordResetForm.vue";
import router from "@/router";
import { BusinessLogicError } from "@/utils/api/BaseRepository";

const { resetPassword } = vi.hoisted(() => ({
  resetPassword: vi.fn(),
}));

vi.mock("@/codeclarity_components/authentication/auth.repository", () => ({
  AuthRepository: class {
    resetPassword = resetPassword;
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

function mountAt(search: string) {
  window.history.replaceState({}, "", `/email_action/reset_password${search}`);
  return mount(PasswordResetForm, { global: { stubs: { RouterLink } } });
}

async function submitPasswords(password: string, confirmation: string) {
  const wrapper = mountAt("?token=t1&userid=u1");
  await flushPromises();
  await wrapper
    .find('input[placeholder="Enter your new password"]')
    .setValue(password);
  await wrapper
    .find('input[placeholder="Confirm your new password"]')
    .setValue(confirmation);
  await wrapper.find("form").trigger("submit");
  return wrapper;
}

describe("PasswordResetForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetPassword.mockResolvedValue({});
  });

  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("asks for the new password twice", () => {
    const wrapper = mountAt("?token=t1&userid=u1");
    expect(wrapper.find("h1").text()).toBe("Choose a new password");
    expect(wrapper.findAll('input[type="password"]')).toHaveLength(2);
    expect(wrapper.find("button[type=submit]").text()).toBe("Update password");
  });

  it("sends the user back to sign in without a token", async () => {
    mountAt("?userid=u1");
    await flushPromises();
    expect(router.push).toHaveBeenCalledWith("/login");
  });

  it("resets the password with the link's token", async () => {
    const wrapper = await submitPasswords("ThisIs4Str0ng", "ThisIs4Str0ng");
    await vi.waitFor(() =>
      expect(wrapper.find("h1").text()).toBe("Password updated"),
    );
    expect(resetPassword).toHaveBeenCalledWith({
      data: {
        new_password: "ThisIs4Str0ng",
        new_password_confirmation: "ThisIs4Str0ng",
        token: "t1",
        user_id_hash: "u1",
      },
      handleBusinessErrors: true,
    });
    expect(wrapper.find('a[href="login"]').text()).toBe("Back to sign in");
  });

  it("does not submit passwords that do not match", async () => {
    const wrapper = await submitPasswords("ThisIs4Str0ng", "SomethingElse1");
    await vi.waitFor(() =>
      expect(wrapper.text()).toContain("Passwords must match"),
    );
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("offers a new reset when the link expired", async () => {
    resetPassword.mockRejectedValue(
      new BusinessLogicError("PasswordResetTokenInvalidOrExpired", ""),
    );
    const wrapper = await submitPasswords("ThisIs4Str0ng", "ThisIs4Str0ng");
    await vi.waitFor(() =>
      expect(wrapper.find("h1").text()).toBe("Reset link expired"),
    );
    expect(wrapper.find('a[href="recoveryRequest"]').text()).toBe(
      "Request a new password reset",
    );
  });
});

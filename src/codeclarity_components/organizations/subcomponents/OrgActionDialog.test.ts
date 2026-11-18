import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

import OrgActionDialog from "./OrgActionDialog.vue";

vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getToken: "test-token" }),
}));

vi.mock("@/utils/toasts", () => ({
  successToast: vi.fn(),
  errorToast: vi.fn(),
}));

vi.mock(
  "@/codeclarity_components/organizations/organization.repository",
  () => ({
    OrgRepository: class {
      delete = vi.fn();
      leave = vi.fn();
    },
  }),
);

let wrapper: VueWrapper | undefined;

async function render(action: "leave" | "delete"): Promise<string> {
  wrapper = mount(OrgActionDialog, {
    props: { action, orgId: "org-1", orgName: "Acme", open: true },
    attachTo: document.body,
  });
  await flushPromises();
  return document.body.textContent ?? "";
}

describe("OrgActionDialog", () => {
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = "";
  });

  it("lists everything an organisation delete removes", async () => {
    const text = await render("delete");

    for (const item of [
      "projects",
      "analyses",
      "tickets",
      "analyzers",
      "invitations",
      "audit log",
    ]) {
      expect(text).toContain(item);
    }
    expect(text).toContain(
      "Integrations and policies also used by another organisation are kept there.",
    );
    expect(text).toContain("Tasks already created in ClickUp are kept.");
    expect(text).toContain("This cannot be undone.");
  });
});

import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

import {
  createTestApp,
  org,
  type TestApp,
} from "../../../../../tests/real-app";

import LicensePolicyForm from "./LicensePolicyForm.vue";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

const policyPath = `/org/${org.id}/policies/license_policy/p-1`;

const policy = {
  id: "p-1",
  name: "No copyleft",
  description: "",
  policy_type: "LICENSE_POLICY",
  default: false,
  created_on: "2025-01-01T00:00:00Z",
  content: ["GPL-3.0"],
};

// Opens the edit page of policy p-1 with its licenses and policy answered.
async function openEdit(): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  app.http.on("GET", "/knowledge/license", {
    data: [{ licenseId: "GPL-3.0", name: "GNU GPL v3" }],
  });
  app.http.on("GET", policyPath, { data: policy });
  app.http.on("PATCH", policyPath, { status_code: 200, status: "success" });
  await app.visit(`/orgs/manage/policies/${org.id}?policyId=p-1`);
  render(LicensePolicyForm, {
    props: { orgId: org.id, mode: "edit" },
    global: app.global,
  });
  return app;
}

describe("LicensePolicyForm in edit mode", () => {
  it("loads the policy into an editable form", async () => {
    await openEdit();

    expect(await screen.findByDisplayValue("No copyleft")).toBeEnabled();
    expect(screen.getByRole("status")).toHaveTextContent("1 license picked");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("saves the changed policy and goes back to the policy list", async () => {
    const app = await openEdit();
    const name = await screen.findByDisplayValue("No copyleft");

    await userEvent.clear(name);
    await userEvent.type(name, "No strong copyleft");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await vi.waitFor(() =>
      expect(app.router.currentRoute.value.query.policyId).toBeUndefined(),
    );
    expect(app.router.currentRoute.value.params).toMatchObject({
      action: "manage",
      page: "policies",
      orgId: org.id,
    });
    const saved = app.http.requests.find((r) => r.method === "PATCH");
    expect(saved?.path).toBe(policyPath);
    expect(saved?.body).toMatchObject({
      name: "No strong copyleft",
      licenses: ["GPL-3.0"],
      default: false,
    });
  });

  it("says when the policy cannot be loaded", async () => {
    const app = createTestApp({ signedIn: true });
    app.http.on("GET", "/knowledge/license", { data: [] });
    await app.visit(`/orgs/manage/policies/${org.id}?policyId=p-1`);
    render(LicensePolicyForm, {
      props: { orgId: org.id, mode: "edit" },
      global: app.global,
    });

    expect(
      await screen.findByText("The license policy could not be loaded."),
    ).toBeInTheDocument();
  });
});

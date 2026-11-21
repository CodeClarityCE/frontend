import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

import {
  createTestApp,
  org,
  type TestApp,
  withToaster,
} from "../../../../../tests/real-app";

import PoliciesList from "./PoliciesList.vue";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

const listPath = `/org/${org.id}/policies/license_policy`;

const sample = [
  {
    id: "p-1",
    name: "No copyleft",
    description: "Blocks GPL licenses",
    policy_type: "LICENSE_POLICY",
    default: true,
    created_by: "Jane",
    created_on: "2025-01-10T10:00:00Z",
    content: ["GPL-3.0", "AGPL-3.0"],
  },
  {
    id: "p-2",
    name: "Strict",
    description: "Also blocks LGPL",
    policy_type: "LICENSE_POLICY",
    default: false,
    created_by: "Bob",
    created_on: "2025-02-10T10:00:00Z",
    content: ["GPL-3.0", "LGPL-3.0"],
  },
];

const page = (data: unknown[]) => ({
  data,
  entry_count: data.length,
  page: 0,
  entries_per_page: 100,
  total_entries: data.length,
  total_pages: 1,
  matching_count: data.length,
  filter_count: {},
  status: "success",
});

async function openList(
  policies: unknown[] | null = sample,
  canManage = true,
): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  if (policies) app.http.on("GET", listPath, page(policies));
  await app.visit(`/orgs/manage/policies/${org.id}`);
  render(
    withToaster(PoliciesList, { page: "policy", orgId: org.id, canManage }),
    {
      global: app.global,
    },
  );
  return app;
}

const totals = (label: string): string =>
  within(screen.getByLabelText("License policy totals"))
    .getAllByRole("listitem")
    .find((li) => li.textContent?.includes(label))?.textContent ?? "";

async function deleteStrict(): Promise<void> {
  await userEvent.click(
    await screen.findByRole("button", { name: "Delete Strict" }),
  );
  expect(await screen.findByText("Delete Strict?")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Delete policy" }));
}

describe("PoliciesList", () => {
  it("lists each license policy", async () => {
    await openList();

    const table = await screen.findByRole("table");
    expect(table).toHaveTextContent("No copyleft");
    expect(table).toHaveTextContent("Default");
    expect(table).toHaveTextContent("Strict");
  });

  it("counts policies and the distinct licenses they cover", async () => {
    await openList();
    await screen.findByRole("table");

    expect(totals("Policies")).toContain("2");
    expect(totals("Licenses covered")).toContain("3");
  });

  it("shows an empty state when there are no policies", async () => {
    await openList([]);

    expect(
      await screen.findByText("No license policies yet"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Create a license policy/ }),
    ).toBeInTheDocument();
  });

  it("says when the policies could not be loaded", async () => {
    await openList(null);

    expect(
      await screen.findByText("The license policies could not be loaded."),
    ).toBeInTheDocument();
  });

  it("offers no Edit or Delete to members who cannot manage policies", async () => {
    await openList(sample, false);
    await screen.findByRole("table");

    expect(
      screen.queryByRole("button", { name: "Edit Strict" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete Strict" }),
    ).not.toBeInTheDocument();
  });

  it("opens the editor for a policy", async () => {
    const app = await openList();

    await userEvent.click(
      await screen.findByRole("button", { name: "Edit Strict" }),
    );

    await vi.waitFor(() =>
      expect(app.router.currentRoute.value.query).toEqual({ policyId: "p-2" }),
    );
    expect(app.router.currentRoute.value.params).toMatchObject({
      action: "edit",
      page: "policy",
    });
  });

  it("deletes a policy after confirmation", async () => {
    const app = await openList();
    app.http.on("DELETE", `${listPath}/p-2`, {
      status_code: 200,
      status: "success",
    });

    await deleteStrict();

    expect(await screen.findByText("Deleted Strict")).toBeInTheDocument();
    expect(screen.getByRole("table")).not.toHaveTextContent("Strict");
    expect(
      app.http.requests.some(
        (r) => r.method === "DELETE" && r.path === `${listPath}/p-2`,
      ),
    ).toBe(true);
  });

  it("keeps a policy that could not be deleted", async () => {
    await openList();

    await deleteStrict();

    expect(
      await screen.findByText("The policy could not be deleted"),
    ).toBeInTheDocument();
    expect(screen.getByRole("table")).toHaveTextContent("Strict");
  });
});

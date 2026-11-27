import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

import { MemberRole } from "@/codeclarity_components/organizations/organization.entity";

import {
  createTestApp,
  org,
  type TestApp,
  withToaster,
} from "../../../../tests/real-app";

import AnalyzersList from "./AnalyzersList.vue";

const listPath = `/org/${org.id}/analyzers`;

const sample = [
  {
    id: "a-1",
    name: "Default analyzer",
    description: "SBOM and vulnerabilities",
    created_on: "2025-01-10T10:00:00Z",
    steps: [[{ name: "js-sbom" }], [{ name: "vuln-finder" }]],
  },
  {
    id: "a-2",
    name: "Licenses only",
    description: "Checks licenses",
    created_on: "2025-02-10T10:00:00Z",
    steps: [[{ name: "license-finder" }]],
  },
];

const page = (data: unknown[]) => ({
  data,
  entry_count: data.length,
  page: 0,
  entries_per_page: 0,
  total_entries: data.length,
  total_pages: 1,
  matching_count: data.length,
  filter_count: {},
  status: "success",
});

// Opens the analyzers page of the signed-in user's org; null leaves the list unanswered.
async function openList(
  analyzers: unknown[] | null = sample,
  role?: MemberRole,
): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  if (analyzers) app.http.on("GET", listPath, page(analyzers));
  if (role !== undefined) {
    app.http.on("GET", `/org/${org.id}`, { data: { ...org, role } });
  }
  await app.visit(`/orgs/manage/analyzers/${org.id}`);
  render(withToaster(AnalyzersList, { orgId: org.id }), {
    global: app.global,
  });
  return app;
}

const row = async (name: string): Promise<HTMLElement> =>
  (await screen.findByText(name)).closest("tr")!;

async function deleteLicensesOnly(): Promise<void> {
  await userEvent.click(
    await screen.findByRole("button", { name: "Delete Licenses only" }),
  );
  expect(await screen.findByText("Delete Licenses only?")).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "Delete analyzer" }),
  );
}

describe("AnalyzersList", () => {
  it("lists each analyzer with its stage count", async () => {
    await openList();

    expect(await row("Default analyzer")).toHaveTextContent("2 stages");
    expect(await row("Licenses only")).toHaveTextContent("1 stage");
  });

  it("marks an analyzer whose component is off on this instance", async () => {
    const off = "Needs CodeQL, which is off on this instance.";
    await openList([
      { ...sample[0], availability: { state: "available" } },
      {
        ...sample[1],
        availability: { state: "off", components: ["CodeQL"], message: off },
      },
    ]);

    expect(await row("Licenses only")).toHaveTextContent(off);
    expect(await row("Default analyzer")).not.toHaveTextContent("Unavailable");
  });

  it("warns that an analyzer's plugin is down, naming it", async () => {
    const down = "vuln-finder is temporarily down. Try again shortly.";
    await openList([
      {
        ...sample[0],
        availability: {
          state: "down",
          plugins: ["vuln-finder"],
          message: down,
        },
      },
    ]);

    expect(await row("Default analyzer")).toHaveTextContent(
      `Temporarily unavailable: ${down}`,
    );
  });

  it("offers a New analyzer link", async () => {
    await openList();

    expect(
      await screen.findByRole("link", { name: /New analyzer/ }),
    ).toBeVisible();
  });

  it("shows an empty state when there are no analyzers", async () => {
    await openList([]);

    expect(await screen.findByText("No analyzers yet")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Create an analyzer/ }),
    ).toBeVisible();
  });

  it("says the analyzers could not be loaded and offers a retry", async () => {
    const app = await openList(null);

    expect(
      await screen.findByText("The analyzers could not be loaded."),
    ).toBeInTheDocument();

    app.http.on("GET", listPath, page(sample));
    await userEvent.click(screen.getByRole("button", { name: /Try again/ }));

    expect(
      within(await screen.findByRole("table")).getByText("Licenses only"),
    ).toBeInTheDocument();
  });

  it("deletes an analyzer after confirmation", async () => {
    const app = await openList();
    app.http.on("DELETE", `${listPath}/a-2`, {
      status_code: 200,
      status: "success",
    });

    await deleteLicensesOnly();

    expect(
      await screen.findByText("Deleted Licenses only"),
    ).toBeInTheDocument();
    expect(
      app.http.requests.some(
        (r) => r.method === "DELETE" && r.path === `${listPath}/a-2`,
      ),
    ).toBe(true);
  });

  it("tells the user when a delete fails", async () => {
    await openList();

    await deleteLicensesOnly();

    expect(
      await screen.findByText("Failed to delete Licenses only"),
    ).toBeInTheDocument();
  });

  it("explains that an analyzer with analyses cannot be deleted", async () => {
    const app = await openList();
    app.http.on(
      "DELETE",
      `${listPath}/a-2`,
      {
        status_code: 400,
        error_code: "AnalyzerHasAnalyses",
        error_message: "",
      },
      400,
    );

    await deleteLicensesOnly();

    expect(
      await screen.findByText(
        "Licenses only has analyses, so it cannot be deleted",
      ),
    ).toBeInTheDocument();
  });

  it("sends members who are not admins back to the overview", async () => {
    const app = await openList(sample, MemberRole.USER);

    await vi.waitFor(() =>
      expect(app.router.currentRoute.value.params).toMatchObject({
        action: "manage",
        page: "main",
        orgId: org.id,
      }),
    );
  });
});

import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import NotYetCheckedProjects from "@/codeclarity_components/vulnerabilities/NotYetCheckedProjects.vue";

import { createTestApp, org } from "../../../real-app";

const daysAgo = (days: number): string =>
  new Date(Date.now() - days * 86_400_000).toISOString();

// Opens the section for CVE-2099-0100 with the given not-yet-checked projects.
async function show(projects: unknown[]): Promise<void> {
  const app = createTestApp({ signedIn: true });
  await app.visit("/projects");
  app.http.on("GET", `/org/${org.id}/vulnerabilities/CVE-2099-0100/freshness`, {
    data: {
      vulnerability_id: "CVE-2099-0100",
      published: "2026-11-08T12:00:00.000Z",
      projects,
    },
  });
  render(NotYetCheckedProjects, {
    props: { vulnerabilityId: "CVE-2099-0100" },
    global: app.global,
  });
  await flushPromises();
}

describe("NotYetCheckedProjects", () => {
  it("marks the projects analysed before the vulnerability was published", async () => {
    await show([
      {
        project_id: "p-old",
        project_name: "old-api",
        analysis_id: "a-old",
        analyzed_on: daysAgo(20),
        stale: true,
      },
    ]);

    const section = screen.getByRole("region", { name: "Not yet checked" });
    expect(
      within(section).getByRole("heading", {
        name: "Not yet checked in 1 project",
      }),
    ).toBeTruthy();
    expect(section.textContent).toContain("Nov 8, 2026");
    const row = within(section).getByRole("listitem");
    expect(row.textContent).toContain("old-api");
    expect(row.textContent).toContain("Analysed 20 days ago");
    expect(
      within(row).getByRole("button", { name: "Re-analyse old-api" }),
    ).toBeTruthy();
  });

  it("shows nothing when every project was analysed since", async () => {
    await show([]);

    expect(
      screen.queryByRole("region", { name: "Not yet checked" }),
    ).toBeNull();
  });
});

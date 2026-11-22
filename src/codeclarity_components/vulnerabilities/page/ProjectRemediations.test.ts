import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import { createTestApp, org, type TestApp } from "../../../../tests/real-app";
import {
  type AffectedProject,
  type Remediation,
  RemediationKind,
} from "../organization_vulnerability.entity";

import ProjectRemediations from "./ProjectRemediations.vue";

const ticketsPath = `/org/${org.id}/projects/project-1/tickets/from-remediation`;

const remediation: Remediation = {
  kind: RemediationKind.ForceVersion,
  workspace: ".",
  package: "qs",
  installed_versions: ["6.5.0"],
  target_version: "6.5.3",
  potentially_breaking: false,
  dev: false,
  package_manager: "npm",
  command: "npm pkg set 'overrides[qs]=6.5.3' && npm install",
  manifest_edit: null,
  instances: [
    {
      instance_id: "i-1",
      vulnerability_id: "CVE-2099-7101",
      analysis_vulnerability_id: "CVE-2099-7101",
      package: "qs",
      installed_version: "6.5.0",
      workspace: ".",
      prod: true,
      severity_class: "CRITICAL",
      severity_score: 9.8,
      known_exploited: false,
      aliases: [],
    },
  ],
};

const project = {
  project_id: "project-1",
  project_name: "api",
  analysis_id: "analysis-1",
  analysis_created_on: "2099-01-01T00:00:00.000Z",
  ref: "main",
  severity_class: "CRITICAL",
  severity_score: 9.8,
  instances: [],
  remediations: [remediation],
} as unknown as AffectedProject;

// Shows the project's remediations, with the ticket answer the API sends first.
async function show(answer: unknown, status = 201): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  await app.visit("/projects");
  app.http.on("POST", ticketsPath, answer, status);
  render(ProjectRemediations, { props: { project }, global: app.global });
  await flushPromises();
  return app;
}

async function click(name: string): Promise<void> {
  await userEvent.click(screen.getByRole("button", { name }));
  await flushPromises();
}

describe("Creating a ticket from a remediation", () => {
  it("creates the ticket in one click and links to it", async () => {
    const app = await show({
      data: { created: true, ticket_id: "ticket-1", duplicate: null },
    });

    await click("Create ticket");

    const sent = app.http.requests.filter((r) => r.path === ticketsPath);
    expect(sent.map((r) => r.body)).toEqual([
      { kind: "force_version", workspace: ".", package: "qs" },
    ]);
    const link = screen.getByRole("link", { name: "View ticket" });
    expect(link.getAttribute("href")).toBe("/tickets/ticket-1");
    expect(screen.getByText("Ticket created")).toBeTruthy();
  });

  it("warns about the open ticket and creates another only when asked", async () => {
    const app = await show({
      data: {
        created: false,
        ticket_id: null,
        duplicate: {
          ticket_id: "ticket-1",
          title: "Force qs to 6.5.3",
          status: "OPEN",
        },
      },
    });

    await click("Create ticket");

    const warning = screen.getByRole("alert");
    expect(warning.textContent).toContain(
      "An open ticket already tracks this remediation: Force qs to 6.5.3",
    );
    expect(
      within(warning)
        .getAllByRole("link")
        .some((a) => a.getAttribute("href") === "/tickets/ticket-1"),
    ).toBe(true);

    app.http.on("POST", ticketsPath, {
      data: { created: true, ticket_id: "ticket-2", duplicate: null },
    });
    await userEvent.click(
      within(warning).getByRole("button", { name: "Create anyway" }),
    );
    await flushPromises();

    expect(app.http.requests.at(-1)?.body).toEqual({
      kind: "force_version",
      workspace: ".",
      package: "qs",
      allow_duplicate: true,
    });
    expect(
      screen.getByRole("link", { name: "View ticket" }).getAttribute("href"),
    ).toBe("/tickets/ticket-2");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("says when the ticket could not be created", async () => {
    await show({ error: "down" }, 500);

    await click("Create ticket");

    expect(screen.getByText(/Could not create the ticket/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create ticket" })).toBeTruthy();
  });
});

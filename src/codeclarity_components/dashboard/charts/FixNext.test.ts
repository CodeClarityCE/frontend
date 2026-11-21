import { type DOMWrapper, flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import { TicketStatus } from "@/codeclarity_components/tickets/tickets.entity";
import type { FixNextEntry } from "@/codeclarity_components/vulnerabilities/fix_next.entity";
import { RemediationKind } from "@/codeclarity_components/vulnerabilities/organization_vulnerability.entity";

import { createTestApp, org } from "../../../../tests/real-app";

import FixNext from "./FixNext.vue";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

const entry = (extra: Partial<FixNextEntry>): FixNextEntry => ({
  kind: RemediationKind.UpgradeDirect,
  package: "lodash",
  target_version: "4.17.21",
  potentially_breaking: false,
  vulnerability_id: "CVE-2099-7501",
  rank: {
    severity_class: "CRITICAL",
    known_exploited: true,
    high_epss: false,
    prod: true,
    instance_count: 1,
  },
  vulnerability_count: 1,
  project_count: 1,
  instance_count: 1,
  remediations: [
    {
      project_id: "p-1",
      project_name: "api",
      workspace: ".",
      command: "npm install lodash@^4.17.21",
      ticket: null,
    },
  ],
  ...extra,
});

// The card on the dashboard, with the entries the API answers.
async function mountFixNext(entries: FixNextEntry[]) {
  const app = createTestApp({ signedIn: true });
  app.http.on("GET", `/org/${org.id}/remediations/fix-next`, { data: entries });
  await app.visit("/");
  const wrapper = mount(FixNext, { global: app.global });
  await flushPromises();
  return wrapper;
}

const chips = (item: DOMWrapper<Element>): string[] =>
  item.findAll("[data-testid='fix-next-reason']").map((c) => c.text());

describe("FixNext", () => {
  it("shows each entry's reasons as chips, in the API's order", async () => {
    const wrapper = await mountFixNext([
      entry({}),
      entry({
        package: "webpack",
        target_version: "5.76.0",
        vulnerability_id: "CVE-2099-7502",
        rank: {
          severity_class: "HIGH",
          known_exploited: false,
          high_epss: true,
          prod: false,
          instance_count: 2,
        },
      }),
      entry({
        package: "debug",
        target_version: "2.6.9",
        rank: {
          severity_class: "MEDIUM",
          known_exploited: false,
          high_epss: false,
          prod: true,
          instance_count: 1,
        },
      }),
    ]);

    const items = wrapper.findAll("[data-testid='fix-next-entry']");
    expect(items.map((i) => i.find("h3").text())).toEqual([
      "Upgrade lodash to 4.17.21",
      "Upgrade webpack to 5.76.0",
      "Upgrade debug to 2.6.9",
    ]);
    expect(items.map(chips)).toEqual([
      ["Critical", "Exploited", "Prod"],
      ["High", "High EPSS", "Dev only"],
      ["Medium", "Prod"],
    ]);
  });

  it("shows how many vulnerabilities and projects an entry resolves", async () => {
    const wrapper = await mountFixNext([
      entry({ vulnerability_count: 3, project_count: 2, instance_count: 4 }),
    ]);
    expect(wrapper.find("[data-testid='fix-next-entry']").text()).toContain(
      "3 vulnerabilities in 2 projects",
    );
  });

  it("links to the vulnerability page, or to the ticket when there is one", async () => {
    const wrapper = await mountFixNext([
      entry({}),
      entry({
        package: "axios",
        target_version: "0.21.2",
        remediations: [
          {
            project_id: "p-1",
            project_name: "api",
            workspace: ".",
            command: null,
            ticket: { id: "t-1", status: TicketStatus.IN_PROGRESS },
          },
        ],
      }),
    ]);
    const [first, second] = wrapper.findAll("[data-testid='fix-next-entry']");
    expect(first!.find("h3 a").attributes("href")).toBe(
      "/org/org-123/vulnerabilities/CVE-2099-7501",
    );
    expect(first!.find("[data-testid='fix-next-ticket']").text()).toBe(
      "No ticket",
    );
    const ticket = second!.find("[data-testid='fix-next-ticket']");
    expect(ticket.text()).toBe("In Progress");
    expect(ticket.attributes("href")).toBe("/tickets/t-1");
  });

  it("counts tickets when only some of the entry's projects have one", async () => {
    const remediation = entry({}).remediations[0]!;
    const wrapper = await mountFixNext([
      entry({
        project_count: 2,
        remediations: [
          {
            ...remediation,
            ticket: { id: "t-1", status: TicketStatus.OPEN },
          },
          { ...remediation, project_id: "p-2", project_name: "web" },
        ],
      }),
    ]);
    expect(wrapper.find("[data-testid='fix-next-ticket']").text()).toBe(
      "1 of 2 ticketed",
    );
  });

  it("says when there is nothing to fix", async () => {
    const wrapper = await mountFixNext([]);
    expect(wrapper.text()).toContain("Nothing to fix");
  });
});

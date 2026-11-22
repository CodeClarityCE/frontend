import { type DOMWrapper, flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import type { MyWorkEntry } from "@/codeclarity_components/tickets/my_work.entity";
import {
  TicketPriority,
  TicketStatus,
} from "@/codeclarity_components/tickets/tickets.entity";
import { RemediationKind } from "@/codeclarity_components/vulnerabilities/organization_vulnerability.entity";

import { createTestApp, org } from "../../../../tests/real-app";

import MyWork from "./MyWork.vue";

const entry = (extra: Partial<MyWorkEntry>): MyWorkEntry => ({
  ticket_id: "t-1",
  title: "Upgrade lodash to 4.17.21",
  status: TicketStatus.OPEN,
  priority: TicketPriority.CRITICAL,
  project_id: "p-1",
  project_name: "api",
  due_date: "2026-11-10T12:00:00.000Z",
  deadline: "overdue",
  remediation: {
    kind: RemediationKind.UpgradeDirect,
    workspace: ".",
    package: "lodash",
    target_version: "4.17.21",
  },
  vulnerability_id: null,
  affected_package: "lodash",
  rank: {
    severity_class: "CRITICAL",
    known_exploited: true,
    high_epss: false,
    prod: true,
    instance_count: 2,
  },
  ...extra,
});

// The card on the dashboard, with the entries the API answers.
async function mountMyWork(entries: MyWorkEntry[]) {
  const app = createTestApp({ signedIn: true });
  app.http.on("GET", `/org/${org.id}/tickets/my-work`, { data: entries });
  await app.visit("/");
  const wrapper = mount(MyWork, { global: app.global });
  await flushPromises();
  return wrapper;
}

const chips = (item: DOMWrapper<Element>): string[] =>
  item.findAll("[data-testid='fix-next-reason']").map((c) => c.text());

describe("MyWork", () => {
  it("shows each ticket's remediation, due date and reason chips in the API's order", async () => {
    const wrapper = await mountMyWork([
      entry({}),
      entry({
        ticket_id: "t-2",
        title: "Force qs to 6.5.3 in packages/web",
        due_date: "2026-11-24T12:00:00.000Z",
        deadline: "due_soon",
        remediation: {
          kind: RemediationKind.ForceVersion,
          workspace: "packages/web",
          package: "qs",
          target_version: "6.5.3",
        },
        project_name: "web",
        rank: {
          severity_class: "HIGH",
          known_exploited: false,
          high_epss: true,
          prod: false,
          instance_count: 1,
        },
      }),
      entry({
        ticket_id: "t-3",
        due_date: null,
        deadline: "none",
        rank: {
          severity_class: "MEDIUM",
          known_exploited: false,
          high_epss: false,
          prod: true,
          instance_count: 1,
        },
      }),
    ]);

    const items = wrapper.findAll("[data-testid='my-work-entry']");
    expect(items.map((i) => i.find("h3").text())).toEqual([
      "Upgrade lodash to 4.17.21",
      "Force qs to 6.5.3 in packages/web",
      "Upgrade lodash to 4.17.21",
    ]);
    expect(
      items.map((i) => i.find("[data-testid='my-work-due']").text()),
    ).toEqual([
      expect.stringContaining("Overdue"),
      expect.stringContaining("Due soon"),
      "No due date",
    ]);
    expect(items[0]!.find("time").attributes("datetime")).toBe(
      "2026-11-10T12:00:00.000Z",
    );
    expect(chips(items[0]!)).toEqual(["Critical", "Exploited", "Prod"]);
    expect(chips(items[1]!)).toEqual(["High", "High EPSS", "Dev only"]);
    expect(items[1]!.text()).toContain("web");

    const link = items[1]!.find("h3 a");
    expect(link.attributes("href")).toBe("/tickets/t-2");
  });

  it("shows an old one-vulnerability ticket by its title and vulnerability", async () => {
    const wrapper = await mountMyWork([
      entry({
        ticket_id: "t-9",
        title: "Fix CVE-2099-7705 in axios",
        remediation: null,
        vulnerability_id: "CVE-2099-7705",
        affected_package: "axios",
        deadline: "none",
        due_date: null,
        rank: {
          severity_class: "LOW",
          known_exploited: false,
          high_epss: false,
          prod: false,
          instance_count: 0,
        },
      }),
    ]);

    const item = wrapper.find("[data-testid='my-work-entry']");
    expect(item.find("h3").text()).toBe("Fix CVE-2099-7705 in axios");
    expect(
      item.find("a[data-testid='my-work-vulnerability']").attributes("href"),
    ).toBe("/org/org-123/vulnerabilities/CVE-2099-7705");
    expect(item.text()).toContain("axios");
    // Nothing tracked in the current analysis: no prod or dev only chip.
    expect(chips(item)).toEqual(["Low"]);
  });

  it("says so when nothing is assigned", async () => {
    const wrapper = await mountMyWork([]);
    expect(wrapper.findAll("[data-testid='my-work-entry']")).toHaveLength(0);
    expect(wrapper.text()).toContain("Nothing is assigned to you");
  });
});

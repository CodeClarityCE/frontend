import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";

import type { CreateRemediationTicketResult } from "@/codeclarity_components/tickets/tickets.entity";

import {
  type AffectedProject,
  type Remediation,
  RemediationKind,
} from "../organization_vulnerability.entity";

import ProjectRemediations from "./ProjectRemediations.vue";

const createRemediationTicket =
  vi.fn<
    (options: object) => Promise<{ data: CreateRemediationTicketResult }>
  >();

vi.mock("@/codeclarity_components/tickets/tickets.repository", () => ({
  TicketsRepository: class {
    createRemediationTicket = createRemediationTicket;
  },
}));
vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ getDefaultOrg: { id: "org-1" } }),
}));
vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getToken: "token" }),
}));

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

async function mountRemediations() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: { template: "<div />" } },
      { path: "/tickets", name: "tickets", component: { template: "<div />" } },
      {
        path: "/tickets/:ticketId",
        name: "ticket",
        component: { template: "<div />" },
      },
    ],
  });
  await router.push("/");
  const wrapper = mount(ProjectRemediations, {
    props: { project },
    global: { plugins: [router], stubs: { RouterLink: false } },
  });
  await flushPromises();
  return wrapper;
}

const createButton = (wrapper: Awaited<ReturnType<typeof mountRemediations>>) =>
  wrapper.findAll("button").find((b) => b.text() === "Create ticket")!;

describe("Creating a ticket from a remediation", () => {
  beforeEach(() => {
    createRemediationTicket.mockReset();
  });

  it("creates the ticket in one click and links to it", async () => {
    createRemediationTicket.mockResolvedValueOnce({
      data: { created: true, ticket_id: "ticket-1", duplicate: null },
    });
    const wrapper = await mountRemediations();

    await createButton(wrapper).trigger("click");
    await flushPromises();

    expect(createRemediationTicket).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "org-1",
        projectId: "project-1",
        bearerToken: "token",
        data: { kind: "force_version", workspace: ".", package: "qs" },
      }),
    );
    const link = wrapper.find('a[href="/tickets/ticket-1"]');
    expect(link.text()).toBe("View ticket");
    expect(wrapper.text()).toContain("Ticket created");
  });

  it("warns about the open ticket and creates another only when asked", async () => {
    createRemediationTicket
      .mockResolvedValueOnce({
        data: {
          created: false,
          ticket_id: null,
          duplicate: {
            ticket_id: "ticket-1",
            title: "Force qs to 6.5.3",
            status: "OPEN" as never,
          },
        },
      })
      .mockResolvedValueOnce({
        data: { created: true, ticket_id: "ticket-2", duplicate: null },
      });
    const wrapper = await mountRemediations();

    await createButton(wrapper).trigger("click");
    await flushPromises();

    const warning = wrapper.find('[role="alert"]');
    expect(warning.text()).toContain(
      "An open ticket already tracks this remediation: Force qs to 6.5.3",
    );
    expect(warning.find('a[href="/tickets/ticket-1"]').exists()).toBe(true);

    const anyway = warning
      .findAll("button")
      .find((b) => b.text() === "Create anyway")!;
    await anyway.trigger("click");
    await flushPromises();

    expect(createRemediationTicket).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: {
          kind: "force_version",
          workspace: ".",
          package: "qs",
          allow_duplicate: true,
        },
      }),
    );
    expect(wrapper.find('a[href="/tickets/ticket-2"]').exists()).toBe(true);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it("says when the ticket could not be created", async () => {
    createRemediationTicket.mockRejectedValueOnce(new Error("offline"));
    const wrapper = await mountRemediations();

    await createButton(wrapper).trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Could not create the ticket");
    expect(createButton(wrapper).exists()).toBe(true);
  });
});

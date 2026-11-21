import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import { RemediationKind } from "@/codeclarity_components/vulnerabilities/organization_vulnerability.entity";

import type { TicketInstance, TicketRemediation } from "../tickets.entity";

import TicketRemediationView from "./TicketRemediation.vue";

const remediation: TicketRemediation = {
  kind: RemediationKind.ForceVersion,
  workspace: "packages/web",
  package: "qs",
  installed_versions: ["6.5.0"],
  target_version: "6.5.3",
  potentially_breaking: true,
  package_manager: "npm",
  command: "npm pkg set 'overrides[qs]=6.5.3' && npm install",
  manifest_edit: null,
};

const instance = (extra: Partial<TicketInstance>): TicketInstance => ({
  id: "o-1",
  analysis_id: "a-1",
  vulnerability_id: "CVE-2099-7101",
  analysis_vulnerability_id: "CVE-2099-7101",
  package: "qs",
  ecosystem: "npm",
  installed_version: "6.5.0",
  workspace: "packages/web",
  prod: true,
  severity_class: "CRITICAL",
  severity_score: 9.8,
  fixed_version: "6.5.3",
  top_level_dependencies: [
    {
      name: "express",
      version: "4.17.0",
      dev: false,
      path: [
        { name: "express", version: "4.17.0" },
        { name: "qs", version: "6.5.0" },
      ],
    },
  ],
  is_active: true,
  detected_on: "2099-01-01T00:00:00.000Z",
  resolved_on: null,
  diff_links: { fix_commits: [], compare: null, registry_diff: null },
  ...extra,
});

describe("The remediation on the ticket page", () => {
  const mountWith = (instances: TicketInstance[]) =>
    mount(TicketRemediationView, { props: { remediation, instances } });

  it("shows the change, the command and what it resolves with paths", () => {
    const wrapper = mountWith([
      instance({}),
      instance({
        id: "o-2",
        vulnerability_id: "CVE-2099-7102",
        severity_class: "MEDIUM",
        severity_score: 5.3,
        fixed_version: null,
        top_level_dependencies: [],
      }),
    ]);

    const text = wrapper.text().replace(/\s+/g, " ");
    expect(text).toContain("Force qs 6.5.0 to 6.5.3");
    expect(text).toContain("in packages/web");
    expect(text).toContain("Potentially breaking");
    expect(
      wrapper.find('button[aria-label="Copy remediation command"]').exists(),
    ).toBe(true);
    expect(wrapper.find("code").text()).toBe(remediation.command);

    const rows = wrapper.findAll(
      '[aria-label="Resolved vulnerabilities"] tbody tr',
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]!.text()).toContain("CVE-2099-7101");
    expect(rows[0]!.text()).toContain("6.5.0");
    expect(rows[0]!.text()).toContain("6.5.3");
    expect(rows[0]!.text()).toContain("express@4.17.0 > qs@6.5.0");
    expect(rows[1]!.text()).toContain("No fix");
  });

  it("marks instances the project no longer has as resolved", () => {
    const wrapper = mountWith([
      instance({ is_active: false, resolved_on: "2099-01-02T00:00:00.000Z" }),
    ]);

    expect(
      wrapper.find('[aria-label="Resolved vulnerabilities"] tbody tr').text(),
    ).toContain("Resolved");
  });

  it("shows the manifest edit when the command needs one", () => {
    const wrapper = mount(TicketRemediationView, {
      props: {
        remediation: {
          ...remediation,
          package_manager: "pnpm",
          command: "pnpm install",
          manifest_edit: {
            file: "pnpm-workspace.yaml",
            text: 'overrides:\n  "qs": "6.5.3"\n',
          },
        },
        instances: [instance({})],
      },
    });

    expect(wrapper.text()).toContain("pnpm-workspace.yaml");
    expect(wrapper.find("pre").text()).toBe('overrides:\n  "qs": "6.5.3"');
  });

  it("links the fix commit, compare view and registry diff of each vulnerability", () => {
    const wrapper = mountWith([
      instance({
        diff_links: {
          fix_commits: [
            {
              url: "https://github.com/ljharb/qs/commit/8b4cc14cda94a5c8",
              sha: "8b4cc14cda94a5c8",
            },
          ],
          compare: {
            url: "https://github.com/ljharb/qs/compare/v6.5.0...v6.5.3",
            host: "github",
            repository: "https://github.com/ljharb/qs",
            from_tag: "v6.5.0",
            to_tag: "v6.5.3",
            guessed: true,
          },
          registry_diff: {
            tool: "npm",
            command: "npm diff --diff=qs@6.5.0 --diff=qs@6.5.3",
          },
        },
      }),
      instance({ id: "o-2", vulnerability_id: "CVE-2099-7102" }),
    ]);

    const changes = wrapper.findAll(
      '[aria-label="Changes to the fixed versions"] > li',
    );
    expect(changes).toHaveLength(1);
    expect(changes[0]!.text()).toContain("CVE-2099-7101");
    const hrefs = changes[0]!.findAll("a").map((a) => a.attributes("href"));
    expect(hrefs).toEqual([
      "https://github.com/ljharb/qs/commit/8b4cc14cda94a5c8",
      "https://github.com/ljharb/qs/compare/v6.5.0...v6.5.3",
    ]);
    expect(
      changes[0]!
        .find('button[aria-label="Copy registry diff command"]')
        .exists(),
    ).toBe(true);
  });
});

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import {
  type InstanceDiffLinks,
  RemediationKind,
} from "@/codeclarity_components/vulnerabilities/organization_vulnerability.entity";

import { createTestApp } from "../../../../tests/real-app";
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

const links: InstanceDiffLinks = {
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
};

describe("The remediation on the ticket page", () => {
  const mountWith = (
    instances: TicketInstance[],
    extra: Partial<TicketRemediation> = {},
  ) =>
    mount(TicketRemediationView, {
      props: {
        remediation: { ...remediation, ...extra },
        instances,
        orgId: "org-1",
      },
      global: createTestApp().global,
    });

  const text = (wrapper: ReturnType<typeof mountWith>): string =>
    wrapper.text().replace(/\s+/g, " ");

  const vulnerabilityItems = (wrapper: ReturnType<typeof mountWith>) =>
    wrapper.findAll('[aria-label="Resolved vulnerabilities"] > li');

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

    expect(text(wrapper)).toContain("Force qs to 6.5.3 in packages/web");
    expect(text(wrapper)).toContain("Installed: 6.5.0");
    expect(text(wrapper)).toContain("Potentially breaking");
    expect(text(wrapper)).toContain("Resolves 2 vulnerabilities");
    expect(
      wrapper.find('button[aria-label="Copy remediation command"]').exists(),
    ).toBe(true);
    expect(wrapper.find("code").text()).toBe(remediation.command);

    const items = vulnerabilityItems(wrapper);
    expect(items).toHaveLength(2);
    expect(items[0]!.text()).toContain("CVE-2099-7101");
    expect(items[0]!.find("a").attributes("href")).toBe(
      "/org/org-1/vulnerabilities/CVE-2099-7101",
    );
    expect(items[0]!.text()).toContain("6.5.0");
    expect(items[0]!.text()).toContain("6.5.3");
    expect(items[0]!.find("details").text()).toContain(
      "express@4.17.0 > qs@6.5.0",
    );
    expect(items[1]!.text()).toContain("no fix");
  });

  it("does not repeat the change when the page title says it", () => {
    const wrapper = mount(TicketRemediationView, {
      props: {
        remediation,
        instances: [instance({})],
        orgId: "org-1",
        ticketTitle: "Force qs to 6.5.3 in packages/web",
      },
      global: createTestApp().global,
    });

    expect(text(wrapper)).not.toContain("Force qs to 6.5.3");
  });

  it("groups the installed versions of one vulnerability, worst first", () => {
    const wrapper = mountWith([
      instance({ id: "o-1", severity_class: "MEDIUM", severity_score: 5.3 }),
      instance({
        id: "o-2",
        vulnerability_id: "CVE-2099-7105",
        severity_score: 9.1,
      }),
      instance({
        id: "o-3",
        installed_version: "6.4.0",
        severity_class: "MEDIUM",
        severity_score: 5.3,
      }),
    ]);

    const items = vulnerabilityItems(wrapper);
    expect(items.map((item) => item.find("a").text())).toEqual([
      "CVE-2099-7105",
      "CVE-2099-7101",
    ]);
    expect(
      items[1]!.findAll('[aria-label="Installed versions"] > li'),
    ).toHaveLength(2);
  });

  it("marks instances the project no longer has as resolved", () => {
    const wrapper = mountWith([
      instance({ is_active: false, resolved_on: "2099-01-02T00:00:00.000Z" }),
    ]);

    expect(vulnerabilityItems(wrapper)[0]!.text()).toContain("Resolved");
  });

  it("shows the manifest edit when the command needs one", () => {
    const wrapper = mountWith([instance({})], {
      package_manager: "pnpm",
      command: "pnpm install",
      manifest_edit: {
        file: "pnpm-workspace.yaml",
        text: 'overrides:\n  "qs": "6.5.3"\n',
      },
    });

    expect(wrapper.text()).toContain("pnpm-workspace.yaml");
    expect(wrapper.find("pre").text()).toBe('overrides:\n  "qs": "6.5.3"');
  });

  it("links the fix commit, compare view and registry diff of each version", () => {
    const wrapper = mountWith([
      instance({ diff_links: links }),
      instance({ id: "o-2", vulnerability_id: "CVE-2099-7102" }),
    ]);

    const [withLinks, without] = vulnerabilityItems(wrapper);
    const hrefs = withLinks!
      .findAll("a[target]")
      .map((a) => a.attributes("href"));
    expect(hrefs).toEqual([
      "https://github.com/ljharb/qs/commit/8b4cc14cda94a5c8",
      "https://github.com/ljharb/qs/compare/v6.5.0...v6.5.3",
    ]);
    expect(
      withLinks!
        .find('button[aria-label="Copy registry diff command"]')
        .exists(),
    ).toBe(true);
    expect(without!.findAll("a[target]")).toHaveLength(0);
  });

  // Every fact the external issue body (the API's remediationMarkdown) writes is on the page.
  it("shows everything the external issue says", () => {
    const instances = [
      instance({ diff_links: links }),
      instance({
        id: "o-2",
        vulnerability_id: "GHSA-aaaa-bbbb-cccc",
        severity_class: "MEDIUM",
        severity_score: 5.3,
        installed_version: "6.4.0",
        fixed_version: null,
        is_active: false,
        top_level_dependencies: [
          {
            name: "body-parser",
            version: "1.18.0",
            dev: true,
            path: [
              { name: "body-parser", version: "1.18.0" },
              { name: "qs", version: "6.4.0" },
            ],
          },
        ],
      }),
    ];
    const extra = {
      installed_versions: ["6.4.0", "6.5.0"],
      manifest_edit: { file: "package.json", text: '"overrides": {}' },
    };
    const wrapper = mountWith(instances, extra);
    const shown = text(wrapper);
    const hrefs = wrapper.findAll("a").map((a) => a.attributes("href"));

    const facts = [
      "Force qs to 6.5.3 in packages/web",
      `Installed: ${extra.installed_versions.join(", ")}`,
      "it leaves the current major",
      extra.manifest_edit.file,
      extra.manifest_edit.text,
      remediation.command!,
    ];
    for (const one of instances) {
      facts.push(
        one.vulnerability_id,
        one.severity_class.charAt(0) +
          one.severity_class.slice(1).toLowerCase(),
        one.severity_score!.toFixed(1),
        `${one.package} ${one.installed_version}`,
        ...one.top_level_dependencies.map((top) =>
          top.path.map((p) => `${p.name}@${p.version}`).join(" > "),
        ),
      );
      if (one.fixed_version) facts.push(one.fixed_version);
      if (!one.is_active) facts.push("Resolved");
      if (one.diff_links.registry_diff) {
        facts.push(one.diff_links.registry_diff.command);
      }
    }
    for (const fact of facts) expect(shown).toContain(fact);

    for (const url of [
      ...links.fix_commits.map((c) => c.url),
      links.compare!.url,
    ]) {
      expect(hrefs).toContain(url);
    }
  });
});

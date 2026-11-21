// Captures real API responses for the fixture contract check.
// Run against a dev stack with a seeded user, from the frontend directory:
//   node e2e/contracts/capture.mts
// Env: CONTRACT_API (default http://localhost:3000), CONTRACT_EMAIL,
// CONTRACT_PASSWORD, CONTRACT_ORG (id of a team org with a license policy).
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const api = process.env.CONTRACT_API ?? "http://localhost:3000";
const email = process.env.CONTRACT_EMAIL ?? "john.doe@codeclarity.io";
const password = process.env.CONTRACT_PASSWORD ?? "ThisIs4Str0ngP4ssW0rd?";
const dir = dirname(fileURLToPath(import.meta.url));

async function call(path: string, token?: string): Promise<unknown> {
  const response = await fetch(`${api}${path}`, {
    method: token ? "GET" : "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: token ? undefined : JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

interface List {
  data: {
    id: string;
    organization?: { id: string };
    analyses?: { id: string; status: string }[];
  }[];
}

const auth = (await call("/auth/authenticate")) as { data: { token: string } };
const token = auth.data.token;

const orgs = (await call("/org?page=0&entries_per_page=50", token)) as List;
const orgIds = process.env.CONTRACT_ORG
  ? [process.env.CONTRACT_ORG]
  : orgs.data.map((m) => m.organization!.id);

// Picks the first organisation that has a license policy to read back.
let org: string | undefined;
let policy: string | undefined;
for (const id of orgIds) {
  const policies = (await call(
    `/org/${id}/policies/license_policy?page=0&entries_per_page=1`,
    token,
  )) as List;
  const [first] = policies.data;
  if (first) {
    org = id;
    policy = first.id;
    break;
  }
}
if (!org || !policy) {
  throw new Error("No organisation has a license policy: create one first.");
}

// Picks the first organisation that has a ticket to read back.
interface TicketList {
  data: { id: string; project_id: string }[];
}
let ticketPaths: Record<string, [string, string]> = {};
for (const id of orgIds) {
  const tickets = (await call(
    `/org/${id}/tickets?page=0&entries_per_page=1`,
    token,
  )) as TicketList;
  const first = tickets.data[0];
  if (first) {
    ticketPaths = {
      "ticket-detail": [
        "GET /org/:org/tickets/:ticket",
        `/org/${id}/tickets/${first.id}`,
      ],
      "project-tickets": [
        "GET /org/:org/projects/:project/tickets",
        `/org/${id}/projects/${first.project_id}/tickets?page=0&entries_per_page=100`,
      ],
    };
    break;
  }
}
if (Object.keys(ticketPaths).length === 0) {
  throw new Error("No organisation has a ticket: create one first.");
}

// Picks an analysis to read back, preferring a failed one.
let failedPath: string | undefined;
let anyPath: string | undefined;
for (const id of orgIds) {
  const projects = (await call(
    `/org/${id}/projects?page=0&entries_per_page=50`,
    token,
  )) as List;
  for (const project of projects.data) {
    for (const analysis of project.analyses ?? []) {
      const path = `/org/${id}/projects/${project.id}/analyses/${analysis.id}`;
      anyPath ??= path;
      if (analysis.status === "failure") failedPath ??= path;
    }
  }
}
const analysisPath = failedPath ?? anyPath;
if (!analysisPath) {
  throw new Error("No project has an analysis: run one first.");
}

// Picks an organisation vulnerability whose page has a ticket, a weakness and
// a remediation, so their shapes are captured too.
interface VulnerabilityPage {
  data: {
    details: { weaknesses: unknown[] };
    projects: {
      instances: { ticket: unknown }[];
      remediations: unknown[];
    }[];
  };
}
let vulnerabilityPath: string | undefined;
for (const id of orgIds) {
  const list = (await call(
    `/org/${id}/vulnerabilities?page=0&entries_per_page=50`,
    token,
  )) as { data: { vulnerability_id: string }[] };
  for (const { vulnerability_id } of list.data) {
    const path = `/org/${id}/vulnerabilities/${encodeURIComponent(vulnerability_id)}`;
    const { data } = (await call(path, token)) as VulnerabilityPage;
    const rich =
      data.details.weaknesses.length > 0 &&
      data.projects.some(
        (p) => p.remediations.length > 0 && p.instances.some((i) => i.ticket),
      );
    if (rich) {
      vulnerabilityPath = path;
      break;
    }
  }
  if (vulnerabilityPath) break;
}
if (!vulnerabilityPath) {
  throw new Error(
    "No vulnerability has a ticket and a remediation: open a ticket first.",
  );
}

// Replaces project names, which can name private repositories, with a placeholder.
function redactProjectNames(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactProjectNames);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [
        key,
        key === "project_name" && typeof v === "string"
          ? "example/project"
          : redactProjectNames(v),
      ]),
    );
  }
  return value;
}

const captures: Record<string, [string, string]> = {
  ...ticketPaths,
  "org-vulnerability": [
    "GET /org/:org/vulnerabilities/:vulnerability",
    vulnerabilityPath,
  ],
  "org-vulnerability-freshness": [
    "GET /org/:org/vulnerabilities/:vulnerability/freshness",
    `${vulnerabilityPath}/freshness`,
  ],
  "auth-user": ["GET /auth/user", "/auth/user"],
  "organization-list": ["GET /org", "/org?page=0&entries_per_page=50"],
  members: [
    "GET /org/:org/members",
    `/org/${org}/members?page=0&entries_per_page=50`,
  ],
  "license-policy": [
    "GET /org/:org/policies/license_policy/:policy",
    `/org/${org}/policies/license_policy/${policy}`,
  ],
  "license-policy-list": [
    "GET /org/:org/policies/license_policy",
    `/org/${org}/policies/license_policy?page=0&entries_per_page=100`,
  ],
  analysis: [
    "GET /org/:org/projects/:project/analyses/:analysis",
    analysisPath,
  ],
};

for (const [name, [endpoint, path]] of Object.entries(captures)) {
  const response = redactProjectNames(await call(path, token));
  const file = join(dir, `${name}.json`);
  writeFileSync(file, `${JSON.stringify({ endpoint, response }, null, 2)}\n`);
  process.stdout.write(`wrote ${file}\n`);
}

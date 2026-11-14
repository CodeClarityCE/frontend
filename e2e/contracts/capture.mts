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

type List = { data: { id: string; organization?: { id: string } }[] };

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
  if (policies.data.length > 0) {
    org = id;
    policy = policies.data[0].id;
    break;
  }
}
if (!org || !policy) {
  throw new Error("No organisation has a license policy: create one first.");
}

// Picks the first organisation that has a ticket to read back.
type TicketList = { data: { id: string; project_id: string }[] };
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

const captures: Record<string, [string, string]> = {
  ...ticketPaths,
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
};

for (const [name, [endpoint, path]] of Object.entries(captures)) {
  const response = await call(path, token);
  const file = join(dir, `${name}.json`);
  writeFileSync(file, `${JSON.stringify({ endpoint, response }, null, 2)}\n`);
  process.stdout.write(`wrote ${file}\n`);
}

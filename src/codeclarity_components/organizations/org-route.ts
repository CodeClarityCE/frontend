// Which organisation page a /orgs/:action/:page/:orgId URL opens.
export type OrgView =
  | "create"
  | "list"
  | "overview"
  | "members"
  | "invites"
  | "logs"
  | "tokens"
  | "integrations"
  | "analyzers"
  | "policies"
  | "notFound";

// Pages that only list or show, opened with the "manage" action.
const managePages: Record<string, OrgView> = {
  main: "overview",
  members: "members",
  invites: "invites",
  logs: "logs",
  tokens: "tokens",
};

// The invites page opens its invite dialog with the "add" action.
const addPages: Record<string, OrgView> = { invites: "invites" };

// Pages that also have add and edit forms.
const formPages: Record<string, OrgView> = {
  integrations: "integrations",
  analyzers: "analyzers",
  policies: "policies",
  policy: "policies",
  "vulnerability-policy": "policies",
};

export function orgView(params: {
  action?: string;
  page?: string;
  orgId?: string;
}): OrgView {
  const { action, page, orgId } = params;
  if (!page && !orgId) {
    if (action === "add") return "create";
    if (action === "list") return "list";
    return "notFound";
  }
  if (!page || !orgId) return "notFound";
  if (action === "manage" && page in managePages) return managePages[page]!;
  if (action === "add" && page in addPages) return addPages[page]!;
  if (
    (action === "manage" || action === "add" || action === "edit") &&
    page in formPages
  )
    return formPages[page]!;
  return "notFound";
}

// Each page's name, matching its heading.
const viewTitles: Record<OrgView, string> = {
  create: "New organisation",
  list: "Organisations",
  overview: "Organisation overview",
  members: "Members",
  invites: "Invitations",
  logs: "Audit logs",
  tokens: "Organization tokens",
  integrations: "Integrations",
  analyzers: "Analyzers",
  policies: "Policies",
  notFound: "Organisation not found",
};

// The name of the page a /orgs URL opens; analyzer and policy forms say "New" or "Edit".
export function orgTitle(params: {
  action?: string;
  page?: string;
  orgId?: string;
}): string {
  const view = orgView(params);
  const { action, page } = params;
  if (action === "manage") return viewTitles[view];
  const verb = action === "edit" ? "Edit" : "New";
  if (view === "analyzers") return `${verb} analyzer`;
  if (view === "policies") {
    const kind = page?.includes("vulnerability") ? "vulnerability" : "license";
    return `${verb} ${kind} policy`;
  }
  return viewTitles[view];
}

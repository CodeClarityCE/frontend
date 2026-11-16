// Which organisation page a /orgs/:action/:page/:orgId URL opens.
export type OrgView =
  | "create"
  | "list"
  | "overview"
  | "members"
  | "invites"
  | "logs"
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

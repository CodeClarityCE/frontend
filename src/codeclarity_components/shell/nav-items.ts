import {
  Building2,
  Database,
  FlaskConical,
  FolderGit2,
  LayoutDashboard,
  type LucideIcon,
  ShieldCheck,
  Ticket,
} from "@lucide/vue";
import type { RouteLocationRaw } from "vue-router";

import {
  MemberRole,
  type Organization,
} from "@/codeclarity_components/organizations/organization.entity";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  /** Route names that mark this item as the current page. */
  routes: string[];
  /** Where the item goes; null when it needs context the user has not opened yet. */
  to: (orgId: string | undefined) => RouteLocationRaw | null;
}

export interface NavGroup {
  label: string | null;
  items: NavItem[];
}

export const dashboardItem: NavItem = {
  label: "Dashboard",
  icon: LayoutDashboard,
  routes: ["home"],
  to: () => ({ name: "home" }),
};

export const navGroups: NavGroup[] = [
  { label: null, items: [dashboardItem] },
  {
    label: "Research",
    items: [
      {
        label: "Datasets",
        icon: Database,
        routes: ["datasets"],
        to: () => ({ name: "datasets" }),
      },
      {
        label: "Experiments",
        icon: FlaskConical,
        routes: ["experiments"],
        to: () => ({ name: "experiments" }),
      },
    ],
  },
  {
    label: "Projects",
    items: [
      {
        label: "Projects",
        icon: FolderGit2,
        routes: ["projects", "analyses"],
        to: () => ({ name: "projects" }),
      },
      {
        label: "Results",
        icon: ShieldCheck,
        routes: ["results"],
        // Results always belong to one analysis, so the sidebar links to the last one opened.
        to: () => null,
      },
      {
        label: "Tickets",
        icon: Ticket,
        routes: ["tickets", "clickupOAuthCallback"],
        to: () => ({ name: "tickets" }),
      },
    ],
  },
];

export const orgSettingsItem: NavItem = {
  label: "Organisation settings",
  icon: Building2,
  routes: ["orgs"],
  to: (orgId) =>
    orgId
      ? { name: "orgs", params: { action: "manage", page: "main", orgId } }
      : { name: "orgs", params: { action: "list" } },
};

export interface OrgSettingsSubItem {
  label: string;
  /** The `page` route params that belong to this item. */
  pages: string[];
}

const overview: OrgSettingsSubItem = { label: "Overview", pages: ["main"] };
const members: OrgSettingsSubItem = { label: "Members", pages: ["members"] };
const invites: OrgSettingsSubItem = { label: "Invites", pages: ["invites"] };
const integrations: OrgSettingsSubItem = {
  label: "Integrations",
  pages: ["integrations"],
};
const analyzers: OrgSettingsSubItem = {
  label: "Analyzers",
  pages: ["analyzers"],
};
const policies: OrgSettingsSubItem = {
  label: "Policies",
  pages: ["policies", "policy", "vulnerability-policy"],
};
const logs: OrgSettingsSubItem = { label: "Audit logs", pages: ["logs"] };

/** The organisation settings pages this member can open, as on the overview. */
export function orgSettingsSubItems(
  org: Pick<Organization, "role" | "personal">,
): OrgSettingsSubItem[] {
  const admin = org.role === MemberRole.OWNER || org.role === MemberRole.ADMIN;
  const moderator = admin || org.role === MemberRole.MODERATOR;
  const team = moderator && !org.personal;
  return [
    overview,
    ...(team ? [members, invites] : []),
    ...(admin ? [integrations, analyzers] : []),
    policies,
    logs,
  ];
}

/** Where a sub-item goes for the given organisation. */
export function orgSettingsSubItemTarget(
  item: OrgSettingsSubItem,
  orgId: string,
): RouteLocationRaw {
  return {
    name: "orgs",
    params: { action: "manage", page: item.pages[0], orgId },
  };
}

/** True when the route belongs to the item. */
export function isActive(item: NavItem, routeName: unknown): boolean {
  return typeof routeName === "string" && item.routes.includes(routeName);
}

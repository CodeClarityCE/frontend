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

/** True when the route belongs to the item. */
export function isActive(item: NavItem, routeName: unknown): boolean {
  return typeof routeName === "string" && item.routes.includes(routeName);
}

import type { RouteLocationNormalized } from "vue-router";

import { orgTitle } from "@/codeclarity_components/organizations/org-route";

const APP = "CodeClarity";

function param(to: RouteLocationNormalized, name: string): string | undefined {
  const value = to.params[name];
  return typeof value === "string" && value !== "" ? value : undefined;
}

// The organisation page's name, from the route's params.
function orgPageTitle(to: RouteLocationNormalized): string {
  const action = param(to, "action");
  const page = param(to, "page");
  const orgId = param(to, "orgId");
  return orgTitle({
    ...(action && { action }),
    ...(page && { page }),
    ...(orgId && { orgId }),
  });
}

// Pages whose name does not depend on the URL.
const fixedNames: Record<string, string> = {
  home: "Dashboard",
  tickets: "Tickets",
  login: "Sign in",
  signup: "Sign up",
  recoveryRequest: "Reset password",
  settings: "Account settings",
  help: "Help",
  clickupOAuthCallback: "Connecting ClickUp",
  notfound: "Page not found",
  terms: "Terms of service",
  privacy: "Privacy policy",
};

// The page's own name, or undefined for the app name alone.
function pageName(to: RouteLocationNormalized): string | undefined {
  const page = param(to, "page");
  switch (to.name) {
    case "results":
      if (page === "vulnerabilities_details") return "Vulnerability details";
      if (page === "sbom_details") return "Dependency details";
      return "Results";
    case "projects":
      return page === "add" ? "Add a Project" : "Projects";
    case "datasets":
      if (page === "add") return "New Dataset";
      return page === "detail" ? "Dataset" : "Datasets";
    case "experiments":
      if (page === "add") return "New Experiment";
      return page === "detail" ? "Experiment" : "Experiments";
    case "analyses":
      return page === "add" ? "New Analysis" : "Analyses";
    case "emailAction":
      if (page === "join_org") return "Organisation invitation";
      if (page === "reset_password") return "Reset password";
      return "Confirm your email";
    case "orgs":
      return orgPageTitle(to);
    default:
      return typeof to.name === "string" ? fixedNames[to.name] : undefined;
  }
}

// The browser tab title for a route, such as "Projects | CodeClarity".
export function pageTitle(to: RouteLocationNormalized): string {
  const name = pageName(to);
  return name ? `${name} | ${APP}` : APP;
}

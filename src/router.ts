import type { Component } from "vue";
import {
  createRouter,
  createWebHistory,
  type RouteLocationNormalized,
} from "vue-router";

import AnalysesView from "@/codeclarity_components/analyses/AnalysesView.vue";
import { AuthRepository } from "@/codeclarity_components/authentication/auth.repository";
import type { AuthenticatedUser } from "@/codeclarity_components/authentication/authenticated_user.entity";
import EmailActionView from "@/codeclarity_components/authentication/email/EmailActionView.vue";
import PasswordResetRequestView from "@/codeclarity_components/authentication/password_reset/PasswordResetRequestView.vue";
import {
  loginRoute,
  redirectAfterLogin,
} from "@/codeclarity_components/authentication/signin/login-route";
import LoginView from "@/codeclarity_components/authentication/signin/LoginView.vue";
import SignupView from "@/codeclarity_components/authentication/signup/SignupView.vue";
import DashboardView from "@/codeclarity_components/dashboard/DashboardView.vue";
import DatasetsView from "@/codeclarity_components/datasets/DatasetsView.vue";
import ExperimentsView from "@/codeclarity_components/experiments/ExperimentsView.vue";
import type { Organization } from "@/codeclarity_components/organizations/organization.entity";
import { OrgRepository } from "@/codeclarity_components/organizations/organization.repository";
import OrganizationView from "@/codeclarity_components/organizations/OrganizationView.vue";
import ProjectsView from "@/codeclarity_components/projects/ProjectsView.vue";
import ResultsView from "@/codeclarity_components/results/ResultsView.vue";
import SettingsView from "@/codeclarity_components/settings/SettingsView.vue";
import ClickUpOAuthCallback from "@/codeclarity_components/tickets/integrations/ClickUpOAuthCallback.vue";
import TicketsView from "@/codeclarity_components/tickets/TicketsView.vue";
import HelpView from "@/codeclarity_components/views/HelpView.vue";
import NotFoundView from "@/codeclarity_components/views/NotFoundView.vue";
import TermsView from "@/codeclarity_components/views/TermsView.vue";
import { loadAuthStoreFromLocalStorage, useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { logger } from "@/utils/logger";
import { pageTitle } from "@/utils/page-title";

// Helper functions to reduce complexity in beforeEach guard
async function refreshTokenIfNeeded(
  authStore: ReturnType<typeof useAuthStore>,
  authRepository: AuthRepository,
): Promise<boolean> {
  const current = new Date();
  const tokenExpiry = authStore.getTokenExpiry;
  if (tokenExpiry && tokenExpiry <= current) {
    // Clear expired tokens using $patch to avoid exactOptionalPropertyTypes issues
    authStore.$patch((state) => {
      delete state.token;
      delete state.tokenExpiry;
    });

    // Refresh the token via the refresh token (if its not expired itself)
    const refreshTokenExpiry = authStore.getRefreshTokenExpiry;
    const refreshToken = authStore.getRefreshToken;
    if (refreshTokenExpiry && refreshToken && refreshTokenExpiry > current) {
      try {
        const newToken = await authRepository.refresh({
          data: { refresh_token: refreshToken },
          handleBusinessErrors: true,
        });
        authStore.token = newToken.token;
        authStore.tokenExpiry = newToken.token_expiry;
        return true;
      } catch (error) {
        logger.warn("Could not refresh the session token", {}, error);
        return false;
      }
    }
    return false;
  }
  return true;
}

async function fetchAuthenticatedUser(
  authStore: ReturnType<typeof useAuthStore>,
  userStore: ReturnType<typeof useUserStore>,
  authRepository: AuthRepository,
): Promise<"ok" | "not_activated" | "failed"> {
  const token = authStore.getToken;
  if (!token) {
    return "failed";
  }

  try {
    const user: AuthenticatedUser = await authRepository.getAuthenticatedUser({
      bearerToken: token,
      validate: false,
      handleBusinessErrors: true,
    });

    if (user.activated === false) {
      return "not_activated";
    }

    userStore.setUser(user);
    return "ok";
  } catch (error) {
    if (
      error instanceof BusinessLogicError &&
      error.error_code === "AccountNotActivated"
    ) {
      return "not_activated";
    }
    logger.error("Could not fetch the signed-in user", {}, error);
    return "failed";
  }
}

async function fetchDefaultOrg(
  authStore: ReturnType<typeof useAuthStore>,
  userStore: ReturnType<typeof useUserStore>,
  orgRepository: OrgRepository,
): Promise<boolean> {
  const user = userStore.getUser;
  const token = authStore.getToken;
  if (!user?.default_org || !token) {
    return true;
  }

  try {
    const org: Organization = await orgRepository.get({
      bearerToken: token,
      orgId: user.default_org.id,
      handleBusinessErrors: true,
    });
    userStore.setDefaultOrg(org);
    return true;
  } catch (error) {
    if (error instanceof BusinessLogicError) {
      const errorCode = error.error_code;
      // It may happen that the org that the user had set as the default org has been deleted
      // or the user might have been removed from an org he had set as the default org
      if (
        errorCode === APIErrors.EntityNotFound ||
        errorCode === APIErrors.NotAuthorized
      ) {
        return await fetchFallbackOrg(authStore, userStore, orgRepository);
      }
    }
    return false;
  }
}

async function fetchFallbackOrg(
  authStore: ReturnType<typeof useAuthStore>,
  userStore: ReturnType<typeof useUserStore>,
  orgRepository: OrgRepository,
): Promise<boolean> {
  const user = userStore.getUser;
  const token = authStore.getToken;
  if (!user?.default_org || !token) {
    return false;
  }

  try {
    const org: Organization = await orgRepository.get({
      bearerToken: token,
      orgId: user.default_org.id,
      handleBusinessErrors: true,
    });
    userStore.setDefaultOrg(org);
    return true;
  } catch (error) {
    logger.error("Could not fetch a fallback organization", {}, error);
    return false;
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: DashboardView as Component,
      props: true,
    },
    {
      path: "/results/:page?",
      name: "results",
      component: ResultsView as Component,
      props: true,
    },
    {
      path: "/projects/:page?",
      name: "projects",
      component: ProjectsView as Component,
      props: true,
    },
    {
      path: "/tickets/integrations/clickup/callback",
      name: "clickupOAuthCallback",
      meta: { public: true },
      component: ClickUpOAuthCallback as Component,
    },
    {
      path: "/tickets/:page?",
      name: "tickets",
      component: TicketsView as Component,
      props: true,
    },
    {
      path: "/datasets/:page?",
      name: "datasets",
      component: DatasetsView as Component,
      props: true,
    },
    {
      path: "/experiments/:page?",
      name: "experiments",
      component: ExperimentsView as Component,
      props: true,
    },
    {
      path: "/analyses/:page?",
      name: "analyses",
      component: AnalysesView as Component,
      props: true,
    },
    {
      path: "/login",
      name: "login",
      meta: { public: true, loggedOutLayout: true },
      component: LoginView as Component,
    },
    {
      path: "/help",
      name: "help",
      meta: { public: true },
      component: HelpView as Component,
    },
    {
      path: "/orgs/:action?/:page?/:orgId?/",
      name: "orgs",
      component: OrganizationView as Component,
      props: true,
    },
    {
      path: "/signup/:provider?",
      name: "signup",
      meta: { public: true, loggedOutLayout: true },
      component: SignupView as Component,
      props: true,
    },
    {
      path: "/password_reset_request",
      name: "recoveryRequest",
      meta: { public: true, loggedOutLayout: true },
      component: PasswordResetRequestView as Component,
    },
    {
      path: "/email_action/:page?",
      name: "emailAction",
      component: EmailActionView as Component,
      props: true,
    },
    {
      path: "/settings/:page?",
      name: "settings",
      component: SettingsView as Component,
      props: true,
    },
    {
      path: "/404",
      name: "notfound",
      meta: { public: true },
      component: NotFoundView as Component,
    },
    {
      path: "/terms",
      name: "terms",
      meta: { public: true },
      component: TermsView as Component,
      props: {
        page: "terms",
      },
    },
    {
      path: "/privacy",
      name: "privacy",
      meta: { public: true },
      component: TermsView as Component,
      props: {
        page: "privacy",
      },
    },
    {
      path: "/:catchAll(.*)",
      redirect: "/404",
    },
  ],
});

// Join links need a signed-in user; the other email links work signed out.
function isPublicRoute(to: RouteLocationNormalized): boolean {
  if (to.name === "emailAction") return to.params.page !== "join_org";
  return to.meta.public === true;
}

// Pages drawn in the signed-out frame, never inside the app shell.
export function usesLoggedOutLayout(to: RouteLocationNormalized): boolean {
  if (to.name === "emailAction") return to.params.page !== "join_org";
  return to.meta.loggedOutLayout === true;
}

// Remounts the page on any URL change except the selected tab, which pages handle themselves.
export function viewKey(to: RouteLocationNormalized): string {
  const query = Object.entries(to.query)
    .filter(([name]) => name !== "tab")
    .map(([name, value]) => `${name}=${String(value)}`)
    .join("&");
  return `${to.path}?${query}${to.hash}`;
}

declare module "vue-router" {
  interface RouteMeta {
    // Opens without signing in.
    public?: boolean;
    // Drawn in the signed-out frame instead of the app shell.
    loggedOutLayout?: boolean;
  }
}

router.beforeEach(async (to) => {
  const authRequired = !isPublicRoute(to);

  const authStore = useAuthStore();
  const userStore = useUserStore();

  const authRepository = new AuthRepository();
  const orgRepository = new OrgRepository();

  if (authStore.getInitialized === false) {
    loadAuthStoreFromLocalStorage();
  }

  // Signed-in users get their identity on every page; on public pages a failure just signs them out.
  const loadIdentity =
    authStore.getToken !== undefined &&
    (authRequired || authStore.getAuthenticated);
  const redirect = authRequired ? to.fullPath : undefined;
  const signOut = (
    notice?: "not_activated",
  ): ReturnType<typeof loginRoute> | true => {
    userStore.$reset();
    authStore.$reset();
    if (!authRequired && notice === undefined) return true;
    return loginRoute({
      ...(notice && { notice }),
      ...(redirect && { redirect }),
    });
  };

  // Check if token is present and needs to be refreshed
  if (loadIdentity) {
    const refreshSuccess = await refreshTokenIfNeeded(
      authStore,
      authRepository,
    );
    if (!refreshSuccess) {
      return signOut();
    }
  }

  // Re-fetched after a page reload, since the SPA state is lost then.
  if (loadIdentity && userStore.getUser === undefined) {
    const fetchResult = await fetchAuthenticatedUser(
      authStore,
      userStore,
      authRepository,
    );
    if (fetchResult === "not_activated") {
      return signOut("not_activated");
    }
    if (fetchResult === "failed") {
      return signOut();
    }
  }

  // Fetch default org info
  if (loadIdentity && userStore.getUser?.default_org) {
    const orgSuccess = await fetchDefaultOrg(
      authStore,
      userStore,
      orgRepository,
    );
    if (!orgSuccess) {
      return signOut();
    }
  }

  const user = userStore.getUser;

  if (authRequired && user?.activated === false) {
    return signOut("not_activated");
  }

  if (authRequired && authStore.getAuthenticated === false) {
    return signOut();
  }

  if (to.name === "login" && authStore.getAuthenticated === true) {
    return redirectAfterLogin(to.query);
  }

  return true;
});

router.afterEach((to) => {
  document.title = pageTitle(to);
});

export default router;

import { getActivePinia } from "pinia";

import { loginRoute } from "@/codeclarity_components/authentication/signin/login-route";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { logger } from "@/utils/logger";

import { APIErrors } from "./ApiErrors";
import { BusinessLogicError, HttpError } from "./BaseRepository";

// "refused": the API turned the refresh down, or the refresh token has expired.
// "no_answer": the refresh got no response, or the API was down (5xx).
type SessionState = "fresh" | "refreshed" | "refused" | "no_answer";

type AuthStore = ReturnType<typeof useAuthStore>;

// A token this close to its expiry is refreshed before use.
const EXPIRY_MARGIN_MS = 30_000;

// One tab at a time may refresh, since the refresh cookie works only once.
const REFRESH_LOCK = "codeclarity-session-refresh";

let refreshInFlight: Promise<SessionState> | undefined;

function expiresSoon(expiry: Date | undefined): boolean {
  return (
    expiry !== undefined && expiry.getTime() - Date.now() <= EXPIRY_MARGIN_MS
  );
}

// True when the API answered the refresh with a refusal, not an outage.
function refusedBy(error: unknown): boolean {
  if (error instanceof HttpError) return error.code < 500;
  return error instanceof BusinessLogicError;
}

// Runs the work while holding the tabs' refresh lock; without Web Locks, in this tab only.
function acrossTabs<T>(work: () => Promise<T>): Promise<T> {
  const locks = (navigator as Partial<Navigator>).locks;
  if (!locks) return work();
  return locks.request(REFRESH_LOCK, { mode: "exclusive" }, work);
}

async function refresh(authStore: AuthStore): Promise<SessionState> {
  // Another tab may have refreshed the shared cookies while this one waited for the lock.
  authStore.adoptRotatedSession();
  if (!expiresSoon(authStore.getTokenExpiry)) return "refreshed";
  const refreshExpiry = authStore.getRefreshTokenExpiry;
  if (!refreshExpiry || refreshExpiry <= new Date()) return "refused";
  // Loaded here so this module stays free of the repositories it serves.
  const { AuthRepository } =
    await import("@/codeclarity_components/authentication/auth.repository");
  try {
    const next = await new AuthRepository().refresh({
      handleBusinessErrors: true,
      handleHTTPErrors: true,
    });
    authStore.adoptSession({
      tokenExpiry: next.token_expiry,
      refreshTokenExpiry: next.refresh_token_expiry,
    });
    return "refreshed";
  } catch (error) {
    if (!refusedBy(error)) return "no_answer";
    logger.warn("Could not refresh the session", {}, error);
    return "refused";
  }
}

// Refreshes the session cookies when the access token has expired or is about to; concurrent callers share one refresh.
export function ensureFreshAccessToken(): Promise<SessionState> {
  if (!getActivePinia()) return Promise.resolve("fresh");
  const authStore = useAuthStore();
  if (!authStore.getAuthenticated || !expiresSoon(authStore.getTokenExpiry)) {
    return Promise.resolve("fresh");
  }
  refreshInFlight ??= acrossTabs(() => refresh(authStore)).finally(() => {
    refreshInFlight = undefined;
  });
  return refreshInFlight;
}

// Clears the session and opens the login page; later callers find it already done.
export function signOut(): void {
  const authStore = useAuthStore();
  if (!authStore.getAuthenticated) return;
  useUserStore().$reset();
  authStore.$reset();
  // Loaded here because the router imports every repository through its views.
  void import("@/router").then(({ default: router }) =>
    router.push(loginRoute({ redirect: router.currentRoute.value.fullPath })),
  );
}

// Signs out here at once, then asks the API to end the sign-in and clear its cookies.
export function endSignIn(): void {
  const authStore = useAuthStore();
  const wasSignedIn = authStore.getAuthenticated;
  useUserStore().$reset();
  authStore.$reset();
  if (!wasSignedIn) return;
  void import("@/codeclarity_components/authentication/auth.repository")
    .then(({ AuthRepository }) =>
      new AuthRepository().signOut({
        handleBusinessErrors: true,
        handleHTTPErrors: true,
        handleOtherErrors: true,
      }),
    )
    .catch((error: unknown) => {
      logger.warn("Could not end the session on the server", {}, error);
    });
}

/**
 * Makes sure the session cookies are fresh before a request: refreshes them
 * when the access token is about to expire. A refused refresh signs the user out.
 */
export async function ensureFreshSession(): Promise<void> {
  const state = await ensureFreshAccessToken();
  if (state === "refused") {
    signOut();
    throw new BusinessLogicError(
      APIErrors.NotAuthenticated,
      "The session has expired",
    );
  }
  if (state === "no_answer") {
    // Same as a request that got no answer: the caller keeps the session.
    throw new TypeError("Could not refresh the session token");
  }
}

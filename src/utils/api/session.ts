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

// A token this close to its expiry is refreshed before use.
const EXPIRY_MARGIN_MS = 30_000;

let refreshInFlight: Promise<SessionState> | undefined;

// Access tokens a refresh has replaced, so a caller holding one gets the new token.
const replacedTokens = new Set<string>();

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

async function refresh(): Promise<SessionState> {
  const authStore = useAuthStore();
  const refreshToken = authStore.getRefreshToken;
  const refreshExpiry = authStore.getRefreshTokenExpiry;
  if (!refreshToken || !refreshExpiry || refreshExpiry <= new Date()) {
    return "refused";
  }
  // Loaded here so this module stays free of the repositories it serves.
  const { AuthRepository } =
    await import("@/codeclarity_components/authentication/auth.repository");
  try {
    const newToken = await new AuthRepository().refresh({
      data: { refresh_token: refreshToken },
      handleBusinessErrors: true,
      handleHTTPErrors: true,
    });
    const oldToken = authStore.getToken;
    if (oldToken) replacedTokens.add(oldToken);
    authStore.setToken(newToken.token);
    authStore.setTokenExpiry(newToken.token_expiry);
    return "refreshed";
  } catch (error) {
    if (!refusedBy(error)) return "no_answer";
    logger.warn("Could not refresh the session token", {}, error);
    return "refused";
  }
}

// Refreshes the access token when it has expired or is about to; concurrent callers share one refresh.
export function ensureFreshAccessToken(): Promise<SessionState> {
  if (!getActivePinia()) return Promise.resolve("fresh");
  const authStore = useAuthStore();
  if (!authStore.getToken || !expiresSoon(authStore.getTokenExpiry)) {
    return Promise.resolve("fresh");
  }
  refreshInFlight ??= refresh().finally(() => {
    refreshInFlight = undefined;
  });
  return refreshInFlight;
}

// Clears the session and opens the login page; later callers find it already done.
function signOut(): void {
  const authStore = useAuthStore();
  if (!authStore.getAuthenticated && !authStore.getToken) return;
  useUserStore().$reset();
  authStore.$reset();
  // Loaded here because the router imports every repository through its views.
  void import("@/router").then(({ default: router }) =>
    router.push(loginRoute({ redirect: router.currentRoute.value.fullPath })),
  );
}

/**
 * The bearer to send for a request the caller signed with `bearerToken`.
 * The session's access token is refreshed first when it is about to expire.
 */
export async function bearerFor(bearerToken: string): Promise<string> {
  if (!getActivePinia()) return bearerToken;
  const authStore = useAuthStore();
  const ours =
    bearerToken === authStore.getToken || replacedTokens.has(bearerToken);
  if (!ours) return bearerToken;
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
  return authStore.getToken ?? bearerToken;
}

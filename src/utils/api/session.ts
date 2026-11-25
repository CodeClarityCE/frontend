import { getActivePinia } from "pinia";

import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { logger } from "@/utils/logger";

import { BusinessLogicError, HttpError } from "./BaseRepository";

// "refused": the API turned the refresh down, or the refresh token has expired.
// "no_answer": the refresh request got no response.
type SessionState = "fresh" | "refreshed" | "refused" | "no_answer";

// A token this close to its expiry is refreshed before use.
const EXPIRY_MARGIN_MS = 30_000;

let refreshInFlight: Promise<SessionState> | undefined;

function expiresSoon(expiry: Date | undefined): boolean {
  return (
    expiry !== undefined && expiry.getTime() - Date.now() <= EXPIRY_MARGIN_MS
  );
}

// True when fetch failed before the API answered.
function gotNoAnswer(error: unknown): boolean {
  return !(error instanceof BusinessLogicError || error instanceof HttpError);
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
    authStore.setToken(newToken.token);
    authStore.setTokenExpiry(newToken.token_expiry);
    return "refreshed";
  } catch (error) {
    if (gotNoAnswer(error)) return "no_answer";
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

// Clears the session after a refused refresh.
function signOutLocally(): void {
  useUserStore().$reset();
  useAuthStore().$reset();
}

// The bearer to send in place of `bearerToken`: the fresh access token when it is the store's.
export async function bearerFor(
  bearerToken: string,
): Promise<{ token: string } | { signedOut: true }> {
  if (!getActivePinia() || bearerToken !== useAuthStore().getToken) {
    return { token: bearerToken };
  }
  const state = await ensureFreshAccessToken();
  if (state === "refused") {
    signOutLocally();
    return { signedOut: true };
  }
  return { token: useAuthStore().getToken ?? bearerToken };
}

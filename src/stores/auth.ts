import { Type } from "class-transformer";
import { IsOptional, IsString } from "class-validator";
import { defineStore } from "pinia";

import { Entity } from "@/utils/api/BaseEntity";
import { logger } from "@/utils/logger";
import { OptionalDateTransform } from "@/utils/OptionalDate";

const storePeristantName = "authStore";

// The API keeps the tokens in HttpOnly cookies (ADR 0025); this state holds no secret.
class AuthStoreState {
  @Type(() => Boolean)
  initialized!: boolean;

  @OptionalDateTransform("tokenExpiry")
  tokenExpiry?: Date;

  @OptionalDateTransform("refreshTokenExpiry")
  refreshTokenExpiry?: Date;

  // The signed-in user, so a tab can tell whether another tab's sign-in is the same user's.
  @IsOptional()
  @IsString()
  userId?: string;

  @Type(() => Boolean)
  authenticated!: boolean;

  @IsOptional()
  @IsString()
  socialAuthState?: string;
}

/** When the tokens of a sign-in or refresh end. */
export interface SessionTimes {
  tokenExpiry: Date;
  refreshTokenExpiry: Date;
}

const defaultValues = (): AuthStoreState => {
  return {
    initialized: false,
    tokenExpiry: undefined,
    refreshTokenExpiry: undefined,
    userId: undefined,
    authenticated: false,
    socialAuthState: undefined,
  };
};

export const useAuthStore = defineStore("auth", {
  state: (): AuthStoreState => {
    return defaultValues();
  },

  getters: {
    getTokenExpiry(state: AuthStoreState): Date | undefined {
      return state.tokenExpiry;
    },
    getRefreshTokenExpiry(state: AuthStoreState): Date | undefined {
      return state.refreshTokenExpiry;
    },
    getUserId(state: AuthStoreState): string | undefined {
      return state.userId;
    },
    getAuthenticated(state: AuthStoreState): boolean {
      return state.authenticated;
    },
    getInitialized(state: AuthStoreState): boolean {
      return state.initialized;
    },
    getSocialAuthState(state: AuthStoreState): string | undefined {
      return state.socialAuthState;
    },
  },

  actions: {
    setAuthenticated: function (authenticated: boolean): void {
      this.authenticated = authenticated;
    },
    setInitialized: function (initialized: boolean): void {
      this.initialized = initialized;
    },
    setSocialAuthState: function (socialAuthState: string): void {
      this.socialAuthState = socialAuthState;
    },
    // Records a new sign-in of the user, whose tokens the API set as cookies.
    startSession: function (userId: string, times: SessionTimes): void {
      this.$patch({
        authenticated: true,
        userId,
        tokenExpiry: times.tokenExpiry,
        refreshTokenExpiry: times.refreshTokenExpiry,
      });
    },
    // A patch is saved to storage at once, so other tabs see it before the refresh lock is released.
    adoptSession: function (times: SessionTimes): void {
      this.$patch({
        tokenExpiry: times.tokenExpiry,
        refreshTokenExpiry: times.refreshTokenExpiry,
      });
    },
    // Takes the times another tab saved after refreshing the same user's cookies.
    adoptRotatedSession: function (): void {
      const stored = storedSession();
      if (!this.authenticated || !stored) return;
      if (stored.userId !== this.userId) return;
      if (stored.tokenExpiry.getTime() === this.tokenExpiry?.getTime()) return;
      this.adoptSession(stored);
    },
  },
});

/** The session saved in this browser, which another tab may have refreshed. */
function storedSession(): (SessionTimes & { userId: string }) | undefined {
  const { authenticated, userId, tokenExpiry, refreshTokenExpiry } =
    getFromLocalStorageOrDefault();
  if (!authenticated || !userId || !tokenExpiry || !refreshTokenExpiry) {
    return undefined;
  }
  return { userId, tokenExpiry, refreshTokenExpiry };
}

// The user a saved session names, or undefined when there is none.
function userIn(saved: string | null): string | undefined {
  try {
    const state = JSON.parse(saved ?? "null") as { userId?: unknown } | null;
    return typeof state?.userId === "string" ? state.userId : undefined;
  } catch {
    return undefined;
  }
}

// Another tab's refresh, sign-in or sign-out lands here, so every tab follows it.
function followOtherTabs(store: ReturnType<typeof useAuthStore>): void {
  window.addEventListener("storage", (event) => {
    if (event.key !== storePeristantName) return;
    if (!store.authenticated) return;
    const stored = storedSession();
    if (stored) {
      // The cookies are shared, so another user's sign-in replaces this tab's: start over as them.
      if (stored.userId !== store.userId) {
        window.location.reload();
        return;
      }
      store.adoptRotatedSession();
      return;
    }
    // The saved session is gone: the other tab signed this user out.
    if (userIn(event.oldValue) !== store.userId) return;
    // Loaded here because the session module imports this store.
    void import("@/utils/api/session").then(({ signOut }) => {
      signOut();
    });
  });
}

// True for a session saved before ADR 0025, which held the tokens themselves.
function holdsTokens(saved: string): boolean {
  try {
    const state = JSON.parse(saved) as Record<string, unknown> | null;
    return state !== null && ("token" in state || "refreshToken" in state);
  } catch {
    return false;
  }
}

export function loadAuthStoreFromLocalStorage(): void {
  const store = useAuthStore();

  // An old saved session is deleted unread, so its tokens leave the browser; the user signs in once.
  const saved = localStorage.getItem(storePeristantName);
  if (saved !== null && holdsTokens(saved)) {
    localStorage.removeItem(storePeristantName);
  }

  const peristedState = getFromLocalStorageOrDefault();
  store.$patch(peristedState);
  store.setInitialized(true);

  store.$subscribe((_mutation, state) => {
    localStorage.setItem(storePeristantName, JSON.stringify(state));
  });
  followOtherTabs(store);

  // Overwrite the reset function to be able to also reset the localstorage
  store.$reset = function (): void {
    // (1) Clear store
    store.$patch(defaultValues());

    // (2) Clear local storage
    if (localStorage.getItem(storePeristantName)) {
      localStorage.removeItem(storePeristantName);
    }
  };
}

function getFromLocalStorageOrDefault(): AuthStoreState {
  try {
    const authState = localStorage.getItem(storePeristantName);
    if (authState === null) {
      return defaultValues();
    }
    const parsed = JSON.parse(authState) as AuthStoreState;
    return Entity.unMarshal<AuthStoreState>(parsed, AuthStoreState);
  } catch (err) {
    logger.warn("Could not restore the saved session", {}, err);
    return defaultValues();
  }
}

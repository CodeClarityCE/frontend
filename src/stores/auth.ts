import { Type } from "class-transformer";
import { IsOptional, IsString } from "class-validator";
import { defineStore } from "pinia";

import { Entity } from "@/utils/api/BaseEntity";
import { logger } from "@/utils/logger";
import { OptionalDateTransform } from "@/utils/OptionalDate";

const storePeristantName = "authStore";

class AuthStoreState {
  @Type(() => Boolean)
  initialized!: boolean;

  @IsOptional()
  @IsString()
  token?: string;

  @OptionalDateTransform("tokenExpiry")
  tokenExpiry?: Date;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @OptionalDateTransform("refreshTokenExpiry")
  refreshTokenExpiry?: Date;

  @Type(() => Boolean)
  authenticated!: boolean;

  @IsOptional()
  @IsString()
  socialAuthState?: string;
}
/** The tokens a sign-in or refresh hands out; an older API's refresh leaves the refresh token out. */
export interface SessionTokens {
  token: string;
  tokenExpiry: Date;
  refreshToken?: string | undefined;
  refreshTokenExpiry?: Date | undefined;
}

// Access tokens a refresh here or in another tab replaced, so a caller holding one gets the new token.
const replacedAccessTokens = new Set<string>();

export function isReplacedAccessToken(token: string): boolean {
  return replacedAccessTokens.has(token);
}

const defaultValues = (): AuthStoreState => {
  return {
    initialized: false,
    token: undefined,
    tokenExpiry: undefined,
    refreshToken: undefined,
    refreshTokenExpiry: undefined,
    authenticated: false,
    socialAuthState: undefined,
  };
};

export const useAuthStore = defineStore("auth", {
  state: (): AuthStoreState => {
    return defaultValues();
  },

  getters: {
    getToken(state: AuthStoreState): string | undefined {
      return state.token;
    },
    getRefreshToken(state: AuthStoreState): string | undefined {
      return state.refreshToken;
    },
    getTokenExpiry(state: AuthStoreState): Date | undefined {
      return state.tokenExpiry;
    },
    getRefreshTokenExpiry(state: AuthStoreState): Date | undefined {
      return state.refreshTokenExpiry;
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
    setToken: function (token: string): void {
      this.token = token;
    },
    setRefreshToken: function (refreshToken: string): void {
      this.refreshToken = refreshToken;
    },
    setTokenExpiry: function (tokenExpiry: Date): void {
      this.tokenExpiry = tokenExpiry;
    },
    setRefreshTokenExpiry: function (refreshTokenExpiry: Date): void {
      this.refreshTokenExpiry = refreshTokenExpiry;
    },
    setAuthenticated: function (authenticated: boolean): void {
      this.authenticated = authenticated;
    },
    setInitialized: function (initialized: boolean): void {
      this.initialized = initialized;
    },
    setSocialAuthState: function (socialAuthState: string): void {
      this.socialAuthState = socialAuthState;
    },
    // A patch is saved to storage at once, so other tabs see it before the refresh lock is released.
    adoptTokens: function (tokens: SessionTokens): void {
      if (this.token && this.token !== tokens.token) {
        replacedAccessTokens.add(this.token);
      }
      this.$patch({
        token: tokens.token,
        tokenExpiry: tokens.tokenExpiry,
        ...(tokens.refreshToken !== undefined && {
          refreshToken: tokens.refreshToken,
          refreshTokenExpiry: tokens.refreshTokenExpiry,
        }),
      });
    },
  },
});

/** The session tokens saved in this browser, which another tab may have rotated. */
export function storedSessionTokens(): SessionTokens | undefined {
  const { token, tokenExpiry, refreshToken, refreshTokenExpiry } =
    getFromLocalStorageOrDefault();
  if (!token || !tokenExpiry || !refreshToken) return undefined;
  return { token, tokenExpiry, refreshToken, refreshTokenExpiry };
}

// Takes the tokens another tab saved, when they belong to a newer refresh than ours.
function followOtherTabs(store: ReturnType<typeof useAuthStore>): void {
  window.addEventListener("storage", (event) => {
    if (event.key !== storePeristantName || event.newValue === null) return;
    const stored = storedSessionTokens();
    if (!store.authenticated || !stored) return;
    if (stored.refreshToken === store.refreshToken) return;
    store.adoptTokens(stored);
  });
}

export function loadAuthStoreFromLocalStorage(): void {
  const store = useAuthStore();

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

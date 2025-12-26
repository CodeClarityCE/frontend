import { Entity } from "@/utils/api/BaseEntity";
import { OptionalDateTransform } from "@/utils/OptionalDate";
import { Type } from "class-transformer";
import { IsOptional, IsString } from "class-validator";
import { defineStore } from "pinia";

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
      return state.refreshToken;
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
  },
});

export function loadAuthStoreFromLocalStorage(): void {
  const store = useAuthStore();

  const peristedState = getFromLocalStorageOrDefault();
  store.$patch(peristedState);
  store.setInitialized(true);

  store.$subscribe((_mutation, state) => {
    localStorage.setItem(storePeristantName, JSON.stringify(state));
  });

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
    console.error(err);

    return defaultValues();
  }
}

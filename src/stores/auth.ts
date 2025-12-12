import { Entity } from '@/utils/api/BaseEntity';
import { OptionalDateTransform } from '@/utils/OptionalDate';
import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { defineStore } from 'pinia';

const storePeristantName = 'authStore';

class AuthStoreState {
    @Type(() => Boolean)
    initialized!: boolean;

    @IsOptional()
    @IsString()
    token?: string;

    @OptionalDateTransform('tokenExpiry')
    tokenExpiry?: Date;

    @IsOptional()
    @IsString()
    refreshToken?: string;

    @OptionalDateTransform('refreshTokenExpiry')
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
        socialAuthState: undefined
    };
};

export const useAuthStore = defineStore('auth', {
    state: (): AuthStoreState => {
        return defaultValues();
    },

    getters: {
        getToken(state: AuthStoreState) {
            return state.refreshToken;
        },
        getRefreshToken(state: AuthStoreState) {
            return state.refreshToken;
        },
        getTokenExpiry(state: AuthStoreState) {
            return state.tokenExpiry;
        },
        getRefreshTokenExpiry(state: AuthStoreState) {
            return state.refreshTokenExpiry;
        },
        getAuthenticated(state: AuthStoreState) {
            return state.authenticated;
        },
        getInitialized(state: AuthStoreState) {
            return state.initialized;
        },
        getSocialAuthState(state: AuthStoreState) {
            return state.socialAuthState;
        }
    },

    actions: {
        setToken: function (token: string) {
            this.token = token;
        },
        setRefreshToken: function (refreshToken: string) {
            this.refreshToken = refreshToken;
        },
        setTokenExpiry: function (tokenExpiry: Date) {
            this.tokenExpiry = tokenExpiry;
        },
        setRefreshTokenExpiry: function (refreshTokenExpiry: Date) {
            this.refreshTokenExpiry = refreshTokenExpiry;
        },
        setAuthenticated: function (authenticated: boolean) {
            this.authenticated = authenticated;
        },
        setInitialized: function (initialized: boolean) {
            this.initialized = initialized;
        },
        setSocialAuthState: function (socialAuthState: string) {
            this.socialAuthState = socialAuthState;
        }
    }
});

export function loadAuthStoreFromLocalStorage() {
    const store = useAuthStore();

    const peristedState = getFromLocalStorageOrDefault();
    store.$patch(peristedState);
    store.setInitialized(true);

    store.$subscribe((mutation, state) => {
        localStorage.setItem(storePeristantName, JSON.stringify(state));
    });

    // Overwrite the reset function to be able to also reset the localstorage
    store.$reset = function () {
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
        return authState === null
            ? defaultValues()
            : Entity.unMarshal<AuthStoreState>(JSON.parse(authState), AuthStoreState);
    } catch (err) {
        console.error(err);

        return defaultValues();
    }
}

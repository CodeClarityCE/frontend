import type { AuthenticatedUser } from '@/repositories/types/entities/AuthenticatedUser';
import type { Organization } from '@/repositories/types/entities/Organization';
import { defineStore } from 'pinia';

interface UserStoreState {
    user?: AuthenticatedUser;
    defaultOrg?: Organization;
}

export const useUserStore = defineStore('user', {
    state: (): UserStoreState => {
        return {
            user: undefined,
            defaultOrg: undefined
        };
    },

    getters: {
        getUser(state: UserStoreState) {
            return state.user;
        },
        getDefaultOrg(state: UserStoreState) {
            return state.defaultOrg;
        }
    },

    actions: {
        setUser: function (user: AuthenticatedUser) {
            this.user = user;
        },
        setDefaultOrg: function (defaultOrg: Organization) {
            this.defaultOrg = defaultOrg;
            if (this.user) this.user.default_org.id = defaultOrg.id;
        }
    }
});

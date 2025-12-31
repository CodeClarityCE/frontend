import { defineStore } from "pinia";

import type { AuthenticatedUser } from "@/codeclarity_components/authentication/authenticated_user.entity";
import type { Organization } from "@/codeclarity_components/organizations/organization.entity";

interface UserStoreState {
  user?: AuthenticatedUser;
  defaultOrg?: Organization;
}

export const useUserStore = defineStore("user", {
  state: (): UserStoreState => {
    return {
      user: undefined,
      defaultOrg: undefined,
    };
  },

  getters: {
    getUser(state: UserStoreState) {
      return state.user;
    },
    getDefaultOrg(state: UserStoreState) {
      return state.defaultOrg;
    },
  },

  actions: {
    setUser: function (user: AuthenticatedUser) {
      this.user = user;
    },
    setDefaultOrg: function (defaultOrg: Organization) {
      this.defaultOrg = defaultOrg;
      if (this.user) this.user.default_org.id = defaultOrg.id;
    },
  },
});

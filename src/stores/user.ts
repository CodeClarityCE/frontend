import { defineStore } from "pinia";

import type { AuthenticatedUser } from "@/codeclarity_components/authentication/authenticated_user.entity";
import type { Organization } from "@/codeclarity_components/organizations/organization.entity";

interface UserStoreState {
  user?: AuthenticatedUser;
  defaultOrg?: Organization;
  // The organisation whose settings pages are open, which may not be the default one.
  viewedOrg?: Organization;
}

export const useUserStore = defineStore("user", {
  state: (): UserStoreState => {
    return {
      user: undefined,
      defaultOrg: undefined,
      viewedOrg: undefined,
    };
  },

  getters: {
    getUser(state: UserStoreState) {
      return state.user;
    },
    getDefaultOrg(state: UserStoreState) {
      return state.defaultOrg;
    },
    getViewedOrg(state: UserStoreState) {
      return state.viewedOrg;
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
    setViewedOrg: function (org: Organization) {
      this.viewedOrg = org;
    },
  },
});

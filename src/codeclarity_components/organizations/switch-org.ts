import { UserRepository } from "@/codeclarity_components/authentication/user.repository";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";

import { OrgRepository } from "./organization.repository";

/** Makes `orgId` the signed-in user's default organization; rejects when they cannot open it. */
export async function switchDefaultOrg(orgId: string): Promise<void> {
  const userStore = useUserStore();
  const authStore = useAuthStore();
  const user = userStore.getUser;
  const token = authStore.getToken;
  if (!user || !token) throw new Error("Not signed in");
  // Read it first, so a link to an organization the user is not in changes nothing.
  const org = await new OrgRepository().get({
    bearerToken: token,
    handleBusinessErrors: true,
    orgId,
  });
  await new UserRepository().setDefaultOrg({
    bearerToken: token,
    userId: user.id,
    data: { default_org: orgId },
    handleBusinessErrors: true,
  });
  userStore.setDefaultOrg(org);
}

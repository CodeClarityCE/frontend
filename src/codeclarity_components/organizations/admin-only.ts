import router from "@/router";

import {
  isMemberRoleGreaterOrEqualTo,
  MemberRole,
  type Organization,
} from "./organization.entity";

/** Sends a member below minRole to the org overview, replacing the page in history. */
export function leaveUnlessRole(
  org: Pick<Organization, "id" | "role">,
  minRole: MemberRole,
): void {
  if (org.role != null && isMemberRoleGreaterOrEqualTo(org.role, minRole))
    return;
  void router.replace({
    name: "orgs",
    params: { action: "manage", page: "main", orgId: org.id },
  });
}

/** Sends a non-admin from an admin-only page to the org overview, replacing it in history. */
export function leaveUnlessOrgAdmin(
  org: Pick<Organization, "id" | "role">,
): void {
  leaveUnlessRole(org, MemberRole.ADMIN);
}

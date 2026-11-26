import router from "@/router";

import { isOrgAdmin, type Organization } from "./organization.entity";

/** Sends a non-admin from an admin-only page to the org overview, replacing it in history. */
export function leaveUnlessOrgAdmin(
  org: Pick<Organization, "id" | "role">,
): void {
  if (isOrgAdmin(org.role)) return;
  void router.replace({
    name: "orgs",
    params: { action: "manage", page: "main", orgId: org.id },
  });
}

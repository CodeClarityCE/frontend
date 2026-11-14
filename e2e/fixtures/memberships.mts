import user from "./user.json" with { type: "json" };

/** A user as the API nests it in memberships and organisations. */
export function apiUser(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    handle: user.handle,
    email: user.email,
    social: false,
    social_register_type: null,
    setup_done: true,
    activated: true,
    avatar_url: null,
    created_on: "2024-10-18T10:09:52.066Z",
    registration_verified: true,
    setup_temporary_conf: null,
    ...overrides,
  };
}

/**
 * A row of GET /org built from an organisation as GET /org/:org returns it:
 * the role and join date move to the row, and the member count becomes
 * that many entries in `organizationMemberships`.
 */
export function orgListRow(
  org: Record<string, unknown>,
): Record<string, unknown> {
  const {
    role,
    joined_on,
    number_of_members,
    organizationMemberships: _single,
    created_by: _creator,
    ...organization
  } = org;
  return {
    role,
    joined_on,
    user: apiUser(),
    organization: {
      auto_resolve_tickets: false,
      ...organization,
      created_by: apiUser(),
      organizationMemberships: Array.from(
        { length: Number(number_of_members) },
        (_, i) => ({ role: i === 0 ? role : 3, joined_on }),
      ),
    },
  };
}

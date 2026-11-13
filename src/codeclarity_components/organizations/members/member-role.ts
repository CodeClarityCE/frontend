import { MemberRole } from "../organization.entity";

const labels: Record<MemberRole, string> = {
  [MemberRole.OWNER]: "Owner",
  [MemberRole.ADMIN]: "Admin",
  [MemberRole.MODERATOR]: "Moderator",
  [MemberRole.USER]: "User",
};

/** The role in words, as the UI shows it. */
export function roleLabel(role: MemberRole): string {
  return labels[role] ?? "Unknown";
}

/** Roles an inviter can hand out, highest first. */
export const invitableRoles: MemberRole[] = [
  MemberRole.ADMIN,
  MemberRole.MODERATOR,
  MemberRole.USER,
];

import type { MemberRole } from '../organization.entity';

export interface CreateInvite {
    user_email: string;
    role: MemberRole;
}

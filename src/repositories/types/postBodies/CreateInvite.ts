import type { MemberRole } from '../entities/Organization';

export interface CreateInvite {
    user_email: string;
    role: MemberRole;
}

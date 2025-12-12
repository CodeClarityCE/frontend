<script lang="ts" setup>
import LoadingButton from '@/base_components/ui/loaders/LoadingButton.vue';
import CenteredModal from '@/base_components/ui/modals/CenteredModal.vue';
import Button from '@/shadcn/ui/button/Button.vue';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { APIErrors } from '@/utils/api/ApiErrors';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { formatDate, formatRelativeTime } from '@/utils/dateUtils';
import { errorToast, successToast } from '@/utils/toasts';
import { Icon } from '@iconify/vue';
import { ref, type Ref } from 'vue';
import { isMemberRoleGreaterThan, MemberRole, type Organization } from '../../organization.entity';
import { OrgRepository } from '../../organization.repository';
import type { Invitation } from '../invitation.entity';

enum ModalAction {
    REVOKE = 'REVOKE',
    NONE = ''
}

// Props
const props = defineProps<{
    invitation: Invitation;
    orgId: string;
    orgInfo: Organization;
}>();

// Stores
const authStore = useAuthStore();
const userStore = useUserStore();

// Repositories
const orgRepository: OrgRepository = new OrgRepository();

// State
const resendInvitationLoadingButtonRef: any = ref(null);
const centeredModalRef: any = ref(null);
const centeredModalAction: Ref<ModalAction> = ref(ModalAction.NONE);

// Methods
async function revokeInvitation() {
    if (!(authStore.getAuthenticated && authStore.getToken)) return;

    try {
        await orgRepository.revokeInvitation({
            orgId: props.orgId,
            invitationId: props.invitation.id,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true
        });

        successToast('Successfully revoked the invitation');
    } catch (err) {
        if (err instanceof BusinessLogicError) {
            if (
                err.error_code === APIErrors.PersonalOrgCannotBeModified ||
                err.error_code === APIErrors.InternalError
            ) {
                errorToast('Failed to revoke the invitation.');
            } else if (err.error_code === APIErrors.NotAuthorized) {
                errorToast('You are not authorized to perform this action');
            } else if (err.error_code === APIErrors.EntityNotFound) {
                successToast('Successfully revoked the invitation');
            }
        } else {
            errorToast('Failed to revoke the invitation.');
        }
    } finally {
        emit('refetch');
    }
}

async function resendInvitation() {
    if (!(authStore.getAuthenticated && authStore.getToken)) return;

    if (resendInvitationLoadingButtonRef.value) {
        resendInvitationLoadingButtonRef.value.setLoading(true);
        resendInvitationLoadingButtonRef.value.setDisabled(true);
    }

    try {
        await orgRepository.resendOrgInvitationEmail({
            orgId: props.orgId,
            invitationId: props.invitation.id,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true
        });

        successToast('Successfully resent the invitation');
    } catch (err) {
        if (err instanceof BusinessLogicError) {
            if (
                err.error_code === APIErrors.PersonalOrgCannotBeModified ||
                err.error_code === APIErrors.InternalError
            ) {
                errorToast('Failed to resend the invitation.');
            } else if (err.error_code === APIErrors.NotAuthorized) {
                errorToast('You are not authorized to perform this action');
            } else if (err.error_code === APIErrors.EntityNotFound) {
                successToast('Successfully resent the invitation');
            }
        } else {
            errorToast('Failed to resend the invitation.');
        }
    } finally {
        if (resendInvitationLoadingButtonRef.value) {
            resendInvitationLoadingButtonRef.value.setLoading(false);
            resendInvitationLoadingButtonRef.value.setDisabled(false);
        }
        emit('refetch');
    }
}

async function performModalAction() {
    try {
        if (centeredModalAction.value === ModalAction.REVOKE) {
            await revokeInvitation();
        }
        emit('refetch');
    } finally {
        centeredModalAction.value = ModalAction.NONE;
        if (centeredModalRef.value) centeredModalRef.value.toggle();
    }
}

function openModalAction(action: ModalAction) {
    centeredModalAction.value = action;
    if (centeredModalRef.value) centeredModalRef.value.toggle();
}

const emit = defineEmits<(e: 'refetch') => void>();
</script>
<template>
    <tr>
        <td>
            <div>{{ invitation.user_email }}</div>
        </td>
        <td>
            <div v-if="invitation.role === MemberRole.OWNER" class="org-membership membership-owner">
                Owner
            </div>
            <div v-if="invitation.role === MemberRole.ADMIN" class="org-membership membership-admin">
                Admin
            </div>
            <div
                v-if="invitation.role === MemberRole.MODERATOR"
                class="org-membership membership-moderator"
            >
                Moderator
            </div>
            <div v-if="invitation.role === MemberRole.USER" class="org-membership membership-user">
                User
            </div>
        </td>
        <td>
            <div class="flex flex-row gap-2 w-fit items-center">
                <div v-if="invitation.created_by" class="user-avatar-wrapper">
                    <div v-if="invitation.created_by.avatar_url">
                        <img class="user-image w-8" :src="invitation.created_by.avatar_url" />
                    </div>
                    <div v-else class="user-avatar user-avatar-inner-wrapper">
                        <Icon class="icon user-icon w-8" icon="solar:smile-circle-broken"></Icon>
                    </div>
                </div>
                <div v-else></div>
                <div class="flex flex-col gap-0.5">
                    <div v-if="invitation.created_by">
                        <div
                            v-if="invitation.created_by.role === MemberRole.OWNER"
                            class="org-membership membership-owner"
                        >
                            Owner
                        </div>
                        <div
                            v-if="invitation.created_by.role === MemberRole.ADMIN"
                            class="org-membership membership-admin"
                        >
                            Admin
                        </div>
                        <div
                            v-if="invitation.created_by.role === MemberRole.MODERATOR"
                            class="org-membership membership-moderator"
                        >
                            Moderator
                        </div>
                        <div
                            v-if="invitation.created_by.role === MemberRole.USER"
                            class="org-membership membership-user"
                        >
                            User
                        </div>
                    </div>
                    <div v-if="invitation.created_by">
                        <div class="member-handle">@{{ invitation.created_by.handle }}</div>
                    </div>
                    <div v-else>
                        <div class="member-handle">Deleted user</div>
                    </div>
                </div>
            </div>
        </td>
        <td>
            <div>
                {{ formatDate(invitation.created_on, 'LL') }}
            </div>
        </td>
        <td>
            <div>
                {{ formatRelativeTime(invitation.ttl) }}
            </div>
        </td>
        <td>
            <div class="flex flex-row gap-2 org-member-list-actions">
                <LoadingButton
                    ref="resendInvitationLoadingButtonRef"
                    class="clear-button"
                    title="Resend invitation"
                    style="min-width: 150px; width: fit-content"
                    @click="resendInvitation()"
                >
                    <div class="flex flex-row gap-1 items-center">
                        <Icon class="icon" icon="mdi:email-sync" style="font-size: 1.2em"></Icon>
                        <div>Resend invitation</div>
                    </div>
                </LoadingButton>
                <Button
                    v-if="
                        !invitation.created_by ||
                        invitation.created_by.id === userStore.getUser!.id ||
                        isMemberRoleGreaterThan(orgInfo.role, invitation.created_by.role)
                    "
                    variant="destructive"
                    @click="openModalAction(ModalAction.REVOKE)"
                >
                    <Icon icon="mdi:email-remove"></Icon>
                    Revoke invitation
                </Button>
            </div>
        </td>
    </tr>
    <CenteredModal ref="centeredModalRef">
        <template #title>
            <div
                style="
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    column-gap: 7px;
                    justify-content: space-between;
                "
            >
                <div v-if="centeredModalAction === ModalAction.REVOKE">Revoke the invitation?</div>
            </div>
        </template>
        <template #content>
            <div
                style="
                    display: flex;
                    flex-direction: column;
                    row-gap: 1.5em;
                    max-width: 400px;
                    width: 100vw;
                "
            >
                <div v-if="centeredModalAction === ModalAction.REVOKE">
                    <div>
                        Are you sure you want to revoke the invitation to join the organization?
                    </div>
                    <div>You can always invite them back to the organization.</div>
                </div>
            </div>
        </template>
        <template #buttons>
            <Button
                v-if="centeredModalAction === ModalAction.REVOKE"
                variant="destructive"
                @click="performModalAction()"
            >
                <Icon icon="mdi:email-remove"></Icon>
                Revoke invitation
            </Button>
            <Button variant="outline" @click="centeredModalRef.toggle()">
                <template #text> Cancel </template>
            </Button>
        </template>
    </CenteredModal>
</template>

<style scoped lang="scss">
.org-membership {
    border-radius: 15px;
    padding: 3px;
    padding-left: 8px;
    padding-right: 8px;
    background-color: gray;
    color: #fff;
    width: fit-content;
    font-weight: 900;
    font-size: 0.9em;
}

.membership-owner {
    background-color: #dab909;
}

.membership-admin {
    background-color: #e63434;
}

.membership-moderator {
    background-color: var(--color-accent);
}

.membership-user {
    background-color: #808e64;
}
</style>

<script lang="ts" setup>
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { OrgRepository } from '@/codeclarity_components/organizations/organization.repository';
import type {
    Organization,
    TeamMember
} from '@/codeclarity_components/organizations/organization.entity';
import { MemberRole } from '@/codeclarity_components/organizations/organization.entity';
import { isMemberRoleGreaterThan } from '@/codeclarity_components/organizations/organization.entity';
import { APIErrors } from '@/utils/api/ApiErrors';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import moment from 'moment';
import CenteredModal from '@/base_components/ui/modals/CenteredModal.vue';
import { ref, type Ref } from 'vue';
import { Icon } from '@iconify/vue';
import { errorToast, successToast } from '@/utils/toasts';
import Button from '@/shadcn/ui/button/Button.vue';

const props = defineProps<{
    member: TeamMember;
    orgInfo: Organization;
}>();

enum ModalAction {
    Kick = 'Kick',
    NONE = ''
}

const orgRepo = new OrgRepository();

const authStore = useAuthStore();
const userStore = useUserStore();

const centeredModalRef: any = ref(null);
const centeredModalAction: Ref<ModalAction> = ref(ModalAction.NONE);
const centeredModalActionId: Ref<string | undefined> = ref();

async function kickUser() {
    if (authStore.getAuthenticated && authStore.getToken) {
        try {
            const resp = await orgRepo.revokeMembership({
                orgId: props.orgInfo.id,
                userId: props.member.id,
                bearerToken: authStore.getToken,
                handleBusinessErrors: true
            });

            if (resp) successToast('Succesfully kicked the user');
        } catch (err) {
            if (err instanceof BusinessLogicError) {
                if (err.error_code == APIErrors.NotAuthorized) {
                    errorToast(
                        'Failed to kick the user, because you do not have the correct role to be able to kick them.'
                    );
                } else if (err.error_code == APIErrors.CannotRevokeOwnMembership) {
                    errorToast('Failed to kick the user, because you cannot kick yourself.');
                } else if (err.error_code == APIErrors.PersonalOrgCannotBeModified) {
                    errorToast(
                        'Failed to kick the user, because this is a personal organization, and personal organizations cannot be modified.'
                    );
                } else if (err.error_code == APIErrors.NotAMember) {
                    successToast('Succesfully kicked the user');
                } else {
                    errorToast('Failed to kick the user.');
                }
            } else {
                errorToast('Failed to kick the user.');
            }
        } finally {
            emit('refetch');
        }
    }
}

async function performModalAction() {
    try {
        if (centeredModalAction.value == ModalAction.Kick) {
            await kickUser();
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

const emit = defineEmits<{
    (e: 'refetch'): void;
}>();
</script>
<template>
    <tr>
        <td>
            <div class="flex flex-row gap-2 w-fit items-center">
                <div class="user-avatar-wrapper">
                    <div v-if="member.avatar_url">
                        <img class="user-image w-8" :src="member.avatar_url" />
                    </div>
                    <div v-else class="user-avatar user-avatar-inner-wrapper">
                        <Icon class="icon user-icon" icon="solar:smile-circle-broken"></Icon>
                    </div>
                </div>
                <div class="flex flex-col w-8">
                    <div class="member-handle">@{{ member.handle }}</div>
                </div>
            </div>
        </td>
        <td>
            <div>{{ member.email }}</div>
        </td>
        <td>
            <div v-if="member.role == MemberRole.OWNER" class="org-membership membership-owner">
                Owner
            </div>
            <div v-if="member.role == MemberRole.ADMIN" class="org-membership membership-admin">
                Admin
            </div>
            <div
                v-if="member.role == MemberRole.MODERATOR"
                class="org-membership membership-moderator"
            >
                Moderator
            </div>
            <div v-if="member.role == MemberRole.USER" class="org-membership membership-user">
                User
            </div>
        </td>
        <td>
            <div>
                {{ moment(member.joined_on).fromNow() }}
            </div>
        </td>
        <td>
            <div class="flex flex-row gap-2 org-member-list-actions">
                <RouterLink
                    v-if="
                        member.id == userStore.getUser!.id ||
                        isMemberRoleGreaterThan(orgInfo.role, member.role) ||
                        member.added_by == userStore.getUser!.id
                    "
                    :to="{
                        name: 'orgManage',
                        params: { orgId: orgInfo.id, page: 'logs' },
                        query: { search: member.email }
                    }"
                    class="clear-button"
                    title="View the user's audit logs"
                >
                    <div class="flex flex-row gap-1 items-center">
                        <Icon
                            class="icon"
                            icon="ant-design:audit-outlined"
                            style="font-size: 1.2em"
                        ></Icon>
                        <div>View Audit logs</div>
                    </div>
                </RouterLink>
                <Button
                    v-if="
                        member.id != userStore.getUser!.id &&
                        (isMemberRoleGreaterThan(orgInfo.role, member.role) ||
                            member.added_by == userStore.getUser!.id)
                    "
                    variant="destructive"
                    @click="openModalAction(ModalAction.Kick)"
                >
                    <Icon icon="mingcute:user-remove-fill"></Icon>
                    Revoke access
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
                <div v-if="centeredModalAction == ModalAction.Kick">Kick the user?</div>
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
                <div v-if="centeredModalAction == ModalAction.Kick">
                    <div>Are you sure you want to kick the user from the organization?</div>
                    <div>You can always invite them back to the organization.</div>
                </div>
            </div>
        </template>
        <template #buttons>
            <Button
                v-if="centeredModalAction == ModalAction.Kick"
                variant="destructive"
                @click="performModalAction()"
            >
                <Icon icon="mingcute:user-remove-fill"></Icon>Cancel
            </Button>
            <Button
                variant="outline"
                @click="
                    centeredModalActionId = undefined;
                    centeredModalRef.toggle();
                "
            >
                Cancel
            </Button>
        </template>
    </CenteredModal>
</template>

<style scoped lang="scss">
@use '@/assets/colors.scss';

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
    background-color: colors.$accent;
}

.membership-user {
    background-color: #808e64;
}
</style>

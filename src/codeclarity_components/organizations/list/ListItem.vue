<script lang="ts" setup>
import CenteredModal from '@/base_components/CenteredModal.vue';
import { MemberRole } from '@/codeclarity_components/organizations/organization.entity';
import { Icon } from '@iconify/vue';
import moment from 'moment';
import PositionedModal from '@/base_components/PositionedModal.vue';
import { ref, type Ref } from 'vue';
import { OrgRepository } from '@/codeclarity_components/organizations/organization.repository';
import { useAuthStore } from '@/stores/auth';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { APIErrors } from '@/utils/api/ApiErrors';
import { errorToast, successToast } from '@/utils/toasts';
import AlertButton from '@/base_components/buttons/AlertButton.vue';
import NormalButton from '@/base_components/buttons/NormalButton.vue';
import type { OrganizationMembership } from '@/codeclarity_components/organizations/organization_membership.entity';

enum OrgAction {
    DELETE = 'delete',
    LEAVE = 'leave'
}

const authStore = useAuthStore();

const orgActionModalRef: any = ref(null);
const orgAction: Ref<string> = ref('');
const orgActionId: Ref<string> = ref('');
const optionsModalRef: any = ref(null);
const orgRepo: OrgRepository = new OrgRepository();

defineProps<{
    membership: OrganizationMembership;
}>();

const emit = defineEmits<{
    (e: 'refresh'): void;
}>();

async function deleteOrg(orgId: string) {
    if (authStore.getAuthenticated && authStore.getToken) {
        try {
            await orgRepo.delete({
                orgId: orgId,
                bearerToken: authStore.getToken,
                handleBusinessErrors: true
            });
            successToast('Successfully deleted the organization.');
            emit('refresh');
        } catch (err) {
            if (err instanceof BusinessLogicError) {
                if (err.error_code == APIErrors.EntityNotFound) {
                    emit('refresh');
                } else if (err.error_code == APIErrors.PersonalOrgCannotBeModified) {
                    errorToast(`You cannot delete a personal organization.`);
                } else {
                    errorToast(`Failed to delete the organization.`);
                }
            } else {
                errorToast(`Failed to delete the organization.`);
            }
        }
    }
}

async function leaveOrg(orgId: string) {
    if (authStore.getAuthenticated && authStore.getToken) {
        try {
            await orgRepo.leave({
                orgId: orgId,
                bearerToken: authStore.getToken,
                handleBusinessErrors: true
            });
            successToast('Successfully left the organization.');
            emit('refresh');
        } catch (err) {
            if (err instanceof BusinessLogicError) {
                if (err.error_code == APIErrors.EntityNotFound) {
                    emit('refresh');
                } else if (err.error_code == APIErrors.PersonalOrgCannotBeModified) {
                    errorToast(`You cannot leave a personal organization.`);
                } else if (err.error_code == APIErrors.CannotLeaveAsLastOwner) {
                    errorToast(
                        `You cannot leave as the last owner of this organization. Instead delete the organization.`
                    );
                } else {
                    errorToast(`Failed to leave the organization.`);
                }
            }
        }
    }
}

function performOrgAction() {
    if (orgAction.value == OrgAction.DELETE) {
        deleteOrg(orgActionId.value);
    } else if (orgAction.value == OrgAction.LEAVE) {
        leaveOrg(orgActionId.value);
    }
}
</script>
<template>
    <div
        class="flex flex-col gap-8 h-auto justify-between border border-gray-200 no-underline text-gray-600 bg-white rounded-lg p-5 w-fit flex-grow"
    >
        <div class="flex flex-row gap-3 items-center mb-2 w-full">
            <div class="flex flex-col w-full">
                <div class="flex flex-row gap-1 justify-between w-full">
                    <div>
                        <div class="flex flex-row gap-2 items-center flex-wrap w-full">
                            <div class="truncate text-wrap max-w-64 text-3xl font-medium">
                                {{ membership.organization.name }}
                            </div>
                            <div>
                                <div
                                    class="rounded-2xl px-2 py-1 bg-yellow text-white w-fit font-black text-sm"
                                    v-if="membership.organization.role == MemberRole.OWNER"
                                >
                                    Owner
                                </div>
                                <div
                                    class="rounded-2xl px-2 py-1 bg-red text-white w-fit font-black text-sm"
                                    v-if="membership.organization.role == MemberRole.ADMIN"
                                >
                                    Admin
                                </div>
                                <div
                                    class="rounded-2xl px-2 py-1 bg-primary text-white w-fit font-black text-sm"
                                    v-if="membership.organization.role == MemberRole.MODERATOR"
                                >
                                    Moderator
                                </div>
                                <div
                                    class="rounded-2xl px-2 py-1 bg-green text-white w-fit font-black text-sm"
                                    v-if="membership.organization.role == MemberRole.USER"
                                >
                                    User
                                </div>
                            </div>
                            <div
                                v-if="membership.organization.personal"
                                class="rounded-2xl px-2 py-1 bg-primary text-white w-fit font-black text-sm"
                                title="A personal organization is a private org to which only you have access. Other people cannot be invited to join this type of organziation."
                            >
                                Personal Org
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-row gap-1 w-fit items-center">
                        <div class="flex flex-row gap-1 w-fit items-center">
                            <div class="flex flex-col items-end w-full">
                                <div class="text-yellow font-black">Owner</div>
                                <div v-if="membership.organization.created_by">
                                    @{{ membership.organization.created_by.handle }}
                                </div>
                                <div v-if="!membership.organization.created_by">Deleted user</div>
                            </div>
                            <div>
                                <div v-if="membership.organization.created_by">
                                    <div v-if="membership.organization.created_by.avatar_url">
                                        <!-- <Icon class="icon crown" icon="solar:crown-bold"></Icon> -->
                                        <img
                                            class="rounded-full w-9"
                                            :src="membership.organization.created_by.avatar_url"
                                        />
                                    </div>
                                    <div
                                        v-if="!membership.organization.created_by.avatar_url"
                                        class="bg-gray-500 rounded-full w-9 h-9 flex flex-row items-center justify-center"
                                    >
                                        <!-- <Icon class="icon crown" icon="solar:crown-bold"></Icon> -->
                                        <Icon
                                            class="text-white text-2xl"
                                            icon="solar:smile-circle-broken"
                                        ></Icon>
                                    </div>
                                </div>
                                <div v-else>
                                    <div
                                        class="bg-gray-500 rounded-full w-9 h-9 flex flex-row items-center justify-center"
                                    >
                                        <!-- <Icon class="icon crown" icon="solar:crown-bold"></Icon> -->
                                        <Icon
                                            class="text-white text-2xl"
                                            icon="solar:confounded-square-outline"
                                        ></Icon>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- <div>
                        Joined on: {{ moment(org.member_ship.joined_on).format('LL') }}
                    </div> -->
                </div>
            </div>
        </div>
        <div class="flex flex-col gap-5">
            <div class="flex flex-col gap-1" style="font-weight: 400">
                <div>Joined on {{ moment(membership.organization.joined_on).format('LL') }}</div>
                <div class="flex flex-row gap-2">
                    Number of members:
                    <span
                        class="px-1 py-3.5 rounded-lg text-sm font-medium text-gray-700"
                        style="
                            padding: 3px 12px;
                            background-color: rgb(240, 240, 240);
                            border-radius: 15px;
                            font-size: 0.8em;
                        "
                        >{{ membership.organization.organizationMemberships.length }}</span
                    >
                </div>
                <div>
                    {{ membership.organization.description }}
                </div>
            </div>
            <div class="flex flex-row gap-2 items-center w-full">
                <!-- <template v-if="org.role == MemberRole.USER">
                    <RouterLink :to="{ name: 'orgs' }" class="clear-button" style="flex-grow: 1;text-align: center;">
                        View members
                    </RouterLink>
                </template> -->
                <RouterLink
                    :to="{
                        name: 'orgs',
                        params: {
                            action: 'manage',
                            page: 'main',
                            orgId: membership.organization.id
                        }
                    }"
                    class="flex-grow text-center border-0 bg-gray-200 cursor-pointer -ml-0.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-300 hover:text-gray-900"
                >
                    Manage organization
                </RouterLink>
                <div v-if="!membership.organization.personal">
                    <div
                        :id="'dot-menu-' + membership.organization.id"
                        class="no-underline border-0 bg-gray-200 cursor-pointer -ml-0.5 p-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-300 hover:text-gray-900"
                        @click="optionsModalRef.toggle()"
                    >
                        <Icon icon="bi:three-dots-vertical" />
                    </div>
                    <PositionedModal
                        ref="optionsModalRef"
                        :tracker="'dot-menu-' + membership.organization.id"
                        :position="'top-left'"
                        :show-title-divider="false"
                        :show-title="false"
                        :show-sub-title="false"
                        :padding="false"
                        :margin-target="5"
                    >
                        <template #content>
                            <div
                                class="max-h-96 overflow-y-auto flex flex-col text-sm font- whitespace-nowrap p-1"
                            >
                                <a
                                    class="no-underline flex flex-row gap-2 items-center p-2 hover:bg-gray-200 rounded"
                                    title="Leave organization"
                                    @click="
                                        orgActionId = membership.organization.id;
                                        orgAction = OrgAction.LEAVE;
                                        optionsModalRef.toggle();
                                        orgActionModalRef.toggle();
                                    "
                                >
                                    <Icon class="text-xl" icon="mingcute:exit-door-line"></Icon>
                                    Leave org
                                </a>
                                <div
                                    class="no-underline flex flex-row gap-2 items-center p-2 hover:bg-gray-200 rounded"
                                    title="Delete organization"
                                    @click="
                                        orgActionId = membership.organization.id;
                                        orgAction = OrgAction.DELETE;
                                        optionsModalRef.toggle();
                                        orgActionModalRef.toggle();
                                    "
                                >
                                    <Icon class="text-xl" icon="solar:trash-bin-trash-bold"></Icon>
                                    Delete org
                                </div>
                            </div>
                        </template>
                    </PositionedModal>
                </div>
            </div>
        </div>
    </div>
    <CenteredModal ref="orgActionModalRef">
        <template #title>
            <div class="flex flex-row gap-2 items-center justify-between">
                <div v-if="orgAction == OrgAction.DELETE">Delete the organization?</div>
                <div v-if="orgAction == OrgAction.LEAVE">Leave the organization?</div>
            </div>
        </template>
        <template #content>
            <div class="flex flex-col gap-6 max-w-96 w-screen">
                <div v-if="orgAction == OrgAction.DELETE">
                    Are you sure you want to delete the organization?
                </div>
                <div v-if="orgAction == OrgAction.LEAVE">
                    Are you sure you want to leave the organization?
                </div>
                <div class="mt-2" v-if="orgAction == OrgAction.DELETE">
                    <div class="flex flex-row gap-2 items-center">
                        <div>
                            <Icon class="text-2xl" icon="solar:danger-triangle-bold-duotone"></Icon>
                        </div>
                        <div>This action is permanent and cannot be reverted.</div>
                    </div>
                </div>
            </div>
        </template>
        <template #buttons>
            <Button
                variant="destructive"
                @click="
                    performOrgAction();
                    orgActionModalRef.toggle();
                "
            >
                <template v-if="orgAction == OrgAction.DELETE" #icon>
                    <Icon class="icon" icon="solar:trash-bin-trash-bold"></Icon>
                </template>
                <template v-else-if="orgAction == OrgAction.LEAVE" #icon>
                    <Icon class="icon" icon="mingcute:exit-door-line"></Icon>
                </template>
                <template v-if="orgAction == OrgAction.DELETE" #text> Delete </template>
                <template v-else-if="orgAction == OrgAction.LEAVE" #text> Leave </template>
            </Button>
            <Button
                @click="
                    orgActionId = '';
                    orgActionModalRef.toggle();
                "
            >
                <template #text> Cancel </template>
            </Button>
        </template>
    </CenteredModal>
</template>

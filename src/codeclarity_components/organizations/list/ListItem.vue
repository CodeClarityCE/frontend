<script lang="ts" setup>
import CenteredModal from '@/base_components/ui/modals/CenteredModal.vue';
import { MemberRole } from '@/codeclarity_components/organizations/organization.entity';
import { OrgRepository } from '@/codeclarity_components/organizations/organization.repository';
import type { OrganizationMembership } from '@/codeclarity_components/organizations/organization_membership.entity';
import { Popover, PopoverContent, PopoverTrigger } from '@/shadcn/ui/popover';
import { useAuthStore } from '@/stores/auth';
import { APIErrors } from '@/utils/api/ApiErrors';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { formatDate } from '@/utils/dateUtils';
import { errorToast, successToast } from '@/utils/toasts';
import { Icon } from '@iconify/vue';
import { ref, type Ref } from 'vue';

enum OrgAction {
    DELETE = 'delete',
    LEAVE = 'leave'
}

const authStore = useAuthStore();

const orgActionModalRef = ref<{ toggle: () => void } | null>(null);
const orgAction: Ref<OrgAction | ''> = ref('');
const orgActionId: Ref<string> = ref('');
const orgRepo: OrgRepository = new OrgRepository();

defineProps<{
    membership: OrganizationMembership;
}>();

const emit = defineEmits<(e: 'refresh') => void>();

async function deleteOrg(orgId: string): Promise<void> {
    if (authStore.getAuthenticated && authStore.getToken) {
        try {
            await orgRepo.delete({
                orgId: orgId,
                bearerToken: authStore.getToken,
                handleBusinessErrors: true
            });
            successToast('Successfully deleted the organization.');
            void emit('refresh');
        } catch (err) {
            if (err instanceof BusinessLogicError) {
                if ((err.error_code as APIErrors) === APIErrors.EntityNotFound) {
                    void emit('refresh');
                } else if (
                    (err.error_code as APIErrors) === APIErrors.PersonalOrgCannotBeModified
                ) {
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

async function leaveOrg(orgId: string): Promise<void> {
    if (authStore.getAuthenticated && authStore.getToken) {
        try {
            await orgRepo.leave({
                orgId: orgId,
                bearerToken: authStore.getToken,
                handleBusinessErrors: true
            });
            void successToast('Successfully left the organization.');
            void emit('refresh');
        } catch (err) {
            if (err instanceof BusinessLogicError) {
                if ((err.error_code as APIErrors) === APIErrors.EntityNotFound) {
                    void emit('refresh');
                } else if (
                    (err.error_code as APIErrors) === APIErrors.PersonalOrgCannotBeModified
                ) {
                    void errorToast(`You cannot leave a personal organization.`);
                } else if ((err.error_code as APIErrors) === APIErrors.CannotLeaveAsLastOwner) {
                    errorToast(
                        `You cannot leave as the last owner of this organization. Instead delete the organization.`
                    );
                } else {
                    void errorToast(`Failed to leave the organization.`);
                }
            }
        }
    }
}

function performOrgAction(): void {
    if (orgAction.value === OrgAction.DELETE) {
        void deleteOrg(orgActionId.value);
    } else if (orgAction.value === OrgAction.LEAVE) {
        void leaveOrg(orgActionId.value);
    }
}
</script>
<template>
    <div
        class="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-6 h-full flex flex-col hover:border-theme-primary/30"
    >
        <!-- Organization Header -->
        <div class="flex items-start justify-between mb-4">
            <div class="flex-1 min-w-0">
                <h3 class="text-lg font-bold text-theme-black truncate mb-2">
                    {{ membership.organization.name }}
                </h3>

                <!-- Role and Personal Badges -->
                <div class="flex items-center gap-2 flex-wrap mb-3">
                    <span
                        v-if="membership.organization.role === MemberRole.OWNER"
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-theme-primary bg-theme-primary/10 rounded border border-theme-primary/20"
                    >
                        <Icon icon="solar:crown-bold" class="text-xs" />
                        Owner
                    </span>
                    <span
                        v-else-if="membership.organization.role === MemberRole.ADMIN"
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-theme-black bg-theme-black/10 rounded border border-theme-black/20"
                    >
                        <Icon icon="solar:shield-check-bold" class="text-xs" />
                        Admin
                    </span>
                    <span
                        v-else-if="membership.organization.role === MemberRole.MODERATOR"
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-theme-primary bg-theme-primary/10 rounded border border-theme-primary/20"
                    >
                        <Icon icon="solar:star-bold" class="text-xs" />
                        Moderator
                    </span>
                    <span
                        v-else-if="membership.organization.role === MemberRole.USER"
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-theme-primary bg-theme-primary/10 rounded border border-theme-primary/20"
                    >
                        <Icon icon="solar:user-bold" class="text-xs" />
                        User
                    </span>

                    <span
                        v-if="membership.organization.personal"
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-theme-black bg-theme-black/10 rounded border border-theme-black/20"
                        title="A personal organization is a private org to which only you have access."
                    >
                        <Icon icon="solar:lock-bold" class="text-xs" />
                        Personal
                    </span>
                </div>

                <!-- Description -->
                <p class="text-theme-gray text-sm line-clamp-2">
                    {{ membership.organization.description ?? 'No description provided.' }}
                </p>
            </div>

            <!-- Action Menu -->
            <div v-if="!membership.organization.personal">
                <Popover>
                    <PopoverTrigger as-child>
                        <button class="p-1 hover:bg-gray-100 rounded transition-colors">
                            <Icon icon="solar:menu-dots-bold" class="text-theme-gray text-lg" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent class="w-48 p-2">
                        <div class="flex flex-col gap-1">
                            <button
                                class="flex items-center gap-3 px-3 py-2 text-sm text-theme-gray hover:bg-gray-100 rounded transition-colors duration-150"
                                @click="
                                    orgActionId = membership.organization.id;
                                    orgAction = OrgAction.LEAVE;
                                    orgActionModalRef?.toggle();
                                "
                            >
                                <Icon icon="solar:exit-bold" class="text-orange-600" />
                                Leave
                            </button>
                            <button
                                v-if="membership.organization.role === MemberRole.OWNER"
                                class="flex items-center gap-3 px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded transition-colors duration-150"
                                @click="
                                    orgActionId = membership.organization.id;
                                    orgAction = OrgAction.DELETE;
                                    orgActionModalRef?.toggle();
                                "
                            >
                                <Icon icon="solar:trash-bin-trash-bold" class="text-red-600" />
                                Delete
                            </button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-2 gap-3 mb-4">
            <!-- Members Count -->
            <div
                class="bg-theme-primary/5 border border-theme-primary/20 rounded-lg p-3 text-center"
            >
                <div class="flex items-center justify-center mb-1">
                    <Icon
                        icon="solar:users-group-rounded-bold"
                        class="text-theme-primary text-xl"
                    />
                </div>
                <div class="text-lg font-bold text-theme-black">
                    {{ membership.organization.organizationMemberships.length }}
                </div>
                <div class="text-xs text-theme-primary font-medium">
                    Member{{
                        membership.organization.organizationMemberships.length !== 1 ? 's' : ''
                    }}
                </div>
            </div>

            <!-- Join Date -->
            <div class="bg-theme-black/5 border border-theme-black/20 rounded-lg p-3 text-center">
                <div class="flex items-center justify-center mb-1">
                    <Icon icon="solar:calendar-bold" class="text-theme-black text-xl" />
                </div>
                <div class="text-sm font-bold text-theme-black">
                    {{ formatDate(membership.organization.joined_on, 'MMM') }}
                </div>
                <div class="text-lg font-bold text-theme-black">
                    {{ formatDate(membership.organization.joined_on, 'DD') }}
                </div>
                <div class="text-xs text-theme-gray font-medium">
                    {{ formatDate(membership.organization.joined_on, 'YYYY') }}
                </div>
            </div>
        </div>

        <!-- Owner Info -->
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <div class="flex items-center gap-2">
                <div class="relative">
                    <img
                        v-if="membership.organization.created_by?.avatar_url"
                        class="w-8 h-8 rounded-full object-cover"
                        :src="membership.organization.created_by.avatar_url"
                        :alt="membership.organization.created_by?.handle || 'User avatar'"
                    />
                    <div
                        v-else
                        class="w-8 h-8 bg-theme-gray rounded-full flex items-center justify-center"
                    >
                        <Icon
                            :icon="
                                membership.organization.created_by
                                    ? 'solar:user-bold'
                                    : 'solar:user-cross-bold'
                            "
                            class="text-white text-sm"
                        />
                    </div>
                    <div
                        class="absolute -top-1 -right-1 w-3 h-3 bg-theme-primary rounded-full flex items-center justify-center"
                    >
                        <Icon icon="solar:crown-bold" class="text-white text-xs" />
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="text-xs text-theme-gray font-medium">Owner</div>
                    <div class="text-sm font-medium text-theme-black truncate">
                        {{
                            membership.organization.created_by
                                ? `@${membership.organization.created_by.handle}`
                                : 'Deleted user'
                        }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Action Button -->
        <div class="mt-auto">
            <RouterLink
                :to="{
                    name: 'orgs',
                    params: {
                        action: 'manage',
                        page: 'main',
                        orgId: membership.organization.id
                    }
                }"
                class="block"
            >
                <button
                    class="w-full bg-theme-primary hover:bg-theme-primary-dark text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                    <Icon icon="solar:settings-bold-duotone" class="text-lg" />
                    <span>Manage</span>
                </button>
            </RouterLink>
        </div>
    </div>

    <!-- Action Confirmation Modal -->
    <CenteredModal ref="orgActionModalRef">
        <template #title>
            <div class="flex items-center gap-3">
                <div
                    v-if="orgAction === OrgAction.DELETE"
                    class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center"
                >
                    <Icon icon="solar:trash-bin-trash-bold" class="text-red-600" />
                </div>
                <div
                    v-if="orgAction === OrgAction.LEAVE"
                    class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center"
                >
                    <Icon icon="solar:exit-bold" class="text-orange-600" />
                </div>
                <div>
                    <h3 class="text-lg font-bold text-theme-black">
                        {{
                            orgAction === OrgAction.DELETE
                                ? 'Delete Organization'
                                : 'Leave Organization'
                        }}
                    </h3>
                </div>
            </div>
        </template>
        <template #content>
            <div class="space-y-3">
                <p class="text-theme-gray">
                    <span v-if="orgAction === OrgAction.DELETE">
                        Are you sure you want to permanently delete this organization?
                    </span>
                    <span v-if="orgAction === OrgAction.LEAVE">
                        Are you sure you want to leave this organization?
                    </span>
                </p>

                <div
                    v-if="orgAction === OrgAction.DELETE"
                    class="bg-red-50 border border-red-200 rounded-lg p-3"
                >
                    <div class="flex items-center gap-2">
                        <Icon icon="solar:danger-triangle-bold" class="text-red-600" />
                        <span class="text-sm text-red-800 font-medium"
                            >This action cannot be undone.</span
                        >
                    </div>
                </div>
            </div>
        </template>
        <template #buttons>
            <button
                class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded transition-colors"
                @click="
                    void performOrgAction();
                    orgActionModalRef?.toggle();
                "
            >
                {{ orgAction === OrgAction.DELETE ? 'Delete' : 'Leave' }}
            </button>
            <button
                class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded transition-colors"
                @click="
                    orgActionId = '';
                    orgActionModalRef?.toggle();
                "
            >
                Cancel
            </button>
        </template>
    </CenteredModal>
</template>

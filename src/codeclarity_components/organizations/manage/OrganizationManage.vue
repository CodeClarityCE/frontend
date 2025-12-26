<script lang="ts" setup>
import InfoCard from '@/base_components/ui/cards/InfoCard.vue';
import CenteredModal from '@/base_components/ui/modals/CenteredModal.vue';
import {
    MemberRole,
    type Organization
} from '@/codeclarity_components/organizations/organization.entity';
import { OrgRepository } from '@/codeclarity_components/organizations/organization.repository';
import HeaderItem from '@/codeclarity_components/organizations/subcomponents/HeaderItem.vue';
import router from '@/router';
import Button from '@/shadcn/ui/button/Button.vue';
import { Switch } from '@/shadcn/ui/switch';
import { useAuthStore } from '@/stores/auth';
import { APIErrors } from '@/utils/api/ApiErrors';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { errorToast, successToast } from '@/utils/toasts';
import { Icon } from '@iconify/vue';
import { ref, type Ref, watch } from 'vue';

const authStore = useAuthStore();

const orgRepo: OrgRepository = new OrgRepository();

const orgInfo: Ref<Organization | undefined> = ref();
const orgActionModalRef = ref<{ toggle: () => void } | null>(null);
const orgAction: Ref<OrgAction | ''> = ref('');
const orgActionId: Ref<string> = ref('');

defineProps<{
    page: string;
    orgId: string;
}>();

enum OrgAction {
    DELETE = 'delete',
    LEAVE = 'leave'
}

function performOrgAction(): void {
    if (orgAction.value === OrgAction.DELETE) {
        void deleteOrg(orgActionId.value);
    } else if (orgAction.value === OrgAction.LEAVE) {
        void leaveOrg(orgActionId.value);
    }
}

async function deleteOrg(orgId: string): Promise<void> {
    if (authStore.getAuthenticated && authStore.getToken) {
        try {
            await orgRepo.delete({
                orgId: orgId,
                bearerToken: authStore.getToken,
                handleBusinessErrors: true
            });
            successToast('Successfully deleted the organization.');
            void router.push({ name: 'orgs', params: { page: 'list' } });
        } catch (err) {
            if (err instanceof BusinessLogicError) {
                if (err.error_code === APIErrors.EntityNotFound) {
                    void router.push({ name: 'orgs', params: { page: 'list' } });
                } else if (err.error_code === APIErrors.PersonalOrgCannotBeModified) {
                    errorToast(`You cannot delete a personal organization.`);
                } else {
                    errorToast(`Failed to delete the organization.`);
                }
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
            void router.push({ name: 'orgs', params: { page: 'list' } });
        } catch (err) {
            if (err instanceof BusinessLogicError) {
                if (err.error_code === APIErrors.EntityNotFound) {
                    void router.push({ name: 'orgs', params: { page: 'list' } });
                } else if (err.error_code === APIErrors.PersonalOrgCannotBeModified) {
                    void errorToast(`You cannot leave a personal organization.`);
                } else if (err.error_code === APIErrors.CannotLeaveAsLastOwner) {
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

function setOrgInfo(_orgInfo: Organization): void {
    orgInfo.value = _orgInfo;
    autoResolveTickets.value = _orgInfo.auto_resolve_tickets ?? false;
}

// Settings state
const autoResolveTickets: Ref<boolean> = ref(false);
const savingSettings: Ref<boolean> = ref(false);

// Watch for settings changes
watch(autoResolveTickets, async (newValue) => {
    if (!orgInfo.value || savingSettings.value) return;
    await updateAutoResolveSetting(newValue);
});

async function updateAutoResolveSetting(enabled: boolean): Promise<void> {
    if (!authStore.getAuthenticated || !authStore.getToken || !orgInfo.value) return;

    savingSettings.value = true;
    try {
        await orgRepo.updateSettings({
            orgId: orgInfo.value.id,
            bearerToken: authStore.getToken,
            data: { auto_resolve_tickets: enabled },
            handleBusinessErrors: true
        });
        void successToast(
            enabled ? 'Auto-resolve tickets enabled' : 'Auto-resolve tickets disabled'
        );
    } catch (err) {
        // Revert on error
        autoResolveTickets.value = !enabled;
        if (err instanceof BusinessLogicError) {
            if (err.error_code === APIErrors.NotAuthorized) {
                void errorToast('You do not have permission to change this setting.');
            } else {
                void errorToast('Failed to update settings.');
            }
        }
    } finally {
        savingSettings.value = false;
    }
}
</script>
<template>
    <div class="space-y-6">
        <HeaderItem v-if="orgId" :org-id="orgId" @on-org-info="setOrgInfo($event)"></HeaderItem>

        <div v-if="orgInfo" class="space-y-6">
            <!-- Quick Actions Card -->
            <InfoCard
                title="Organization Management"
                description="Manage your organization settings, members, and policies from one central location"
                icon="solar:settings-bold-duotone"
                variant="primary"
            >
                <div class="mt-6">
                    <!-- Management Actions Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Integration Management -->
                        <RouterLink
                            v-if="
                                orgInfo.role === MemberRole.OWNER ||
                                orgInfo.role === MemberRole.ADMIN
                            "
                            :to="{
                                name: 'orgs',
                                params: { action: 'manage', orgId: orgId, page: 'integrations' }
                            }"
                            class="group flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-theme-primary hover:shadow-md transition-all duration-200 hover:bg-theme-primary/5"
                        >
                            <div class="p-3 bg-theme-primary/10 rounded-lg">
                                <Icon
                                    icon="solar:widget-add-bold-duotone"
                                    class="text-xl text-theme-primary"
                                />
                            </div>
                            <div class="flex-1">
                                <h3 class="font-semibold text-theme-black mb-1">
                                    Manage organization integrations
                                </h3>
                                <p class="text-sm text-theme-gray">
                                    Connect external services like GitHub and GitLab
                                </p>
                            </div>
                        </RouterLink>

                        <!-- Policy Management -->
                        <RouterLink
                            :to="{
                                name: 'orgs',
                                params: { action: 'manage', orgId: orgId, page: 'policies' }
                            }"
                            class="group flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-theme-primary hover:shadow-md transition-all duration-200 hover:bg-theme-primary/5"
                        >
                            <div class="p-3 bg-theme-black/10 rounded-lg">
                                <Icon
                                    icon="solar:document-text-bold-duotone"
                                    class="text-xl text-theme-black"
                                />
                            </div>
                            <div class="flex-1">
                                <h3 class="font-semibold text-theme-black mb-1">
                                    Manage organization policies
                                </h3>
                                <p class="text-sm text-theme-gray">
                                    Define analyzer behaviors and rules
                                </p>
                            </div>
                        </RouterLink>

                        <!-- Member Management -->
                        <RouterLink
                            v-if="
                                !orgInfo.personal &&
                                (orgInfo.role === MemberRole.OWNER ||
                                    orgInfo.role === MemberRole.ADMIN ||
                                    orgInfo.role === MemberRole.MODERATOR)
                            "
                            :to="{
                                name: 'orgs',
                                params: { action: 'manage', orgId: orgId, page: 'members' }
                            }"
                            class="group flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-theme-primary hover:shadow-md transition-all duration-200 hover:bg-theme-primary/5"
                        >
                            <div class="p-3 bg-theme-primary/10 rounded-lg">
                                <Icon
                                    icon="solar:users-group-rounded-bold-duotone"
                                    class="text-xl text-theme-primary"
                                />
                            </div>
                            <div class="flex-1">
                                <h3 class="font-semibold text-theme-black mb-1">
                                    Manage organization members
                                </h3>
                                <p class="text-sm text-theme-gray">
                                    Manage organization team members
                                </p>
                            </div>
                        </RouterLink>

                        <!-- Invite Management -->
                        <RouterLink
                            v-if="
                                !orgInfo.personal &&
                                (orgInfo.role === MemberRole.OWNER ||
                                    orgInfo.role === MemberRole.ADMIN ||
                                    orgInfo.role === MemberRole.MODERATOR)
                            "
                            :to="{
                                name: 'orgs',
                                params: { action: 'manage', orgId: orgId, page: 'invites' }
                            }"
                            class="group flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-theme-primary hover:shadow-md transition-all duration-200 hover:bg-theme-primary/5"
                        >
                            <div class="p-3 bg-theme-black/10 rounded-lg">
                                <Icon
                                    icon="solar:mailbox-bold-duotone"
                                    class="text-xl text-theme-black"
                                />
                            </div>
                            <div class="flex-1">
                                <h3 class="font-semibold text-theme-black mb-1">
                                    Manage organization invites
                                </h3>
                                <p class="text-sm text-theme-gray">
                                    Send and manage member invites
                                </p>
                            </div>
                        </RouterLink>

                        <!-- Audit Logs -->
                        <RouterLink
                            :to="{
                                name: 'orgs',
                                params: { action: 'manage', orgId: orgId, page: 'logs' }
                            }"
                            class="group flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-theme-primary hover:shadow-md transition-all duration-200 hover:bg-theme-primary/5"
                        >
                            <div class="p-3 bg-theme-primary/10 rounded-lg">
                                <Icon
                                    icon="solar:file-text-bold-duotone"
                                    class="text-xl text-theme-primary"
                                />
                            </div>
                            <div class="flex-1">
                                <h3 class="font-semibold text-theme-black mb-1">
                                    View organization audit logs
                                </h3>
                                <p class="text-sm text-theme-gray">
                                    View organization activity history
                                </p>
                            </div>
                        </RouterLink>

                        <!-- Analyzer Management -->
                        <RouterLink
                            v-if="
                                orgInfo.role === MemberRole.OWNER ||
                                orgInfo.role === MemberRole.ADMIN
                            "
                            :to="{
                                name: 'orgs',
                                params: { action: 'manage', orgId: orgId, page: 'analyzers' }
                            }"
                            class="group flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-theme-primary hover:shadow-md transition-all duration-200 hover:bg-theme-primary/5"
                        >
                            <div class="p-3 bg-theme-black/10 rounded-lg">
                                <Icon
                                    icon="solar:chart-2-bold-duotone"
                                    class="text-xl text-theme-black"
                                />
                            </div>
                            <div class="flex-1">
                                <h3 class="font-semibold text-theme-black mb-1">
                                    Manage analyzers
                                </h3>
                                <p class="text-sm text-theme-gray">
                                    Configure analysis tools and settings
                                </p>
                            </div>
                        </RouterLink>
                    </div>
                </div>
            </InfoCard>

            <!-- Ticket Settings Card -->
            <InfoCard
                v-if="orgInfo.role === MemberRole.OWNER || orgInfo.role === MemberRole.ADMIN"
                title="Ticket Settings"
                description="Configure automatic ticket management behavior"
                icon="solar:ticket-bold-duotone"
                variant="default"
            >
                <div class="mt-6">
                    <div
                        class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                        <div class="flex items-center gap-4">
                            <div class="p-3 bg-theme-primary/10 rounded-lg">
                                <Icon
                                    icon="solar:refresh-circle-bold-duotone"
                                    class="text-xl text-theme-primary"
                                />
                            </div>
                            <div>
                                <h3 class="font-semibold text-theme-black mb-1">
                                    Auto-resolve tickets
                                </h3>
                                <p class="text-sm text-theme-gray">
                                    Automatically resolve tickets when their vulnerabilities are no
                                    longer detected in scans
                                </p>
                            </div>
                        </div>
                        <Switch
                            :checked="autoResolveTickets"
                            :disabled="savingSettings"
                            @update:checked="autoResolveTickets = $event"
                        />
                    </div>
                </div>
            </InfoCard>

            <!-- Danger Zone -->
            <InfoCard
                v-if="!orgInfo.personal"
                title="Danger Zone"
                description="Actions that can permanently affect your organization"
                icon="solar:danger-triangle-bold-duotone"
                variant="danger"
            >
                <div class="mt-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Leave Organization -->
                        <div
                            class="flex items-center gap-4 p-4 border border-red-200 rounded-lg cursor-pointer hover:border-red-300 hover:shadow-md transition-all duration-200 bg-red-50"
                            @click="
                                orgActionId = orgId;
                                orgAction = OrgAction.LEAVE;
                                orgActionModalRef?.toggle();
                            "
                        >
                            <div class="p-2 bg-red-100 rounded-lg">
                                <Icon icon="solar:exit-bold" class="text-xl text-red-600" />
                            </div>
                            <div class="flex-1">
                                <h4 class="font-semibold text-red-800">Leave the organization</h4>
                                <p class="text-sm text-red-600">
                                    Remove yourself from this organization
                                </p>
                            </div>
                        </div>

                        <!-- Delete Organization -->
                        <div
                            v-if="orgInfo.role === MemberRole.OWNER"
                            class="flex items-center gap-4 p-4 border border-red-300 rounded-lg cursor-pointer hover:border-red-400 hover:shadow-md transition-all duration-200 bg-red-100"
                            @click="
                                orgActionId = orgId;
                                orgAction = OrgAction.DELETE;
                                orgActionModalRef?.toggle();
                            "
                        >
                            <div class="p-2 bg-red-200 rounded-lg">
                                <Icon
                                    icon="solar:trash-bin-trash-bold"
                                    class="text-xl text-red-700"
                                />
                            </div>
                            <div class="flex-1">
                                <h4 class="font-semibold text-red-800">Delete the organization</h4>
                                <p class="text-sm text-red-600">
                                    Permanently remove this organization
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </InfoCard>

            <!-- FAQ Section -->
            <InfoCard
                title="Frequently Asked Questions"
                description="Common questions about organizations"
                icon="solar:question-circle-bold-duotone"
                variant="default"
            >
                <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-4">
                        <div class="flex items-start gap-3">
                            <div
                                class="w-8 h-8 bg-theme-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                            >
                                <Icon
                                    icon="solar:user-bold-duotone"
                                    class="text-sm text-theme-primary"
                                />
                            </div>
                            <div>
                                <h3 class="font-semibold text-theme-black mb-1">
                                    What is a personal organization?
                                </h3>
                                <p class="text-sm text-theme-gray">
                                    A personal organization is created automatically for you upon
                                    registration. This organization is private, and you cannot
                                    invite other users to it.
                                </p>
                            </div>
                        </div>

                        <div class="flex items-start gap-3">
                            <div
                                class="w-8 h-8 bg-theme-black/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                            >
                                <Icon
                                    icon="solar:widget-add-bold-duotone"
                                    class="text-sm text-theme-black"
                                />
                            </div>
                            <div>
                                <h3 class="font-semibold text-theme-black mb-1">
                                    What are integrations?
                                </h3>
                                <p class="text-sm text-theme-gray">
                                    An integration is a 'connection' to one of our offered external
                                    services. For now, you can add integrations with GitLab and
                                    GitHub.
                                </p>
                            </div>
                        </div>

                        <div class="flex items-start gap-3">
                            <div
                                class="w-8 h-8 bg-theme-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                            >
                                <Icon
                                    icon="solar:document-text-bold-duotone"
                                    class="text-sm text-theme-primary"
                                />
                            </div>
                            <div>
                                <h3 class="font-semibold text-theme-black mb-1">
                                    What are policies?
                                </h3>
                                <p class="text-sm text-theme-gray">
                                    A policy is a 'document' in which you can define certain
                                    behaviors of our analyzers to customize how your code is
                                    analyzed.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div class="flex items-start gap-3">
                            <div
                                class="w-8 h-8 bg-theme-black/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                            >
                                <Icon
                                    icon="solar:user-plus-bold-duotone"
                                    class="text-sm text-theme-black"
                                />
                            </div>
                            <div>
                                <h3 class="font-semibold text-theme-black mb-1">
                                    Can I add users to an organization?
                                </h3>
                                <p class="text-sm text-theme-gray">
                                    Yes, you can. The only exception being personal organizations.
                                    To add a user to your organization, you can invite them.
                                </p>
                            </div>
                        </div>

                        <div class="flex items-start gap-3">
                            <div
                                class="w-8 h-8 bg-theme-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                            >
                                <Icon
                                    icon="solar:letter-undo-bold-duotone"
                                    class="text-sm text-theme-primary"
                                />
                            </div>
                            <div>
                                <h3 class="font-semibold text-theme-black mb-1">
                                    Can I revoke an invitation?
                                </h3>
                                <p class="text-sm text-theme-gray">
                                    Yes, you can. Simply click the 'revoke' button in the
                                    invitations overview to cancel pending invitations.
                                </p>
                            </div>
                        </div>

                        <div class="flex items-start gap-3">
                            <div
                                class="w-8 h-8 bg-theme-black/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                            >
                                <Icon
                                    icon="solar:clock-circle-bold-duotone"
                                    class="text-sm text-theme-black"
                                />
                            </div>
                            <div>
                                <h3 class="font-semibold text-theme-black mb-1">
                                    How long until organization invites expire?
                                </h3>
                                <p class="text-sm text-theme-gray">
                                    An organization invite expires after three days for security
                                    reasons. You can always resend the invitation email.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </InfoCard>

            <!-- Help Section -->
            <InfoCard
                title="Still need help?"
                description="If you're experiencing issues not covered above, our support team is here to help"
                icon="solar:question-circle-bold-duotone"
                variant="default"
            >
                <template #actions>
                    <Button
                        variant="outline"
                        class="border-theme-primary text-theme-primary hover:bg-theme-primary/10"
                    >
                        Contact Support
                    </Button>
                </template>
            </InfoCard>
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

<style scoped lang="scss">
// Hover effects for action cards
.group:hover {
    transform: translateY(-1px);
}

// Responsive adjustments
@media (max-width: 768px) {
    .grid-cols-1.md\:grid-cols-2 {
        grid-template-columns: repeat(1, minmax(0, 1fr));
    }
}
</style>

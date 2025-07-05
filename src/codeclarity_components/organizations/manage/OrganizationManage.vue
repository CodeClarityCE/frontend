<script lang="ts" setup>
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { OrgRepository } from '@/codeclarity_components/organizations/organization.repository';
import {
    MemberRole,
    type Organization
} from '@/codeclarity_components/organizations/organization.entity';
import { APIErrors } from '@/utils/api/ApiErrors';
import router from '@/router';
import { useAuthStore } from '@/stores/auth';
import { ref, type Ref } from 'vue';
import { Icon } from '@iconify/vue';
import HeaderItem from '@/codeclarity_components/organizations/subcomponents/HeaderItem.vue';
import CenteredModal from '@/base_components/CenteredModal.vue';
import { errorToast, successToast } from '@/utils/toasts';
import Button from '@/shadcn/ui/button/Button.vue';
import { Alert, AlertDescription } from '@/shadcn/ui/alert';

const authStore = useAuthStore();

const orgRepo: OrgRepository = new OrgRepository();

const orgInfo: Ref<Organization | undefined> = ref();
const orgActionModalRef: any = ref(null);
const orgAction: Ref<string> = ref('');
const orgActionId: Ref<string> = ref('');

defineProps<{
    page: string;
    orgId: string;
}>();

enum OrgAction {
    DELETE = 'delete',
    LEAVE = 'leave'
}

function performOrgAction() {
    if (orgAction.value == OrgAction.DELETE) {
        deleteOrg(orgActionId.value);
    } else if (orgAction.value == OrgAction.LEAVE) {
        leaveOrg(orgActionId.value);
    }
}

async function deleteOrg(orgId: string) {
    if (authStore.getAuthenticated && authStore.getToken) {
        try {
            await orgRepo.delete({
                orgId: orgId,
                bearerToken: authStore.getToken,
                handleBusinessErrors: true
            });
            successToast('Successfully deleted the organization.');
            router.push({ name: 'orgs', params: { page: 'list' } });
        } catch (err) {
            if (err instanceof BusinessLogicError) {
                if (err.error_code == APIErrors.EntityNotFound) {
                    router.push({ name: 'orgs', params: { page: 'list' } });
                } else if (err.error_code == APIErrors.PersonalOrgCannotBeModified) {
                    errorToast(`You cannot delete a personal organization.`);
                } else {
                    errorToast(`Failed to delete the organization.`);
                }
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
            router.push({ name: 'orgs', params: { page: 'list' } });
        } catch (err) {
            if (err instanceof BusinessLogicError) {
                if (err.error_code == APIErrors.EntityNotFound) {
                    router.push({ name: 'orgs', params: { page: 'list' } });
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

function setOrgInfo(_orgInfo: Organization) {
    orgInfo.value = _orgInfo;
}
</script>
<template>
    <div class="w-full flex flex-col org-manage-overview-wrapper">
        <HeaderItem v-if="orgId" :org-id="orgId" @on-org-info="setOrgInfo($event)"></HeaderItem>

        <div class="flex flex-col gap-12 p-8 max-w-4xl mx-auto">
            <div v-if="orgInfo" class="flex flex-col gap-12">
                <!-- Header Section -->
                <div class="text-center py-8">
                    <h1 class="text-4xl font-bold text-gray-900 mb-4">Organization Management</h1>
                    <p class="text-lg text-gray-600">
                        Manage your organization settings, members, and policies from one central
                        location.
                    </p>
                </div>

                <!-- Actions Section -->
                <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                    <h2 class="text-2xl font-semibold text-gray-900 mb-8 text-center">
                        Quick Actions
                    </h2>

                    <!-- Management Actions Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Integration Management -->
                        <RouterLink
                            v-if="
                                orgInfo.role == MemberRole.OWNER || orgInfo.role == MemberRole.ADMIN
                            "
                            :to="{
                                name: 'orgs',
                                params: { action: 'manage', orgId: orgId, page: 'integrations' }
                            }"
                            class="group flex items-center gap-4 p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200"
                        >
                            <div class="p-3 bg-blue-50 rounded-lg">
                                <Icon
                                    icon="solar:widget-add-bold-duotone"
                                    class="text-2xl text-blue-600"
                                />
                            </div>
                            <div class="flex-1">
                                <h3 class="font-semibold text-gray-900 mb-1">
                                    Manage organization integrations
                                </h3>
                                <p class="text-sm text-gray-600">
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
                            class="group flex items-center gap-4 p-6 border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all duration-200"
                        >
                            <div class="p-3 bg-purple-50 rounded-lg">
                                <Icon
                                    icon="solar:document-text-bold-duotone"
                                    class="text-2xl text-purple-600"
                                />
                            </div>
                            <div class="flex-1">
                                <h3 class="font-semibold text-gray-900 mb-1">
                                    Manage organization policies
                                </h3>
                                <p class="text-sm text-gray-600">
                                    Define analyzer behaviors and rules
                                </p>
                            </div>
                        </RouterLink>

                        <!-- Member Management -->
                        <RouterLink
                            v-if="
                                !orgInfo.personal &&
                                (orgInfo.role == MemberRole.OWNER ||
                                    orgInfo.role == MemberRole.ADMIN ||
                                    orgInfo.role == MemberRole.MODERATOR)
                            "
                            :to="{
                                name: 'orgs',
                                params: { action: 'manage', orgId: orgId, page: 'members' }
                            }"
                            class="group flex items-center gap-4 p-6 border border-gray-200 rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-200"
                        >
                            <div class="p-3 bg-green-50 rounded-lg">
                                <Icon
                                    icon="solar:users-group-rounded-bold-duotone"
                                    class="text-2xl text-green-600"
                                />
                            </div>
                            <div class="flex-1">
                                <h3 class="font-semibold text-gray-900 mb-1">
                                    Manage organization members
                                </h3>
                                <p class="text-sm text-gray-600">
                                    Manage organization team members
                                </p>
                            </div>
                        </RouterLink>

                        <!-- Invite Management -->
                        <RouterLink
                            v-if="
                                !orgInfo.personal &&
                                (orgInfo.role == MemberRole.OWNER ||
                                    orgInfo.role == MemberRole.ADMIN ||
                                    orgInfo.role == MemberRole.MODERATOR)
                            "
                            :to="{
                                name: 'orgs',
                                params: { action: 'manage', orgId: orgId, page: 'invites' }
                            }"
                            class="group flex items-center gap-4 p-6 border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition-all duration-200"
                        >
                            <div class="p-3 bg-orange-50 rounded-lg">
                                <Icon
                                    icon="solar:mailbox-bold-duotone"
                                    class="text-2xl text-orange-600"
                                />
                            </div>
                            <div class="flex-1">
                                <h3 class="font-semibold text-gray-900 mb-1">
                                    Manage organization invites
                                </h3>
                                <p class="text-sm text-gray-600">Send and manage member invites</p>
                            </div>
                        </RouterLink>

                        <!-- Audit Logs -->
                        <RouterLink
                            :to="{
                                name: 'orgs',
                                params: { action: 'manage', orgId: orgId, page: 'logs' }
                            }"
                            class="group flex items-center gap-4 p-6 border border-gray-200 rounded-xl hover:border-teal-300 hover:shadow-md transition-all duration-200"
                        >
                            <div class="p-3 bg-teal-50 rounded-lg">
                                <Icon
                                    icon="solar:file-text-bold-duotone"
                                    class="text-2xl text-teal-600"
                                />
                            </div>
                            <div class="flex-1">
                                <h3 class="font-semibold text-gray-900 mb-1">
                                    View organization audit logs
                                </h3>
                                <p class="text-sm text-gray-600">
                                    View organization activity history
                                </p>
                            </div>
                        </RouterLink>

                        <!-- Analyzer Management -->
                        <RouterLink
                            v-if="
                                orgInfo.role == MemberRole.OWNER || orgInfo.role == MemberRole.ADMIN
                            "
                            :to="{
                                name: 'orgs',
                                params: { action: 'manage', orgId: orgId, page: 'analyzers' }
                            }"
                            class="group flex items-center gap-4 p-6 border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                        >
                            <div class="p-3 bg-indigo-50 rounded-lg">
                                <Icon
                                    icon="solar:chart-2-bold-duotone"
                                    class="text-2xl text-indigo-600"
                                />
                            </div>
                            <div class="flex-1">
                                <h3 class="font-semibold text-gray-900 mb-1">Manage analyzers</h3>
                                <p class="text-sm text-gray-600">
                                    Configure analysis tools and settings
                                </p>
                            </div>
                        </RouterLink>
                    </div>

                    <!-- Danger Zone -->
                    <template v-if="!orgInfo.personal">
                        <div class="mt-8 pt-8 border-t border-gray-200">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4 text-center">
                                Danger Zone
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <!-- Leave Organization -->
                                <div
                                    class="flex items-center gap-4 p-4 border border-red-200 rounded-xl cursor-pointer hover:border-red-300 hover:shadow-md transition-all duration-200 bg-red-50"
                                    @click="
                                        orgActionId = orgId;
                                        orgAction = OrgAction.LEAVE;
                                        orgActionModalRef.toggle();
                                    "
                                >
                                    <div class="p-2 bg-red-100 rounded-lg">
                                        <Icon
                                            icon="mingcute:exit-door-line"
                                            class="text-xl text-red-600"
                                        />
                                    </div>
                                    <div class="flex-1">
                                        <h4 class="font-semibold text-red-800">
                                            Leave the organization
                                        </h4>
                                        <p class="text-sm text-red-600">
                                            Remove yourself from this organization
                                        </p>
                                    </div>
                                </div>

                                <!-- Delete Organization -->
                                <div
                                    v-if="orgInfo.role == MemberRole.OWNER"
                                    class="flex items-center gap-4 p-4 border border-red-300 rounded-xl cursor-pointer hover:border-red-400 hover:shadow-md transition-all duration-200 bg-red-100"
                                    @click="
                                        orgActionId = orgId;
                                        orgAction = OrgAction.DELETE;
                                        orgActionModalRef.toggle();
                                    "
                                >
                                    <div class="p-2 bg-red-200 rounded-lg">
                                        <Icon
                                            icon="solar:trash-bin-trash-bold"
                                            class="text-xl text-red-700"
                                        />
                                    </div>
                                    <div class="flex-1">
                                        <h4 class="font-semibold text-red-800">
                                            Delete the organization
                                        </h4>
                                        <p class="text-sm text-red-600">
                                            Permanently remove this organization
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
            <!-- FAQ Section -->
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
                <p class="text-gray-600">Common questions about organizations</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <!-- FAQ Item 1 -->
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
                    <div
                        class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                        <Icon icon="solar:refresh-bold-duotone" class="text-2xl text-blue-600" />
                    </div>
                    <h3 class="font-semibold text-gray-900 mb-2">
                        I cannot find a recently created repo
                    </h3>
                    <p class="text-sm text-gray-600">
                        We cache repositories for performance. If you can't find a recently created
                        repository, use the 'Force Refresh' button at the top of the page to update
                        the list.
                    </p>
                </div>

                <!-- FAQ Item 2 -->
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
                    <div
                        class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                        <Icon
                            icon="solar:danger-triangle-bold-duotone"
                            class="text-2xl text-red-600"
                        />
                    </div>
                    <h3 class="font-semibold text-gray-900 mb-2">My imports keep failing</h3>
                    <p class="text-sm text-gray-600">
                        Try using the 'Force Refresh' button first, then attempt to import again. If
                        the problem persists, please contact our support team for assistance.
                    </p>
                </div>

                <!-- FAQ Item 3 -->
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
                    <div
                        class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                        <Icon icon="solar:eye-bold-duotone" class="text-2xl text-yellow-600" />
                    </div>
                    <h3 class="font-semibold text-gray-900 mb-2">
                        I don't see all of my repositories
                    </h3>
                    <p class="text-sm text-gray-600">
                        We only show repositories that your access token can access and haven't been
                        imported yet. Check your integration permissions or use 'Force Refresh' to
                        update the list.
                    </p>
                </div>
            </div>

            <!-- Additional FAQ Questions -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <div class="flex items-start gap-3 mb-3">
                        <div
                            class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                        >
                            <Icon icon="solar:user-bold-duotone" class="text-lg text-purple-600" />
                        </div>
                        <h3 class="font-semibold text-gray-900">
                            What is a personal organization?
                        </h3>
                    </div>
                    <p class="text-sm text-gray-600 pl-11">
                        A personal organization is created automatically for you upon registration.
                        This organization is private, and you cannot invite other users to it. You
                        also cannot leave or delete this organization.
                    </p>
                </div>

                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <div class="flex items-start gap-3 mb-3">
                        <div
                            class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                        >
                            <Icon
                                icon="solar:widget-add-bold-duotone"
                                class="text-lg text-green-600"
                            />
                        </div>
                        <h3 class="font-semibold text-gray-900">What are integrations?</h3>
                    </div>
                    <p class="text-sm text-gray-600 pl-11">
                        An integration is a 'connection' to one of our offered external services.
                        For now, you can add integrations with GitLab and GitHub to easily analyze
                        your repositories.
                    </p>
                </div>

                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <div class="flex items-start gap-3 mb-3">
                        <div
                            class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                        >
                            <Icon
                                icon="solar:document-text-bold-duotone"
                                class="text-lg text-orange-600"
                            />
                        </div>
                        <h3 class="font-semibold text-gray-900">What are policies?</h3>
                    </div>
                    <p class="text-sm text-gray-600 pl-11">
                        A policy is a 'document' in which you can define certain behaviors of our
                        analyzers to customize how your code is analyzed and reviewed.
                    </p>
                </div>

                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <div class="flex items-start gap-3 mb-3">
                        <div
                            class="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                        >
                            <Icon
                                icon="solar:user-plus-bold-duotone"
                                class="text-lg text-teal-600"
                            />
                        </div>
                        <h3 class="font-semibold text-gray-900">
                            Can I add users to an organization?
                        </h3>
                    </div>
                    <p class="text-sm text-gray-600 pl-11">
                        Yes, you can. The only exception being personal organizations. To add a user
                        to your organization, you can invite them and if the user accepts the
                        invitation they will join your organization.
                    </p>
                </div>

                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <div class="flex items-start gap-3 mb-3">
                        <div
                            class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                        >
                            <Icon
                                icon="solar:letter-undo-bold-duotone"
                                class="text-lg text-red-600"
                            />
                        </div>
                        <h3 class="font-semibold text-gray-900">Can I revoke an invitation?</h3>
                    </div>
                    <p class="text-sm text-gray-600 pl-11">
                        Yes, you can. Simply click the 'revoke' button in the invitations overview
                        to cancel pending invitations.
                    </p>
                </div>

                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <div class="flex items-start gap-3 mb-3">
                        <div
                            class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                        >
                            <Icon
                                icon="solar:clock-circle-bold-duotone"
                                class="text-lg text-indigo-600"
                            />
                        </div>
                        <h3 class="font-semibold text-gray-900">
                            How long until organization invites expire?
                        </h3>
                    </div>
                    <p class="text-sm text-gray-600 pl-11">
                        An organization invite expires after three days for security reasons. You
                        can always resend the invitation email in the invitations overview.
                    </p>
                </div>
            </div>

            <!-- Still need help section -->
            <div class="bg-blue-50 rounded-2xl p-8 text-center border border-blue-200 mt-8">
                <div
                    class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                    <Icon
                        icon="solar:question-circle-bold-duotone"
                        class="text-3xl text-blue-600"
                    />
                </div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Still need help?</h3>
                <p class="text-gray-600 mb-4">
                    If you're experiencing issues not covered above, our support team is here to
                    help.
                </p>
                <Button variant="outline" class="bg-white"> Contact Support </Button>
            </div>
        </div>
    </div>
    <CenteredModal ref="orgActionModalRef">
        <template #title>
            <div class="flex items-center gap-3">
                <Icon
                    v-if="orgAction == OrgAction.DELETE"
                    icon="solar:trash-bin-trash-bold-duotone"
                    class="text-2xl text-red-600"
                />
                <Icon
                    v-if="orgAction == OrgAction.LEAVE"
                    icon="mingcute:exit-door-line"
                    class="text-2xl text-orange-600"
                />
                <span class="text-xl font-bold text-gray-800">
                    <span v-if="orgAction == OrgAction.DELETE">Delete Organization</span>
                    <span v-if="orgAction == OrgAction.LEAVE">Leave Organization</span>
                </span>
            </div>
        </template>
        <template #content>
            <div class="flex flex-col gap-6 max-w-md w-full">
                <div class="text-gray-700">
                    <p v-if="orgAction == OrgAction.DELETE">
                        Are you sure you want to permanently delete this organization? This action
                        will remove all data, members, and settings associated with the
                        organization.
                    </p>
                    <p v-if="orgAction == OrgAction.LEAVE">
                        Are you sure you want to leave this organization? You will lose access to
                        all organization resources and projects.
                    </p>
                </div>
                <Alert variant="destructive" class="border-red-200 bg-red-50">
                    <Icon class="h-4 w-4" icon="solar:danger-triangle-bold-duotone"></Icon>
                    <AlertDescription class="text-red-800">
                        <strong>Warning:</strong> This action is permanent and cannot be reverted.
                    </AlertDescription>
                </Alert>
            </div>
        </template>
        <template #buttons>
            <Button
                variant="destructive"
                class="flex items-center gap-2"
                @click="
                    performOrgAction();
                    orgActionModalRef.toggle();
                "
            >
                <Icon
                    v-if="orgAction == OrgAction.DELETE"
                    class="h-4 w-4"
                    icon="solar:trash-bin-trash-bold"
                ></Icon>
                <Icon
                    v-else-if="orgAction == OrgAction.LEAVE"
                    class="h-4 w-4"
                    icon="mingcute:exit-door-line"
                ></Icon>

                <span v-if="orgAction == OrgAction.DELETE">Delete Organization</span>
                <span v-else-if="orgAction == OrgAction.LEAVE">Leave Organization</span>
            </Button>
            <Button
                variant="outline"
                @click="
                    orgActionId = '';
                    orgActionModalRef.toggle();
                "
            >
                Cancel
            </Button>
        </template>
    </CenteredModal>
</template>

<style scoped lang="scss">
.org-manage-overview-wrapper {
    min-height: 100vh;
    background: #ffffff;
}

// Hover effects for action cards
.group:hover {
    transform: translateY(-1px);
}

// Responsive adjustments
@media (max-width: 768px) {
    .grid-cols-1.md\:grid-cols-2 {
        grid-template-columns: repeat(1, minmax(0, 1fr));
    }

    .grid-cols-1.md\:grid-cols-3 {
        grid-template-columns: repeat(1, minmax(0, 1fr));
    }
}

@media (min-width: 768px) and (max-width: 1024px) {
    .grid-cols-1.md\:grid-cols-3 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
</style>

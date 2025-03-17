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
import FaqBox from '@/base_components/FaqBox.vue';
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
    <div class="w-full flex flex-col gap-8 org-manage-overview-wrapper">
        <HeaderItem v-if="orgId" :org-id="orgId" @on-org-info="setOrgInfo($event)"></HeaderItem>

        <div class="flex flex-col gap-8 p-12">
            <div v-if="orgInfo" class="flex flex-col gap-8">
                <div>
                    <h2 class="text-2xl mb-2">Actions</h2>
                    <div class="flex flex-row gap-4 flex-wrap font-normal justify-center">
                        <RouterLink
                            :to="{
                                name: 'orgs',
                                params: { action: 'manage', orgId: orgId, page: 'integrations' }
                            }"
                            class="cursor-pointer w-[calc(50%-10px)] border min-w-0 rounded-lg p-5 font-normal"
                            v-if="
                                orgInfo.role == MemberRole.OWNER || orgInfo.role == MemberRole.ADMIN
                            "
                            title="Manage organization integrations."
                        >
                            Manage organization integrations
                        </RouterLink>
                        <RouterLink
                            :to="{
                                name: 'orgs',
                                params: { action: 'manage', orgId: orgId, page: 'policies' }
                            }"
                            class="cursor-pointer w-[calc(50%-10px)] border min-w-0 rounded-lg p-5 font-normal"
                            title="Manage organization policies."
                        >
                            Manage organization policies
                        </RouterLink>
                        <template v-if="!orgInfo.personal">
                            <RouterLink
                                :to="{
                                    name: 'orgs',
                                    params: { action: 'manage', orgId: orgId, page: 'members' }
                                }"
                                class="cursor-pointer w-[calc(50%-10px)] border min-w-0 rounded-lg p-5 font-normal"
                                v-if="
                                    orgInfo.role == MemberRole.OWNER ||
                                    orgInfo.role == MemberRole.ADMIN ||
                                    orgInfo.role == MemberRole.MODERATOR
                                "
                                title="Manage organization member."
                            >
                                Manage organization members
                            </RouterLink>
                            <RouterLink
                                :to="{
                                    name: 'orgs',
                                    params: { action: 'manage', orgId: orgId, page: 'invites' }
                                }"
                                class="cursor-pointer w-[calc(50%-10px)] border min-w-0 rounded-lg p-5 font-normal"
                                v-if="
                                    orgInfo.role == MemberRole.OWNER ||
                                    orgInfo.role == MemberRole.ADMIN ||
                                    orgInfo.role == MemberRole.MODERATOR
                                "
                                title="Manage organization invites."
                            >
                                Manage organization invites
                            </RouterLink>
                        </template>
                        <RouterLink
                            :to="{
                                name: 'orgs',
                                params: { action: 'manage', orgId: orgId, page: 'logs' }
                            }"
                            class="cursor-pointer w-[calc(50%-10px)] border min-w-0 rounded-lg p-5 font-normal"
                            title="View organization audit logs."
                        >
                            View organization audit logs.
                        </RouterLink>
                        <template v-if="!orgInfo.personal">
                            <div
                                class="cursor-pointer w-[calc(50%-10px)] border min-w-0 rounded-lg p-5 font-normal"
                                title="Leave the organization."
                                @click="
                                    orgActionId = orgId;
                                    orgAction = OrgAction.LEAVE;
                                    orgActionModalRef.toggle();
                                "
                            >
                                Leave the organization
                            </div>
                            <div
                                class="cursor-pointer w-[calc(50%-10px)] border min-w-0 rounded-lg p-5 font-normal border-redBorder bg-redLight text-destructive"
                                v-if="orgInfo.role == MemberRole.OWNER"
                                title="Delete the organization."
                                @click="
                                    orgActionId = orgId;
                                    orgAction = OrgAction.DELETE;
                                    orgActionModalRef.toggle();
                                "
                            >
                                Delete the organization
                            </div>
                        </template>
                        <RouterLink
                            :to="{
                                name: 'orgs',
                                params: { action: 'manage', orgId: orgId, page: 'analyzers' }
                            }"
                            class="cursor-pointer w-[calc(50%-10px)] border min-w-0 rounded-lg p-5 font-normal"
                            v-if="
                                orgInfo.role == MemberRole.OWNER || orgInfo.role == MemberRole.ADMIN
                            "
                            title="Manage analyzers."
                        >
                            Manage analyzers
                        </RouterLink>
                    </div>
                </div>
            </div>
            <div>
                <h2 class="text-2xl mb-2">Faq</h2>
                <div class="flex lex-row gap-5 flex-wrap faq-wrapper">
                    <FaqBox>
                        <template #question>What is a personal organization?</template>
                        <template #answer
                            >A personal organization is an organization that is created
                            automatically for you upon registration. This organization is private,
                            and you cannot invite other users to this organization. You also cannot
                            leave or delete this organization.</template
                        >
                    </FaqBox>
                    <FaqBox>
                        <template #question>What are integrations?</template>
                        <template #answer
                            >An integration is a 'connection' to one of our offered external
                            services. For now, you can add integrations with Gitlab and Github to
                            easily analyze your repositories.</template
                        >
                    </FaqBox>
                    <FaqBox>
                        <template #question>What are policies?</template>
                        <template #answer
                            >A policy is a 'document' in which you can define certain behaviours of
                            our analyzers.</template
                        >
                    </FaqBox>
                    <FaqBox>
                        <template #question>Can I add users to an organization?</template>
                        <template #answer
                            >Yes, you can. The only exception being personal organizations. To add a
                            user to your organization, you can invite them and if the user accepts
                            the invitation they will join your organization.</template
                        >
                    </FaqBox>
                    <FaqBox>
                        <template #question>Can I revoke an invitation?</template>
                        <template #answer
                            >Yes, you can. Simply click the 'revoke' button in the invitations
                            overview.</template
                        >
                    </FaqBox>
                    <FaqBox>
                        <template #question>Can I remove a user from an organization?</template>
                        <template #answer
                            >Yes, you can. Simply click the 'remove' button in the members overview.
                            Moderators, Admins and Owners can remove any invited user that has the
                            role 'User'. Admins can also remove moderators, and Owners can remove
                            anyone. Finally, a user can remove a user with the same role only if
                            they are the one that invited them to the organization.</template
                        >
                    </FaqBox>
                    <FaqBox>
                        <template #question>Can I add another owner to an organization?</template>
                        <template #answer
                            >No, you cannot. The role of 'Owner' is reserved to users that created
                            the organization only.</template
                        >
                    </FaqBox>
                    <FaqBox>
                        <template #question>How long until organization invites expire?</template>
                        <template #answer
                            >An organization invite expires after three days for security reasons.
                            You can always resend the invitation email in the invitations
                            overview.</template
                        >
                    </FaqBox>
                    <FaqBox>
                        <template #question>Are my actions within an organization logged?</template>
                        <template #answer
                            >Yes, they are. Owners and moderators can view the audit logs of an
                            organization for accountability reasons.</template
                        >
                    </FaqBox>
                    <FaqBox>
                        <template #question>Can I recover a deleted organization?</template>
                        <template #answer
                            >No, you cannot. Organization deletion is a permanent action and cannot
                            be undone.</template
                        >
                    </FaqBox>
                </div>
            </div>
        </div>
    </div>
    <CenteredModal ref="orgActionModalRef">
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
                <div v-if="orgAction == OrgAction.DELETE">Delete the organization?</div>
                <div v-if="orgAction == OrgAction.LEAVE">Leave the organization?</div>
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
                <div v-if="orgAction == OrgAction.DELETE">
                    Are you sure you want to delete the organization?
                </div>
                <div v-if="orgAction == OrgAction.LEAVE">
                    Are you sure you want to leave the organization?
                </div>
                <Alert variant="destructive">
                    <Icon class="icon" icon="solar:danger-triangle-bold-duotone"></Icon>
                    <AlertDescription>
                        This action is permanent and cannot be reverted.
                    </AlertDescription>
                </Alert>
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
                <Icon
                    v-if="orgAction == OrgAction.DELETE"
                    class="icon"
                    icon="solar:trash-bin-trash-bold"
                ></Icon>
                <Icon
                    v-else-if="orgAction == OrgAction.LEAVE"
                    class="icon"
                    icon="mingcute:exit-door-line"
                ></Icon>

                <span v-if="orgAction == OrgAction.DELETE">Delete</span>
                <span v-else-if="orgAction == OrgAction.LEAVE">Leave</span>
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
.faq-wrapper > .faq-box {
    width: calc(50% - 10px);
}

.org-manage-overview-wrapper {
    padding-bottom: 2rem;

    .faq-wrapper > * {
        width: calc(50% - 10px);
    }
}
</style>

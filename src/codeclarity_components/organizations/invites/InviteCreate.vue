<script lang="ts" setup>
import { BusinessLogicError, ValidationError } from '@/utils/api/BaseRepository';
import { OrgRepository } from '../organization.repository';
import { MemberRole, type Organization, isMemberRoleGreaterThan } from '../organization.entity';
import router from '@/router';
import { useAuthStore } from '@/stores/auth';
import { ref, type Ref } from 'vue';
import OrgHeaderItem from '@/views/org/subcomponents/OrgHeaderItem.vue';
import { APIErrors } from '@/utils/api/ApiErrors';
import { Icon } from '@iconify/vue';
import FaqBox from '@/base_components/layout/FaqBox.vue';
import { errorToast, successToast } from '@/utils/toasts';
import Button from '@/shadcn/ui/button/Button.vue';
import { z } from 'zod';
import AutoForm from '@/shadcn/ui/auto-form/AutoForm.vue';
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import Alert from '@/shadcn/ui/alert/Alert.vue';
import { Terminal } from 'lucide-vue-next';
import AlertTitle from '@/shadcn/ui/alert/AlertTitle.vue';
import AlertDescription from '@/shadcn/ui/alert/AlertDescription.vue';

const orgRepo: OrgRepository = new OrgRepository();
const authStore = useAuthStore();

const orgInfo: Ref<Organization | undefined> = ref();
const errorCodeSendInvite: Ref<string> = ref('');
const errorSendInvite: Ref<boolean> = ref(false);
const validationError: Ref<ValidationError | undefined> = ref();

const props = defineProps<{
    page?: string;
    orgId: string;
}>();

async function submit(values: Record<string, any>) {
    if (!(authStore.getToken && authStore.getAuthenticated)) return;

    let role = MemberRole.USER;
    switch (values['role']) {
        case 'Admin':
            role = MemberRole.ADMIN;
            break;
        case 'Moderator':
            role = MemberRole.MODERATOR;
            break;
        default:
            role = MemberRole.USER;
    }

    errorSendInvite.value = false;
    validationError.value = undefined;

    try {
        await orgRepo.inviteUser({
            orgId: props.orgId,
            bearerToken: authStore.getToken!,
            data: {
                user_email: values['email'],
                role: role
            },
            handleBusinessErrors: true
        });

        successToast('Successfully invited the user');
    } catch (error) {
        errorSendInvite.value = true;

        if (error instanceof ValidationError) {
            errorCodeSendInvite.value = error.error_code;
            validationError.value = error;
        } else if (error instanceof BusinessLogicError) {
            if (error.error_code == APIErrors.PersonalOrgCannotBeModified) {
                errorToast('You cannot invite members to a personal organization.');
            } else if (error.error_code == APIErrors.AlreadyExists) {
                errorToast('This user is already a member of the organization.');
            } else if (error.error_code == APIErrors.InvitationOrgAlreadyExists) {
                errorToast('This user already has an open invitation.');
            } else if (error.error_code == APIErrors.UserDoesNotExist) {
                errorToast('This user does not exist.');
            } else {
                errorToast('We encountered a problem while processing your request.');
            }
        } else {
            errorToast('We encountered a problem while processing your request.');
        }
    }
}

function setOrgInfo(_orgInfo: Organization) {
    orgInfo.value = _orgInfo;
    if (!isMemberRoleGreaterThan(_orgInfo.role, MemberRole.USER)) {
        router.push({ name: 'orgs', params: { page: 'invites', orgId: _orgInfo.id } });
    }
}

const formSchema = z.object({
    email: z.string().email().describe('Email'),
    role: z.enum(['User', 'Moderator', 'Admin']).describe('Member will join as')
});

const form = useForm({
    validationSchema: toTypedSchema(formSchema)
});
</script>
<template>
    <div class="flex flex-col items-center gap-8">
        <OrgHeaderItem
            v-if="orgId"
            :org-id="orgId"
            @on-org-info="setOrgInfo($event)"
        ></OrgHeaderItem>
        <div v-if="orgInfo" class="flex flex-col gap-8">
            <div
                v-if="
                    (!orgInfo.personal && orgInfo.role == MemberRole.OWNER) ||
                    orgInfo.role == MemberRole.ADMIN ||
                    orgInfo.role == MemberRole.MODERATOR
                "
            >
                <h2 class="text-xl">Related Actions</h2>
                <div class="flex flex-row gap-4 flex-wrap items-stretch org-manage-items">
                    <RouterLink :to="{ name: 'orgs', params: { orgId: orgId, page: 'members' } }">
                        <Button variant="outline">Manage organization members</Button>
                    </RouterLink>
                </div>
            </div>
            <div class="flex flex-col gap-5">
                <Alert>
                    <Terminal class="h-4 w-4" />
                    <AlertTitle>Invite a user to join your org</AlertTitle>
                    <AlertDescription>
                        <span>
                            Invite users to join your org by entering their email below and
                            selecting their role.
                        </span>
                    </AlertDescription>
                </Alert>
                <Alert v-if="errorCodeSendInvite" variant="destructive">
                    <Icon icon="material-symbols:error-outline" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        <span v-if="errorCodeSendInvite == APIErrors.InternalError">
                            Encountered an error while creating the invite. Please refresh the page
                            and try again, and if the error persists contact our webmaster.
                        </span>
                        <span
                            v-if="
                                errorCodeSendInvite == APIErrors.ValidationFailed && validationError
                            "
                            style="white-space: break-spaces"
                        >
                            <!-- Note: this should never happen unless our client and server side validation are out of sync -->
                            {{ validationError.toMessage('Invalid form:') }}
                        </span>
                    </AlertDescription>
                </Alert>
                <AutoForm
                    class="flex flex-col gap-2"
                    :form="form"
                    :schema="formSchema"
                    @submit="submit"
                >
                    <Button type="submit"> Send Invite </Button>
                </AutoForm>
            </div>
        </div>

        <h2 class="text-xl">Faq</h2>
        <div class="flex flex-row gap-5 flex-wrap">
            <FaqBox>
                <template #question>What roles are there, and what are their differences?</template>
                <template #answer>
                    The following roles are available:
                    <ul class="list-disc list-inside">
                        <li>
                            <div>User</div>
                            <div>
                                Users cannot manage any part of an organization. They may however
                                import projects, start analyses and view the analyses results.
                            </div>
                        </li>
                        <li>
                            <div>Moderators</div>
                            <div>
                                In addition to the permissions of the User role, Moderators can
                                manage certain parts of an organization, such as managing invites,
                                and members.
                            </div>
                        </li>
                        <li>
                            <div>Admin</div>
                            <div>
                                In addition to the permissions of the Moderators role, Admins can
                                also add integrations with external services.
                            </div>
                        </li>
                        <li>
                            <div>Owner</div>
                            <div>
                                The role 'Owner' is reserverd for people that created the
                                organization. They can manage all parts of an organization.
                            </div>
                        </li>
                    </ul>
                </template>
            </FaqBox>
            <FaqBox>
                <template #question
                    >I accidentally invited someone, can I revoke the invite?</template
                >
                <template #answer>
                    Yes, you can revoke an invite, simply go to 'Manage Invites' and click the
                    'Revoke invite' button on invite that you wish to revoke. In case the user has
                    already accepted the invite, you can go to 'Manage Members' and click on 'Revoke
                    access' button to 'kick' the user from the org.
                </template>
            </FaqBox>
            <FaqBox>
                <template #question
                    >Why can I not invite users of role Moderator or Admin?</template
                >
                <template #answer
                    >Depending on your own role, you are only allowed to create an invite for
                    certain other roles.
                    <ul class="list-disc list-inside">
                        <li>As a Moderator you can only create invites for the role User.</li>
                        <li>
                            As an Admin you can create invites for the roles Moderator and User.
                        </li>
                        <li>
                            As an owner you can create invites for the roles Moderator, User and
                            Admin, but not Owner. (Owner is a reserved role)
                        </li>
                    </ul>
                </template>
            </FaqBox>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { BusinessLogicError, ValidationError } from '@/repositories/BaseRepository';
import { OrgRepository } from '@/repositories/OrganizationRepository';
import {
    MemberRole,
    type Organization,
    isMemberRoleGreaterThan
} from '@/repositories/types/entities/Organization';
import router from '@/router';
import { useAuthStore } from '@/stores/auth';
import { onMounted, ref, type Ref } from 'vue';
import { useRoute } from 'vue-router';
import OrgHeaderItem from '@/views/org/subcomponents/OrgHeaderItem.vue';
import { APIErrors } from '@/repositories/types/errors/ApiErrors';
import { Icon } from '@iconify/vue';
import { Form } from 'vee-validate';
import LoadingSubmitButton from '@/common_components/LoadingSubmitButton.vue';
import * as yup from 'yup';
import isEmail from 'validator/lib/isEmail';
import FaqBox from '@/common_components/FaqBox.vue';
import { errorToast, successToast } from '@/utils/toasts';
import { isMemberRoleGreaterOrEqualTo } from '@/repositories/types/entities/Organization';
import FormTextField from '@/common_components/forms/FormTextField.vue';
import BorderCard from '@/common_components/cards/BorderCard.vue';
import InfoBoxRed from '@/common_components/info_box/InfoBoxRed.vue';

const orgRepo: OrgRepository = new OrgRepository();
const authStore = useAuthStore();

const orgInfo: Ref<Organization | undefined> = ref();
const errorCodeSendInvite: Ref<string> = ref('');
const errorSendInvite: Ref<boolean> = ref(false);
const validationError: Ref<ValidationError | undefined> = ref();
const orgId: Ref<string> = ref('');
const formEmail: Ref<string> = ref('');
const formRole: Ref<MemberRole> = ref(MemberRole.USER);
const loadingButtonRef: any = ref(null);

async function submit() {
    if (!(authStore.getToken && authStore.getAuthenticated)) return;

    loadingButtonRef.value.setLoading(true);
    loadingButtonRef.value.setDisabled(true);
    errorSendInvite.value = false;
    validationError.value = undefined;

    try {
        await orgRepo.inviteUser({
            orgId: orgId.value,
            bearerToken: authStore.getToken!,
            data: {
                user_email: formEmail.value,
                role: formRole.value
            },
            handleBusinessErrors: true
        });

        successToast('Successfully invited the user');

        formEmail.value = '';
        formRole.value = MemberRole.USER;
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
            } else {
                errorToast('We encountered a problem while processing your request.');
            }
        } else {
            errorToast('We encountered a problem while processing your request.');
        }
    } finally {
        loadingButtonRef.value.setLoading(false);
        loadingButtonRef.value.setDisabled(false);
    }
}

onMounted(() => {
    init();
});

function init() {
    const route = useRoute();
    const _orgId = route.params.orgId;

    if (!_orgId) {
        router.back();
    }

    if (typeof _orgId == 'string') {
        orgId.value = _orgId;
    } else {
        router.back();
    }
}

function setOrgInfo(_orgInfo: Organization) {
    orgInfo.value = _orgInfo;
    if (!isMemberRoleGreaterThan(_orgInfo.role, MemberRole.USER)) {
        router.push({ name: 'orgManage', params: { page: '', orgId: _orgInfo.id } });
    }
}

const formValidationSchema = yup.object({
    email: yup
        .string()
        .required('An email is required')
        .test(
            'is-valid',
            (message) => `${message.path} is invalid`,
            (value) => (value ? isEmail(value) : new yup.ValidationError('must be a valid email'))
        )
});
</script>
<template>
    <div class="flex flex-col gap-8 org-member-invitation-wrapper">
        <OrgHeaderItem
            v-if="orgId"
            :org-id="orgId"
            @on-org-info="setOrgInfo($event)"
        ></OrgHeaderItem>
        <div v-if="orgInfo" class="flex flex-col gap-8 p-12">
            <div
                v-if="
                    (!orgInfo.personal && orgInfo.role == MemberRole.OWNER) ||
                    orgInfo.role == MemberRole.ADMIN ||
                    orgInfo.role == MemberRole.MODERATOR
                "
            >
                <h2>Related Actions</h2>
                <div class="flex flex-row gap-4 flex-wrap items-stretch org-manage-items">
                    <RouterLink
                        :to="{ name: 'orgManage', params: { orgId: orgId, page: 'members' } }"
                    >
                        <BorderCard :hover="true" :slim="true">
                            <template #title> Manage organization members </template>
                        </BorderCard>
                    </RouterLink>
                </div>
            </div>
            <div class="flex flex-col gap-5">
                <div class="flex flex-col gap-1">
                    <h2 style="margin-bottom: 0px">Invite a user to join your org</h2>
                    <div>
                        Invite users to join your org by entering their email below and selecting
                        their role.
                    </div>
                </div>
                <div class="flex flex-col gap-2">
                    <InfoBoxRed v-if="errorCodeSendInvite">
                        <div
                            style="
                                display: flex;
                                flex-direction: row;
                                align-items: center;
                                column-gap: 0.5rem;
                            "
                        >
                            <Icon icon="material-symbols:error-outline" />
                            <div>
                                <div v-if="errorCodeSendInvite == APIErrors.InternalError">
                                    Encountered an error while creating the invite. Please refresh
                                    the page and try again, and if the error persists contact our
                                    webmaster.
                                </div>
                                <div
                                    v-if="
                                        errorCodeSendInvite == APIErrors.ValidationFailed &&
                                        validationError
                                    "
                                    style="white-space: break-spaces"
                                >
                                    <!-- Note: this should never happen unless our client and server side validation are out of sync -->
                                    {{ validationError.toMessage('Invalid form:') }}
                                </div>
                            </div>
                        </div>
                    </InfoBoxRed>

                    <Form
                        class="normal-form user-invite-form"
                        :validation-schema="formValidationSchema"
                        @submit="submit"
                    >
                        <FormTextField
                            v-model="formEmail"
                            :placeholder="'Enter the user\'s email'"
                            :type="'email'"
                            :name="'email'"
                        >
                            <template #name>Email</template>
                        </FormTextField>

                        <div class="flex flex-col gap-2 role-select-wrapper">
                            <label>Member will join as</label>
                            <select v-model="formRole">
                                <option selected :value="MemberRole.USER">User</option>
                                <option
                                    v-if="
                                        isMemberRoleGreaterOrEqualTo(orgInfo.role, MemberRole.ADMIN)
                                    "
                                    :value="MemberRole.MODERATOR"
                                >
                                    Moderator
                                </option>
                                <option
                                    v-if="
                                        isMemberRoleGreaterOrEqualTo(orgInfo.role, MemberRole.OWNER)
                                    "
                                    :value="MemberRole.ADMIN"
                                >
                                    Admin
                                </option>
                            </select>
                        </div>

                        <LoadingSubmitButton ref="loadingButtonRef" style="width: fit-content">
                            <span>Send Invite</span>
                        </LoadingSubmitButton>
                    </Form>
                </div>
            </div>
        </div>

        <div class="p-12">
            <h2>Faq</h2>
            <div class="flex flex-row gap-5 flex-wrap faq-wrapper">
                <FaqBox>
                    <template #question
                        >What roles are there, and what are their differences?</template
                    >
                    <template #answer>
                        The following roles are available:
                        <ul>
                            <li>
                                <div>User</div>
                                <div>
                                    Users cannot manage any part of an organization. They may
                                    however import projects, start analyses and view the analyses
                                    results.
                                </div>
                            </li>
                            <li>
                                <div>Moderators</div>
                                <div>
                                    In addition to the permissions of the User role, Moderators can
                                    manage certain parts of an organization, such as managing
                                    invites, and members.
                                </div>
                            </li>
                            <li>
                                <div>Admin</div>
                                <div>
                                    In addition to the permissions of the Moderators role, Admins
                                    can also add integrations with external services.
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
                        'Revoke invite' button on invite that you wish to revoke. In case the user
                        has already accepted the invite, you can go to 'Manage Members' and click on
                        'Revoke access' button to 'kick' the user from the org.
                    </template>
                </FaqBox>
                <FaqBox>
                    <template #question
                        >Why can I not invite users of role Moderator or Admin?</template
                    >
                    <template #answer
                        >Depending on your own role, you are only allowed to create an invite for
                        certain other roles.
                        <ul>
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
    </div>
</template>

<style lang="scss" scoped>
.org-member-invitation-wrapper {
    .user-invite-form {
        max-width: calc(50% - 10px);
    }

    @media only screen and (max-width: 1300px) {
        .user-invite-form {
            max-width: 100%;
        }
    }

    .org-manage-items {
        font-weight: 400;
        text-decoration: none;
    }
}
</style>

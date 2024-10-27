<script lang="ts" setup>
import { BusinessLogicError } from '@/repositories/BaseRepository';
import { OrgRepository } from '@/repositories/OrganizationRepository';
import { OrganizationInfoForInvitee, MemberRole } from '@/repositories/types/entities/Organization';
import router from '@/router';
import { useAuthStore } from '@/stores/auth';
import { onMounted, ref, type Ref } from 'vue';
import moment from 'moment';
import { Icon } from '@iconify/vue';
import FaqBox from '@/common_components/FaqBox.vue';
import { APIErrors } from '@/repositories/types/errors/ApiErrors';
import { successToast } from '@/utils/toasts';
import BlueButton from '@/common_components/buttons/BlueButton.vue';
import NormalButton from '@/common_components/buttons/NormalButton.vue';

const inviteToken: Ref<string | undefined> = ref();
const userEmailHash: Ref<string | undefined> = ref();
const orgId: Ref<string | undefined> = ref();
const fetchError: Ref<boolean> = ref(false);
const fetchErrorCode: Ref<string | undefined> = ref();
const authStore = useAuthStore();
const joinOrgResp: Ref<boolean> = ref(false);
const joinError: Ref<boolean> = ref(false);
const joinErrorCode: Ref<string | undefined> = ref();

const orgRepository: OrgRepository = new OrgRepository();
const orgInfo: Ref<OrganizationInfoForInvitee | undefined> = ref();

onMounted(() => {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;

    // Token
    const _token = searchParams.get('token');

    // User email hash
    const _userEmailHash = searchParams.get('useremail');

    // orgId
    const _orgId = searchParams.get('orgId');

    if (!_token || !_userEmailHash || !_orgId) {
        router.push('/');
        return;
    }

    inviteToken.value = _token;
    userEmailHash.value = _userEmailHash;
    orgId.value = _orgId;

    fetchOrgInfo();
});

async function fetchOrgInfo() {
    if (!inviteToken.value || !userEmailHash.value || !orgId.value) return;
    if (!authStore.getAuthenticated || !authStore.getToken) return;

    try {
        const _orgInfo = await orgRepository.getOrgInfoAsInvitedMember({
            bearerToken: authStore.getToken!,
            orgId: orgId.value,
            inviteToken: inviteToken.value,
            userEmailHash: userEmailHash.value,
            handleBusinessErrors: true
        });
        orgInfo.value = _orgInfo;
    } catch (err) {
        fetchError.value = true;
        if (err instanceof BusinessLogicError) {
            fetchErrorCode.value = err.error_code;
        }
    }
}

async function joinOrg() {
    if (!inviteToken.value || !userEmailHash.value || !orgId.value) return;
    if (!authStore.getAuthenticated || !authStore.getToken) return;

    try {
        await orgRepository.joinOrgViaInvitation({
            bearerToken: authStore.getToken!,
            orgId: orgId.value,
            data: {
                token: inviteToken.value,
                email_digest: userEmailHash.value
            },
            handleBusinessErrors: true
        });

        router.push({ name: 'orgManage', params: { page: '', orgId: orgId.value } });
        successToast('Successfully joined the org');
    } catch (err) {
        joinError.value = true;
        if (err instanceof BusinessLogicError) {
            joinErrorCode.value = err.error_code;
        }
    } finally {
        joinOrgResp.value = true;
    }
}
</script>
<template>
    <div class="join-org-wrapper">
        <div class="flex flex-row justify-center" style="margin-top: 80px">
            <div class="flex flex-col gap-8" style="max-width: 700px; width: fit-content">
                <div v-if="joinOrgResp">
                    <div
                        class="flex flex-col gap-5 w-fit"
                        style="font-size: 1.5em"
                        v-if="joinError"
                    >
                        <div class="flex flex-row gap-2">
                            <Icon
                                class="icon user-icon"
                                icon="solar:confounded-square-outline"
                                style="font-size: 3rem; height: fit-content"
                            ></Icon>
                            <div>
                                <div class="flex flex-col gap-5">
                                    <div class="flex flex-col gap-2">
                                        <div>Failed to join the organization</div>
                                        <div style="font-size: 0.7em" v-if="joinErrorCode">
                                            <div
                                                v-if="
                                                    joinErrorCode ==
                                                    APIErrors.InvitationInvalidOrExpired
                                                "
                                            >
                                                This invite link does not exist or has expired.
                                            </div>
                                            <div v-else>
                                                We encountered an error while processing the join
                                                request.
                                            </div>
                                        </div>
                                        <div style="font-size: 0.7em" v-else>
                                            <div>
                                                We encountered an error while processing the join
                                                request.
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex flex-row gap-2 items-center flex-wrap">
                                        <BlueButton
                                            v-if="
                                                joinErrorCode != APIErrors.NotAuthorized &&
                                                joinErrorCode != APIErrors.EntityNotFound
                                            "
                                            @click="joinOrg"
                                        >
                                            <template #text> Try again </template>
                                        </BlueButton>
                                        <BlueButton @click="router.back">
                                            <template #text> Go back </template>
                                        </BlueButton>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <template v-else>
                    <div v-if="fetchError">
                        <div class="flex flex-col gap-5 w-fit" style="font-size: 1.5em">
                            <div class="flex flex-row gap-2">
                                <Icon
                                    class="icon user-icon"
                                    icon="solar:confounded-square-outline"
                                    style="font-size: 3rem; height: fit-content"
                                ></Icon>
                                <div>
                                    <div class="flex flex-col gap-5">
                                        <div class="flex flex-col gap-2">
                                            <div>
                                                We failed to retrieve information on the invite
                                            </div>
                                            <div style="font-size: 0.7em" v-if="fetchErrorCode">
                                                <div
                                                    v-if="
                                                        fetchErrorCode ==
                                                            APIErrors.EntityNotFound ||
                                                        fetchErrorCode == APIErrors.NotAuthorized
                                                    "
                                                >
                                                    This invite link does not exist or has expired.
                                                </div>
                                                <div v-else>
                                                    We encountered an error while retrieving the
                                                    invite information.
                                                </div>
                                            </div>
                                            <div style="font-size: 0.7em" v-else>
                                                <div>
                                                    We encountered an error while retrieving the
                                                    invite information.
                                                </div>
                                            </div>
                                        </div>
                                        <div class="flex flex-row gap-2 items-center flex-wrap">
                                            <BlueButton
                                                v-if="
                                                    joinErrorCode != APIErrors.NotAuthorized &&
                                                    joinErrorCode != APIErrors.EntityNotFound
                                                "
                                                @click="fetchOrgInfo"
                                            >
                                                <template #text> Try again </template>
                                            </BlueButton>
                                            <BlueButton @click="router.back">
                                                <template #text> Go back </template>
                                            </BlueButton>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-if="orgInfo">
                        <div class="flex flex-col gap-8">
                            <div style="font-weight: 900; font-size: 2rem">
                                Join the '{{ orgInfo.name }}' organization?
                            </div>
                            <div
                                class="flex flex-col gap-2"
                                style="font-weight: 500; color: rgb(93, 93, 93)"
                            >
                                <div class="flex flex-row gap-2 items-center">
                                    <div
                                        class="circle-org-avatar"
                                        :class="'org-color-scheme-' + orgInfo.color_scheme"
                                    ></div>
                                    <div
                                        style="
                                            font-size: 1.5em;
                                            font-weight: 900;
                                            color: rgb(42, 45, 49);
                                        "
                                    >
                                        {{ orgInfo.name }}
                                    </div>
                                </div>
                                <div>
                                    {{ orgInfo.description }}
                                </div>
                            </div>
                            <div style="font-weight: 500; color: rgb(93, 93, 93)">
                                <span v-if="orgInfo.invite_created_by">
                                    {{ orgInfo.invite_created_by.last_name }}
                                    {{ orgInfo.invite_created_by.first_name }} ({{
                                        orgInfo.invite_created_by.email
                                    }})
                                </span>
                                <span v-else> Deleted User </span>
                                <span>
                                    has invited you to join the Organization '{{ orgInfo.name }}' as
                                    a
                                    <span
                                        class="org-membership-textual membership-owner-textual"
                                        v-if="orgInfo.role == MemberRole.OWNER"
                                        >Owner</span
                                    >
                                    <span
                                        class="org-membership-textual membership-admin-textual"
                                        v-if="orgInfo.role == MemberRole.ADMIN"
                                        >Admin</span
                                    >
                                    <span
                                        class="org-membership-textual membership-moderator-textual"
                                        v-if="orgInfo.role == MemberRole.MODERATOR"
                                        >Moderator</span
                                    >
                                    <span
                                        class="org-membership-textual membership-user-textual"
                                        v-if="orgInfo.role == MemberRole.USER"
                                        >User</span
                                    >.
                                </span>
                                <span>This organization is owned by </span>
                                <span v-if="orgInfo.created_by">
                                    {{ orgInfo.created_by.last_name }}
                                    {{ orgInfo.created_by.first_name }} ({{
                                        orgInfo.created_by.email
                                    }})
                                </span>
                                <span v-else> Deleted User </span>
                                <span v-if="orgInfo.number_of_members > 1">
                                    and has {{ orgInfo.number_of_members }} members.
                                </span>
                                <span v-else>
                                    and has {{ orgInfo.number_of_members }} member.
                                </span>
                            </div>
                            <div
                                class="flex flex-col gap-1"
                                style="font-weight: 500; color: rgb(93, 93, 93)"
                            >
                                <div>
                                    Invite created on:
                                    {{ moment(orgInfo.invite_created_on).format('LL') }}
                                </div>
                            </div>
                            <div class="flex flex-row gap-2">
                                <BlueButton @click="joinOrg">
                                    <template #text> Join Organization </template>
                                </BlueButton>
                                <NormalButton @click="router.back">
                                    <template #text> Cancel </template>
                                </NormalButton>
                            </div>
                            <div><div class="divider"></div></div>
                            <div class="flex flex-col gap-2">
                                <div>
                                    <a href="">Block all furhter invites from this organization</a>
                                </div>
                                <div>
                                    <a href="">Block all furhter invites from any organization</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-if="orgInfo">
                        <h2>Faq</h2>
                        <div class="flex flex-row gap-5 flex-wrap faq-wrapper">
                            <FaqBox>
                                <template #question
                                    >What happens when I join an organization?</template
                                >
                                <template #answer
                                    >When you accept an organization you will be able to collaborate
                                    with people in that organization.</template
                                >
                            </FaqBox>
                            <FaqBox>
                                <template #question
                                    >Can I leave an organization I did not intend to join?</template
                                >
                                <template #answer
                                    >Yes, you can always leave an organization. Go the Organizations
                                    > View, and then click on 'Manage Organization'. Lastly click on
                                    'Leave the organization'.</template
                                >
                            </FaqBox>
                            <FaqBox>
                                <template #question
                                    >I do not wish to receive these invitations and emails
                                    anymore.</template
                                >
                                <template #answer
                                    >Simply click on the links above the FAQ. The first allows you
                                    to block invites from this particular organization. The second
                                    allows you to block all invites from all
                                    organizations.</template
                                >
                            </FaqBox>
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
                                                Users cannot manage any part of an organization.
                                                They may however import projects, start analyses and
                                                view the analyses results.
                                            </div>
                                        </li>
                                        <li>
                                            <div>Moderators</div>
                                            <div>
                                                In addition to the permissions of the User role,
                                                Moderators can manage certain parts of an
                                                organization, such as managing invites, and members.
                                            </div>
                                        </li>
                                        <li>
                                            <div>Admin</div>
                                            <div>
                                                In addition to the permissions of the Moderators
                                                role, Admins can also add integrations with external
                                                services.
                                            </div>
                                        </li>
                                        <li>
                                            <div>Owner</div>
                                            <div>
                                                The role 'Owner' is reserverd for people that
                                                created the organization. They can manage all parts
                                                of an organization.
                                            </div>
                                        </li>
                                    </ul>
                                </template>
                            </FaqBox>
                            <FaqBox>
                                <template #question
                                    >The inviter or owner of the org shows as 'Deleted User', what
                                    now?</template
                                >
                                <template #answer
                                    >We recommend not joining an organization where the person that
                                    invited you shows as 'Deleted user'. The same applies if the
                                    owner of the organization shows as 'Deleted user'. This is
                                    usually an indicator that this organization was created for spam
                                    purposes.</template
                                >
                            </FaqBox>
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '@/assets/colors.scss';
.join-org-wrapper {
    .circle-org-avatar {
        width: 25px;
        height: 25px;
        border-radius: 5px;
    }
}

.org-membership-textual {
    font-weight: 900;
}

.membership-owner-textual {
    color: #dab909;
}

.membership-admin-textual {
    color: #e63434;
}

.membership-moderator-textual {
    color: $accent;
}

.membership-user-textual {
    color: #808e64;
}
</style>

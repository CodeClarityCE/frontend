<script lang="ts" setup>
import FaqBox from '@/base_components/layout/FaqBox.vue';
import router from '@/router';
import Button from '@/shadcn/ui/button/Button.vue';
import { useAuthStore } from '@/stores/auth';
import { type APIErrors } from '@/utils/api/ApiErrors';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { formatDate } from '@/utils/dateUtils';
import { successToast } from '@/utils/toasts';
import { Icon } from '@iconify/vue';
import { onMounted, ref, type Ref } from 'vue';
import { type OrganizationInfoForInvitee, MemberRole } from '../organization.entity';
import { OrgRepository } from '../organization.repository';

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
        void router.push('/');
        return;
    }

    inviteToken.value = _token;
    userEmailHash.value = _userEmailHash;
    orgId.value = _orgId;

    void fetchOrgInfo();
});

async function fetchOrgInfo(): Promise<void> {
    if (!authStore.getAuthenticated || !userEmailHash.value || !orgId.value || !inviteToken.value)
        return;
    if (!authStore.getAuthenticated || !authStore.getToken) return;

    try {
        const _orgInfo = await orgRepository.getOrgInfoAsInvitedMember({
            bearerToken: authStore.getToken,
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

async function joinOrg(): Promise<void> {
    if (!authStore.getAuthenticated || !userEmailHash.value || !orgId.value || !inviteToken.value)
        return;
    if (!authStore.getAuthenticated || !authStore.getToken) return;

    try {
        await orgRepository.joinOrgViaInvitation({
            bearerToken: authStore.getToken,
            orgId: orgId.value,
            data: {
                token: inviteToken.value,
                email_digest: userEmailHash.value
            },
            handleBusinessErrors: true
        });

        void router.push({ name: 'orgs', params: { page: 'manage', orgId: orgId.value } });
        void successToast('Successfully joined the org');
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
    <div class="flex flex-col items-center">
        <div v-if="joinOrgResp">
            <div v-if="joinError" class="flex flex-col gap-5 w-fit">
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
                                <div v-if="joinErrorCode" style="font-size: 0.7em">
                                    <div
                                        v-if="
                                            (joinErrorCode as APIErrors) ===
                                            APIErrors.InvitationInvalidOrExpired
                                        "
                                    >
                                        This invite link does not exist or has expired.
                                    </div>
                                    <div v-else>
                                        We encountered an error while processing the join request.
                                    </div>
                                </div>
                                <div v-else style="font-size: 0.7em">
                                    <div>
                                        We encountered an error while processing the join request.
                                    </div>
                                </div>
                            </div>
                            <div class="flex flex-row gap-2 items-center flex-wrap">
                                <Button
                                    v-if="
                                        joinErrorCode !== APIErrors.NotAuthorized &&
                                        joinErrorCode !== APIErrors.EntityNotFound
                                    "
                                    @click="joinOrg"
                                >
                                    Try again
                                </Button>
                                <Button @click="router.back"> Go back </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <template v-else>
            <div class="flex flex-col gap-4">
                <div v-if="fetchError">
                    <div class="flex flex-col gap-5 w-fit" style="font-size: 1.5em">
                        <div class="flex flex-row gap-2">
                            <Icon class="icon user-icon" icon="confounded-square-outline"></Icon>
                            <div>
                                <div class="flex flex-col gap-5">
                                    <div class="flex flex-col gap-2">
                                        <div>We failed to retrieve information on the invite</div>
                                        <div v-if="fetchErrorCode" style="font-size: 0.7em">
                                            <div
                                                v-if="
                                                    fetchErrorCode === APIErrors.EntityNotFound ||
                                                    fetchErrorCode === APIErrors.NotAuthorized
                                                "
                                            >
                                                This invite link does not exist or has expired.
                                            </div>
                                            <div v-else>
                                                We encountered an error while retrieving the invite
                                                information.
                                            </div>
                                        </div>
                                        <div v-else style="font-size: 0.7em">
                                            <div>
                                                We encountered an error while retrieving the invite
                                                information.
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex flex-row gap-2 items-center flex-wrap">
                                        <Button
                                            v-if="
                                                joinErrorCode !== APIErrors.NotAuthorized &&
                                                joinErrorCode !== APIErrors.EntityNotFound
                                            "
                                            @click="fetchOrgInfo"
                                        >
                                            Try again
                                        </Button>
                                        <Button @click="router.back"> Go back </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="orgInfo" class="flex flex-col gap-4 w-1/2 self-center">
                    <div class="text-xl">
                        Join the
                        <span class="text-theme-primary font-semibold">{{ orgInfo.name }}</span>
                        organization?
                    </div>
                    <div class="flex flex-col gap-2">
                        <div class="flex flex-row gap-2 items-center">
                            <Icon class="text-2xl" icon="iconoir:group"></Icon>
                            <div class="text-2xl">
                                {{ orgInfo.name }}
                            </div>
                        </div>
                        <div class="ml-8">
                            {{ orgInfo.description }}
                        </div>
                    </div>
                    <div class="text-secondary-foreground">
                        <span
                            v-if="orgInfo.invite_created_by"
                            class="text-theme-primary font-semibold"
                        >
                            {{ orgInfo.invite_created_by.last_name }}
                            {{ orgInfo.invite_created_by.first_name }} ({{
                                orgInfo.invite_created_by.email
                            }})
                        </span>
                        <span v-else> Deleted User </span>
                        <span>
                            has invited you to join the Organization '<span
                                class="text-theme-primary font-semibold"
                                >{{ orgInfo.name }}</span
                            >' as a
                            <span
                                v-if="orgInfo.role === MemberRole.OWNER"
                                class="font-bold text-severity-medium"
                                >Owner</span
                            >
                            <span
                                v-if="orgInfo.role === MemberRole.ADMIN"
                                class="font-bold text-severity-high"
                                >Admin</span
                            >
                            <span
                                v-if="orgInfo.role === MemberRole.MODERATOR"
                                class="font-bold text-severity-low"
                                >Moderator</span
                            >
                            <span
                                v-if="orgInfo.role === MemberRole.USER"
                                class="font-bold text-severity-none"
                                >User</span
                            >.
                        </span>
                        <span>This organization is owned by </span>
                        <span v-if="orgInfo.created_by">
                            {{ orgInfo.created_by.last_name }}
                            {{ orgInfo.created_by.first_name }} ({{ orgInfo.created_by.email }})
                        </span>
                        <span v-else> Deleted User </span>
                        <span v-if="orgInfo.number_of_members > 1">
                            and has {{ orgInfo.number_of_members }} members.
                        </span>
                        <span v-else> and has {{ orgInfo.number_of_members }} member. </span>
                    </div>
                    <div class="flex flex-col gap-1 font-semibold">
                        <div>
                            Invite created on:
                            {{ formatDate(orgInfo.invite_created_on, 'LL') }}
                        </div>
                    </div>
                    <div class="flex flex-row gap-2">
                        <Button class="rounded-full" @click="joinOrg">Join Organization</Button>
                        <Button class="rounded-full" variant="outline" @click="router.back">
                            Cancel
                        </Button>
                    </div>
                    <div>
                        <div class="divider"></div>
                    </div>
                    <div class="flex flex-col gap-2 w-1/2 self-center">
                        <Button class="rounded-full" variant="destructive">
                            <a href="">Block all further invites from this organization</a>
                        </Button>
                        <Button class="rounded-full" variant="destructive">
                            <a href="">Block all further invites from any organization</a>
                        </Button>
                    </div>
                </div>
                <div v-if="orgInfo" class="w-2/3 self-center">
                    <h2 class="text-2xl">Faq</h2>
                    <div class="flex flex-row gap-5 flex-wrap">
                        <FaqBox>
                            <template #question>What happens when I join an organization?</template>
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
                                >Yes, you can always leave an organization. Go the Organizations >
                                View, and then click on 'Manage Organization'. Lastly click on
                                'Leave the organization'.</template
                            >
                        </FaqBox>
                        <FaqBox>
                            <template #question
                                >I do not wish to receive these invitations and emails
                                anymore.</template
                            >
                            <template #answer
                                >Simply click on the links above the FAQ. The first allows you to
                                block invites from this particular organization. The second allows
                                you to block all invites from all organizations.</template
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
                                            Users cannot manage any part of an organization. They
                                            may however import projects, start analyses and view the
                                            analyses results.
                                        </div>
                                    </li>
                                    <li>
                                        <div>Moderators</div>
                                        <div>
                                            In addition to the permissions of the User role,
                                            Moderators can manage certain parts of an organization,
                                            such as managing invites, and members.
                                        </div>
                                    </li>
                                    <li>
                                        <div>Admin</div>
                                        <div>
                                            In addition to the permissions of the Moderators role,
                                            Admins can also add integrations with external services.
                                        </div>
                                    </li>
                                    <li>
                                        <div>Owner</div>
                                        <div>
                                            The role 'Owner' is reserverd for people that created
                                            the organization. They can manage all parts of an
                                            organization.
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
                                invited you shows as 'Deleted user'. The same applies if the owner
                                of the organization shows as 'Deleted user'. This is usually an
                                indicator that this organization was created for spam
                                purposes.</template
                            >
                        </FaqBox>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

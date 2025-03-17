<script lang="ts" setup>
import { MemberRole } from '@/codeclarity_components/organizations/organization.entity';
import { Icon } from '@iconify/vue';
import moment from 'moment';
import { type Organization } from '@/codeclarity_components/organizations/organization.entity';
import { OrgRepository } from '@/codeclarity_components/organizations/organization.repository';
import { useAuthStore } from '@/stores/auth';
import { ref, type Ref } from 'vue';
import BoxLoader from '@/base_components/BoxLoader.vue';
import { APIErrors } from '@/utils/api/ApiErrors';
import router from '@/router';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import Badge from '@/shadcn/ui/badge/Badge.vue';
import Button from '@/shadcn/ui/button/Button.vue';

const loading: Ref<boolean> = ref(false);
const orgInfo: Ref<Organization | undefined> = ref();
const errorCode: Ref<string | undefined> = ref();
const error: Ref<boolean> = ref(false);
const orgRepo = new OrgRepository();
const authStore = useAuthStore();

const props = defineProps<{
    orgId: string;
}>();

async function fetchOrgInfo() {
    if (!props.orgId) return;
    if (authStore.getAuthenticated && authStore.getToken) {
        loading.value = true;
        error.value = false;
        errorCode.value = '';
        try {
            const org = await orgRepo.get({
                orgId: props.orgId,
                bearerToken: authStore.getToken,
                handleBusinessErrors: true
            });
            orgInfo.value = org;
            emit('onOrgInfo', org);
        } catch (err) {
            error.value = true;
            if (err instanceof BusinessLogicError) {
                errorCode.value == err.error_code;
            }
            console.error(err);
            emit('onOrgInfoError', err);
        } finally {
            loading.value = false;
        }
    }
}

function init() {
    fetchOrgInfo();
}

const emit = defineEmits<{
    (e: 'onOrgInfo', orgInfo: Organization): void;
    (e: 'onOrgInfoError', error: any): void;
}>();

init();
</script>
<template>
    <div v-if="loading" class="org-header-item-wrapper">
        <div class="flex flex-col gap-2">
            <div class="flex flex-row gap-2 justify-between">
                <BoxLoader :dimensions="{ width: '20%', height: '30px' }" />
                <BoxLoader :dimensions="{ width: '10%', height: '30px' }" />
            </div>
            <BoxLoader :dimensions="{ width: '30%', height: '30px' }" />
            <BoxLoader :dimensions="{ width: '30%', height: '30px' }" />
            <BoxLoader :dimensions="{ width: '60%', height: '30px' }" />
        </div>
    </div>
    <div v-else-if="error" class="w-full h-full flex flex-row justify-center mt-20">
        <div class="flex flex-col gap-5 w-fit text-2xl">
            <div class="flex flex-row gap-2">
                <Icon
                    class="icon user-icon"
                    icon="solar:confounded-square-outline"
                    style="font-size: 3rem; height: fit-content"
                ></Icon>
                <div>
                    <div class="flex flex-col gap-5">
                        <div class="flex flex-col gap-2">
                            <div>We failed to retrieve information on the organization</div>
                            <div style="font-size: 0.7em" v-if="errorCode">
                                <div v-if="errorCode == APIErrors.EntityNotFound">
                                    This organization does not exist.
                                </div>
                                <div v-if="errorCode == APIErrors.NotAuthorized">
                                    You do not have the correct permissions to view this
                                    organization.
                                </div>
                                <div v-else>
                                    We encountered an error while retrieving the organization
                                    information.
                                </div>
                            </div>
                            <div style="font-size: 0.7em" v-else>
                                <div>
                                    We encountered an error while retrieving the organization
                                    information.
                                </div>
                            </div>
                        </div>
                        <div class="flex flex-row gap2 items-center flex-wrap">
                            <Button
                                v-if="errorCode != APIErrors.NotAuthorized"
                                @click="fetchOrgInfo()"
                            >
                                Try again
                            </Button>
                            <Button @click="router.back()"> Go back </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="flex flex-col w-full org-header-item-wrapper bg-gray-100 p-12" v-else-if="orgInfo">
        <div class="flex flex-row gap-3 items-center w-full" style="margin-bottom: 0.5em">
            <div class="flex flex-col w-full">
                <div class="flex flex-row gap-1 justify-between w-full">
                    <div>
                        <div class="flex flex-row gap-2 items-center flex-wrap w-full">
                            <div class="font-medium text-3xl">
                                {{ orgInfo.name }}
                            </div>
                            <Badge v-if="orgInfo.role == MemberRole.OWNER">Owner</Badge>
                            <Badge v-if="orgInfo.role == MemberRole.ADMIN">Admin</Badge>
                            <Badge v-if="orgInfo.role == MemberRole.MODERATOR">Moderator</Badge>
                            <Badge v-if="orgInfo.role == MemberRole.USER">User</Badge>
                            <Badge
                                v-if="orgInfo.personal"
                                title="A personal organization is a private org to which only you have access. Other people cannot be invited to join this type of organziation."
                            >
                                Personnal Org</Badge
                            >
                        </div>
                    </div>
                    <div class="flex flex-row gap-1 w-fit items-center">
                        <div class="flex flex-row gap-4 w-fit items-center">
                            <div class="flex flex-col items-end">
                                <div class="text-yellow font-black">Owner</div>
                                <div v-if="orgInfo.created_by">
                                    @{{ orgInfo.created_by.handle }}
                                </div>
                                <div v-if="!orgInfo.created_by">Deleted user</div>
                            </div>
                            <div class="user-avatar-wrapper">
                                <div v-if="orgInfo.created_by">
                                    <div v-if="orgInfo.created_by.avatar_url">
                                        <img
                                            class="rounded-full w-10 h-10"
                                            :src="orgInfo.created_by.avatar_url"
                                        />
                                    </div>
                                    <div
                                        v-if="!orgInfo.created_by.avatar_url"
                                        class="bg-gray-200 rounded-full w-10 h-10 flex flex-row items-center justify-center"
                                    >
                                        <Icon
                                            class="text-2xl text-black"
                                            icon="solar:smile-circle-broken"
                                        ></Icon>
                                    </div>
                                </div>
                                <div v-else>
                                    <div class="user-avatar-inner-wrapper">
                                        <Icon
                                            class="text-2xl text-black"
                                            icon="solar:confounded-square-outline"
                                        ></Icon>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="flex flex-col gap-5">
            <div class="flex flex-col gap-1 font-normal text-gray-500">
                <div>Joined on {{ moment(orgInfo.joined_on).format('LL') }}</div>
                <div class="flex-row flex-row-10">
                    Number of members:
                    <span
                        style="
                            padding: 3px 12px;
                            background-color: rgb(222, 222, 222);
                            border-radius: 15px;
                            font-size: 0.8em;
                        "
                        >{{ orgInfo.number_of_members }}</span
                    >
                </div>
                <div>
                    {{ orgInfo.description }}
                </div>
            </div>
        </div>
    </div>
</template>

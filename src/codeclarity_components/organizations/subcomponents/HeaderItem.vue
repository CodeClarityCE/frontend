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
                errorCode.value = err.error_code;
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
                            <div v-if="errorCode" style="font-size: 0.7em">
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
                            <div v-else style="font-size: 0.7em">
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
    <div
        v-else-if="orgInfo"
        class="flex flex-col w-full org-header-item-wrapper bg-white border-b border-gray-200 px-8 py-12"
    >
        <div class="max-w-4xl mx-auto w-full">
            <div class="flex flex-row gap-6 items-center justify-between w-full mb-6">
                <div class="flex flex-col">
                    <div class="flex flex-row gap-3 items-center flex-wrap mb-3">
                        <h1 class="font-bold text-4xl text-gray-900">
                            {{ orgInfo.name }}
                        </h1>
                        <div class="flex flex-row gap-2">
                            <Badge
                                v-if="orgInfo.role == MemberRole.OWNER"
                                class="bg-blue-100 text-blue-800 border-blue-200"
                                >Owner</Badge
                            >
                            <Badge
                                v-if="orgInfo.role == MemberRole.ADMIN"
                                class="bg-green-100 text-green-800 border-green-200"
                                >Admin</Badge
                            >
                            <Badge
                                v-if="orgInfo.role == MemberRole.MODERATOR"
                                class="bg-orange-100 text-orange-800 border-orange-200"
                                >Moderator</Badge
                            >
                            <Badge
                                v-if="orgInfo.role == MemberRole.USER"
                                class="bg-gray-100 text-gray-800 border-gray-200"
                                >User</Badge
                            >
                            <Badge
                                v-if="orgInfo.personal"
                                class="bg-purple-100 text-purple-800 border-purple-200"
                                title="A personal organization is a private org to which only you have access. Other people cannot be invited to join this type of organization."
                            >
                                Personal Org
                            </Badge>
                        </div>
                    </div>
                </div>

                <div class="flex flex-row gap-4 items-center">
                    <div class="text-right">
                        <div class="text-sm font-semibold text-gray-900 mb-1">Owner</div>
                        <div class="text-sm text-gray-600">
                            <span v-if="orgInfo.created_by">@{{ orgInfo.created_by.handle }}</span>
                            <span v-else class="text-gray-400">Deleted user</span>
                        </div>
                    </div>
                    <div class="flex-shrink-0">
                        <div v-if="orgInfo.created_by">
                            <div v-if="orgInfo.created_by.avatar_url">
                                <img
                                    class="rounded-full w-12 h-12 border-2 border-gray-200"
                                    :src="orgInfo.created_by.avatar_url"
                                    :alt="orgInfo.created_by.handle"
                                />
                            </div>
                            <div
                                v-else
                                class="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center border-2 border-gray-200"
                            >
                                <Icon
                                    class="text-2xl text-gray-600"
                                    icon="solar:smile-circle-broken"
                                />
                            </div>
                        </div>
                        <div v-else>
                            <div
                                class="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center border-2 border-gray-200"
                            >
                                <Icon
                                    class="text-2xl text-gray-400"
                                    icon="solar:confounded-square-outline"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div
                    class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200"
                >
                    <div
                        class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"
                    >
                        <Icon icon="solar:calendar-bold-duotone" class="text-lg text-blue-600" />
                    </div>
                    <div>
                        <div class="font-semibold text-gray-900">Joined</div>
                        <div class="text-gray-600">
                            {{ moment(orgInfo.joined_on).format('LL') }}
                        </div>
                    </div>
                </div>

                <div
                    class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200"
                >
                    <div
                        class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"
                    >
                        <Icon
                            icon="solar:users-group-rounded-bold-duotone"
                            class="text-lg text-green-600"
                        />
                    </div>
                    <div>
                        <div class="font-semibold text-gray-900">Members</div>
                        <div class="text-gray-600">{{ orgInfo.number_of_members }}</div>
                    </div>
                </div>

                <div
                    v-if="orgInfo.description"
                    class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200"
                >
                    <div
                        class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center"
                    >
                        <Icon
                            icon="solar:document-text-bold-duotone"
                            class="text-lg text-purple-600"
                        />
                    </div>
                    <div>
                        <div class="font-semibold text-gray-900">Description</div>
                        <div class="text-gray-600">{{ orgInfo.description }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

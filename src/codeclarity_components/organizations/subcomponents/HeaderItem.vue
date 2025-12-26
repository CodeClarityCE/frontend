<script lang="ts" setup>
import InfoCard from '@/base_components/ui/cards/InfoCard.vue';
import BoxLoader from '@/base_components/ui/loaders/BoxLoader.vue';
import {
    MemberRole,
    type Organization
} from '@/codeclarity_components/organizations/organization.entity';
import { OrgRepository } from '@/codeclarity_components/organizations/organization.repository';
import router from '@/router';
import Badge from '@/shadcn/ui/badge/Badge.vue';
import Button from '@/shadcn/ui/button/Button.vue';
import { useAuthStore } from '@/stores/auth';
import { APIErrors } from '@/utils/api/ApiErrors';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { formatDate, formatCurrentDate } from '@/utils/dateUtils';
import { Icon } from '@iconify/vue';
import { ref, type Ref } from 'vue';

const loading: Ref<boolean> = ref(false);
const orgInfo: Ref<Organization | undefined> = ref();
const errorCode: Ref<string | undefined> = ref();
const error: Ref<boolean> = ref(false);
const orgRepo = new OrgRepository();
const authStore = useAuthStore();

const props = defineProps<{
    orgId: string;
}>();

async function fetchOrgInfo(): Promise<void> {
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
            void emit('onOrgInfo', org);
        } catch (err) {
            error.value = true;
            if (err instanceof BusinessLogicError) {
                errorCode.value = err.error_code;
            }
            console.error(err);
            void emit('onOrgInfoError', err as Error | BusinessLogicError);
        } finally {
            loading.value = false;
        }
    }
}

function init(): void {
    void fetchOrgInfo();
}

const emit = defineEmits<{
    (e: 'onOrgInfo', orgInfo: Organization): void;
    (e: 'onOrgInfoError', error: Error | BusinessLogicError): void;
}>();

void init();
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
                                <div v-if="errorCode === APIErrors.EntityNotFound">
                                    This organization does not exist.
                                </div>
                                <div v-if="errorCode === APIErrors.NotAuthorized">
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
                                v-if="errorCode !== APIErrors.NotAuthorized"
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
    <div v-else-if="orgInfo" class="flex flex-col w-full org-header-item-wrapper px-8 py-6">
        <div class="max-w-4xl mx-auto w-full">
            <InfoCard
                :title="orgInfo.name"
                description="Organization Details"
                icon="solar:buildings-2-bold-duotone"
                class="mb-6"
            >
                <!-- Organization Header with Badges and Owner -->
                <div
                    class="flex flex-col lg:flex-row gap-6 items-start justify-between w-full mb-6"
                >
                    <!-- Left Section: Key Info First -->
                    <div class="flex-1">
                        <!-- Most Important: Role & Status -->
                        <div class="flex flex-row gap-2 flex-wrap mb-4">
                            <Badge
                                v-if="orgInfo.role === MemberRole.OWNER"
                                class="bg-theme-primary text-white border-theme-primary flex items-center gap-1 font-medium"
                            >
                                <Icon icon="solar:crown-bold" class="text-xs" />
                                Owner
                            </Badge>
                            <Badge
                                v-else-if="orgInfo.role === MemberRole.ADMIN"
                                class="bg-theme-black text-white border-theme-black flex items-center gap-1 font-medium"
                            >
                                <Icon icon="solar:shield-check-bold" class="text-xs" />
                                Admin
                            </Badge>
                            <Badge
                                v-else-if="orgInfo.role === MemberRole.MODERATOR"
                                class="bg-theme-primary/80 text-white border-theme-primary flex items-center gap-1 font-medium"
                            >
                                <Icon icon="solar:star-bold" class="text-xs" />
                                Moderator
                            </Badge>
                            <Badge
                                v-else
                                class="bg-gray-600 text-white border-gray-600 flex items-center gap-1 font-medium"
                            >
                                <Icon icon="solar:user-bold" class="text-xs" />
                                Member
                            </Badge>

                            <Badge
                                v-if="orgInfo.personal"
                                class="bg-purple-600 text-white border-purple-600 flex items-center gap-1 font-medium"
                                title="A personal organization is a private org to which only you have access. Other people cannot be invited to join this type of organization."
                            >
                                <Icon icon="solar:lock-bold" class="text-xs" />
                                Personal
                            </Badge>
                        </div>

                        <!-- Quick Stats in Compact Format -->
                        <div class="flex items-center gap-6 text-sm text-theme-gray mb-4">
                            <div class="flex items-center gap-2">
                                <Icon
                                    icon="solar:users-group-rounded-bold"
                                    class="text-theme-primary"
                                />
                                <span class="font-medium text-theme-black">{{
                                    orgInfo.number_of_members
                                }}</span>
                                <span>{{
                                    orgInfo.number_of_members === 1 ? 'member' : 'members'
                                }}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <Icon icon="solar:calendar-bold" class="text-theme-primary" />
                                <span
                                    >Joined
                                    {{ formatDate(orgInfo.joined_on, 'MMM DD, YYYY') }}</span
                                >
                            </div>
                        </div>

                        <!-- Organization Description if available -->
                        <div
                            v-if="orgInfo.description"
                            class="bg-gray-50 rounded-lg p-4 border border-gray-200"
                        >
                            <p class="text-theme-gray leading-relaxed text-sm">
                                {{ orgInfo.description }}
                            </p>
                        </div>
                    </div>

                    <!-- Right Section: Owner Info Card - More Prominent -->
                    <div
                        class="bg-gradient-to-br from-theme-primary/5 to-theme-primary/10 rounded-xl p-5 border border-theme-primary/20 min-w-0 lg:w-80"
                    >
                        <div class="flex items-center gap-4">
                            <div class="flex-shrink-0">
                                <div v-if="orgInfo.created_by">
                                    <div v-if="orgInfo.created_by.avatar_url" class="relative">
                                        <img
                                            class="rounded-full w-14 h-14 border-3 border-white shadow-lg"
                                            :src="orgInfo.created_by.avatar_url"
                                            :alt="orgInfo.created_by.handle"
                                        />
                                        <div
                                            class="absolute -top-1 -right-1 w-5 h-5 bg-theme-primary rounded-full flex items-center justify-center shadow-sm"
                                        >
                                            <Icon
                                                icon="solar:crown-bold"
                                                class="text-white text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div
                                        v-else
                                        class="bg-white rounded-full w-14 h-14 flex items-center justify-center border-3 border-white shadow-lg relative"
                                    >
                                        <Icon
                                            class="text-2xl text-theme-primary"
                                            icon="solar:smile-circle-broken"
                                        />
                                        <div
                                            class="absolute -top-1 -right-1 w-5 h-5 bg-theme-primary rounded-full flex items-center justify-center shadow-sm"
                                        >
                                            <Icon
                                                icon="solar:crown-bold"
                                                class="text-white text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div v-else>
                                    <div
                                        class="bg-gray-200 rounded-full w-14 h-14 flex items-center justify-center border-3 border-white shadow-lg"
                                    >
                                        <Icon
                                            class="text-2xl text-gray-500"
                                            icon="solar:confounded-square-outline"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div
                                    class="text-xs text-theme-primary font-semibold mb-1 uppercase tracking-wide"
                                >
                                    Organization Owner
                                </div>
                                <div class="text-lg font-bold text-theme-black truncate">
                                    <span v-if="orgInfo.created_by"
                                        >@{{ orgInfo.created_by.handle }}</span
                                    >
                                    <span v-else class="text-gray-500">Deleted user</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action-Oriented Bottom Section -->
                <div class="pt-4 border-t border-gray-200">
                    <div class="flex items-center justify-between">
                        <div class="text-xs text-theme-gray">
                            <Icon icon="solar:info-circle-bold" class="inline mr-1" />
                            Use the management section below to configure this organization
                        </div>
                        <div class="flex items-center gap-2 text-xs text-theme-gray">
                            <Icon icon="solar:clock-circle-bold" class="text-theme-primary" />
                            <span>Last updated {{ formatCurrentDate('MMM DD') }}</span>
                        </div>
                    </div>
                </div>
            </InfoCard>
        </div>
    </div>
</template>

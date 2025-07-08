<script lang="ts" setup>
import {
    isMemberRoleGreaterOrEqualTo,
    MemberRole,
    Organization
} from '@/codeclarity_components/organizations/organization.entity';
import router from '@/router';
import { Icon } from '@iconify/vue';
import { ref, type Ref } from 'vue';
import HeaderItem from '@/codeclarity_components/organizations/subcomponents/HeaderItem.vue';
import { AnalyzerRepository } from '@/codeclarity_components/organizations/analyzers/AnalyzerRepository';
import { useAuthStore } from '@/stores/auth';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import BoxLoader from '@/base_components/ui/loaders/BoxLoader.vue';
import type { Analyzer } from '@/codeclarity_components/organizations/analyzers/Analyzer';
import InfoCard from '@/base_components/ui/cards/InfoCard.vue';
import StatCard from '@/base_components/ui/cards/StatCard.vue';
import Button from '@/shadcn/ui/button/Button.vue';
import Dialog from '@/shadcn/ui/dialog/Dialog.vue';
import DialogTrigger from '@/shadcn/ui/dialog/DialogTrigger.vue';
import DialogContent from '@/shadcn/ui/dialog/DialogContent.vue';
import DialogHeader from '@/shadcn/ui/dialog/DialogHeader.vue';
import DialogTitle from '@/shadcn/ui/dialog/DialogTitle.vue';
import DialogDescription from '@/shadcn/ui/dialog/DialogDescription.vue';
import DialogFooter from '@/shadcn/ui/dialog/DialogFooter.vue';
import DialogClose from '@/shadcn/ui/dialog/DialogClose.vue';

// Constantsr
const authStore = useAuthStore();

const analyzerRepo: AnalyzerRepository = new AnalyzerRepository();

const orgInfo: Ref<Organization | undefined> = ref();
const analyzers: Ref<Analyzer[]> = ref([]);
const loading: Ref<boolean> = ref(false);
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();

const props = defineProps<{
    action?: string;
    page?: string;
    orgId: string;
}>();

function setOrgInfo(_orgInfo: Organization) {
    orgInfo.value = _orgInfo;
    if (!isMemberRoleGreaterOrEqualTo(_orgInfo.role, MemberRole.ADMIN)) {
        router.push({ name: 'orgManage', params: { page: '', orgId: _orgInfo.id } });
    }
}

async function deleteAnalyzer(analyzerId: string) {
    if (!(authStore.getAuthenticated && authStore.getToken)) return;

    error.value = false;
    errorCode.value = undefined;
    loading.value = true;

    try {
        await analyzerRepo.deleteAnalyzer({
            orgId: props.orgId,
            analyzer_id: analyzerId,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true
        });
    } catch (err) {
        error.value = true;
        if (err instanceof BusinessLogicError) {
            errorCode.value = err.error_code;
        }
    } finally {
        loading.value = false;
        router.go(0);
    }
}

async function init() {
    await fetchAnalyzers();
}

async function fetchAnalyzers(refresh: boolean = false) {
    if (!(authStore.getAuthenticated && authStore.getToken)) return;

    error.value = false;
    errorCode.value = undefined;
    if (!refresh) loading.value = true;

    try {
        const resp = await analyzerRepo.getAnalyzers({
            orgId: props.orgId,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true,
            page: 0,
            entries_per_page: 0,
            search_key: ''
        });
        analyzers.value = resp.data;
    } catch (err) {
        error.value = true;
        if (err instanceof BusinessLogicError) {
            errorCode.value = err.error_code;
        }
    } finally {
        loading.value = false;
    }
}

init();
</script>
<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Page Header -->
        <HeaderItem v-if="orgId" :org-id="orgId" @on-org-info="setOrgInfo($event)" />

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-8 py-8">
            <!-- Analyzers Overview -->
            <InfoCard
                title="Analyzers"
                description="Manage your custom analyzer workflows"
                icon="solar:chart-square-bold"
                variant="primary"
                class="mb-8"
            >
                <!-- Quick Stats -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        label="Active Analyzers"
                        :value="analyzers.length"
                        icon="solar:check-circle-bold"
                        variant="success"
                        subtitle="Running workflows"
                    />

                    <StatCard
                        label="Total Workflows"
                        :value="analyzers.length"
                        icon="solar:chart-square-bold"
                        variant="default"
                        subtitle="All analyzers"
                    />
                </div>
            </InfoCard>

            <!-- Analyzers Section -->
            <InfoCard
                title="Analyzer Workflows"
                description="Manage your custom analysis workflows and configurations"
                icon="solar:settings-bold"
                variant="default"
                class="mb-8"
            >
                <div v-if="loading" class="flex flex-row gap-4 flex-wrap">
                    <BoxLoader
                        v-for="i in 4"
                        :key="i"
                        :dimensions="{ width: '300px', height: '200px' }"
                    />
                </div>

                <div v-if="!loading">
                    <div
                        v-if="error"
                        class="flex flex-row gap-4 items-center p-8 bg-red-50 border border-red-200 rounded-xl"
                    >
                        <Icon
                            class="text-red-500"
                            icon="solar:confounded-square-outline"
                            style="font-size: 3rem"
                        />
                        <div class="flex-1">
                            <div class="text-lg font-semibold text-red-700 mb-2">
                                Failed to fetch analyzers
                            </div>
                            <div v-if="errorCode" class="text-red-600 mb-4">
                                We encountered an error while processing the request.
                            </div>
                            <div v-else class="text-red-600 mb-4">
                                We encountered an error while processing the request.
                            </div>
                            <div class="flex flex-row gap-3">
                                <Button variant="destructive" @click="fetchAnalyzers"
                                    >Try again</Button
                                >
                                <Button variant="outline" @click="router.back">Go back</Button>
                            </div>
                        </div>
                    </div>

                    <div v-if="!error" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <!-- Analyzer Cards -->
                        <div
                            v-for="analyzer in analyzers"
                            :key="analyzer.id"
                            class="bg-white border rounded-xl p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-theme-primary"
                        >
                            <div class="flex items-center gap-3 mb-4">
                                <Icon
                                    icon="solar:chart-square-bold"
                                    class="text-4xl text-theme-primary"
                                />
                                <div>
                                    <h3 class="text-lg font-semibold text-theme-black">
                                        {{ analyzer.name }}
                                    </h3>
                                    <p class="text-sm text-theme-gray">
                                        {{ analyzer.description }}
                                    </p>
                                </div>
                            </div>

                            <div class="mb-6">
                                <div
                                    class="inline-flex px-3 py-1 text-sm font-medium bg-green-100 text-theme-primary rounded-full"
                                >
                                    <Icon icon="solar:check-circle-bold" class="mr-1 text-xs" />
                                    Active
                                </div>
                            </div>

                            <div class="flex gap-2">
                                <RouterLink
                                    :to="{
                                        name: 'orgs',
                                        params: {
                                            action: 'edit',
                                            page: 'analyzers',
                                            orgId: orgId
                                        },
                                        query: {
                                            analyzerId: analyzer.id
                                        }
                                    }"
                                    class="flex-1"
                                >
                                    <Button
                                        class="w-full bg-theme-black hover:bg-theme-gray text-white"
                                    >
                                        <Icon icon="solar:eye-bold" class="mr-2 text-sm" />
                                        Modify
                                    </Button>
                                </RouterLink>
                                <Dialog>
                                    <DialogTrigger as-child>
                                        <Button
                                            variant="outline"
                                            class="border-red-500 text-red-500 hover:bg-red-50"
                                        >
                                            <Icon
                                                icon="solar:trash-bin-trash-bold"
                                                class="text-sm"
                                            />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent class="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle>Confirm Deletion</DialogTitle>
                                            <DialogDescription>
                                                Are you sure you want to delete this analyzer?
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <DialogClose as-child>
                                                <Button variant="secondary">Cancel</Button>
                                            </DialogClose>
                                            <Button
                                                variant="destructive"
                                                @click="deleteAnalyzer(analyzer.id)"
                                            >
                                                Delete
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        <!-- Add Analyzer Card -->
                        <RouterLink
                            :to="{
                                name: 'orgs',
                                params: {
                                    action: 'add',
                                    page: 'analyzers',
                                    orgId: orgId
                                }
                            }"
                            class="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-theme-primary hover:bg-gray-50 transition-all duration-200 group"
                        >
                            <div
                                class="flex flex-col items-center justify-center h-full text-center"
                            >
                                <div class="flex items-center gap-3 mb-4">
                                    <Icon
                                        icon="solar:chart-square-bold"
                                        class="text-4xl text-gray-400 group-hover:text-theme-primary transition-colors"
                                    />
                                    <Icon
                                        icon="solar:add-circle-bold"
                                        class="text-2xl text-theme-primary"
                                    />
                                </div>
                                <h3 class="text-lg font-semibold text-theme-black mb-2">
                                    Add Analyzer
                                </h3>
                                <p class="text-sm text-theme-gray">
                                    Create a new analyzer workflow
                                </p>
                            </div>
                        </RouterLink>
                    </div>
                </div>
            </InfoCard>
        </div>
    </div>
</template>

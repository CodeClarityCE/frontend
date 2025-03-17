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
import BoxLoader from '@/base_components/BoxLoader.vue';
import type { Analyzer } from '@/codeclarity_components/organizations/analyzers/Analyzer';
import Card from '@/shadcn/ui/card/Card.vue';
import CardHeader from '@/shadcn/ui/card/CardHeader.vue';
import CardTitle from '@/shadcn/ui/card/CardTitle.vue';
import CardDescription from '@/shadcn/ui/card/CardDescription.vue';
import CardContent from '@/shadcn/ui/card/CardContent.vue';
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
    <div class="flex flex-col gap-8">
        <HeaderItem v-if="orgId" :org-id="orgId" @on-org-info="setOrgInfo($event)"></HeaderItem>
        <div class="org-integrations-wrapper">
            <div class="flex flex-col gap-4 p-12">
                <div class="text-secondary-foreground text-3xl font-semibold">Analyzers</div>

                <div v-if="loading">
                    <div class="integration-box-wrapper flex flex-row gap-4 flex-wrap">
                        <BoxLoader
                            v-for="i in 4"
                            :key="i"
                            :dimensions="{ width: '150px', height: '150px' }"
                        />
                    </div>
                </div>

                <div v-if="!loading">
                    <div v-if="error" class="flex flex-row gap-2">
                        <Icon
                            class="icon user-icon"
                            icon="solar:confounded-square-outline"
                            style="font-size: 3rem; height: fit-content"
                        ></Icon>
                        <div>
                            <div class="flex flex-col gap-5">
                                <div class="flex flex-col gap-2">
                                    <div>Failed to fetch VCS integrations</div>
                                    <div v-if="errorCode" style="font-size: 0.9em">
                                        We encountered an error while processing the request.
                                    </div>
                                    <div v-else style="font-size: 0.9eem">
                                        <div>
                                            We encountered an error while processing the request.
                                        </div>
                                    </div>
                                </div>
                                <div class="flex flex-row gap-2 items-center flex-wrap">
                                    <Button @click="fetchAnalyzers"> Try again </Button>
                                    <Button @click="router.back"> Go back </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        v-if="!error"
                        class="integration-box-wrapper flex flex-row gap-4 flex-wrap"
                    >
                        <div v-for="analyzer in analyzers" :key="analyzer.id">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{{ analyzer.name }}</CardTitle>
                                    <CardDescription>{{ analyzer.description }}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div class="grid grid-cols-2 gap-2">
                                        <Button>
                                            <RouterLink
                                                class="integration-box-wrapper-iteme"
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
                                            >
                                                Modify
                                            </RouterLink>
                                        </Button>

                                        <Dialog>
                                            <DialogTrigger>
                                                <Button variant="destructive">Delete</Button>
                                            </DialogTrigger>
                                            <DialogContent class="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle>Confirm Deletion</DialogTitle>
                                                    <DialogDescription>
                                                        Are you sure you want to delete this
                                                        analyzer?
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
                                </CardContent>
                            </Card>
                        </div>
                        <Button>
                            <RouterLink
                                class="flex flex-row gap-2 items-center"
                                :to="{
                                    name: 'orgs',
                                    params: {
                                        action: 'add',
                                        page: 'analyzers',
                                        orgId: orgId
                                    }
                                }"
                            >
                                <Icon class="text-3xl" icon="solar:add-circle-bold"></Icon> Add an
                                analyzer
                            </RouterLink>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

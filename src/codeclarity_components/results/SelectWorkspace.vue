<script setup lang="ts">
import { onMounted, ref, type Ref } from 'vue';
import { WorkspacesOutput } from './workspace.entity';
import { ResultsRepository } from './results.repository';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from '@/shadcn/ui/select';

export interface Props {
    analysisID?: string;
    projectID?: string;
}
const props = withDefaults(defineProps<Props>(), {
    projectID: '',
    analysisID: ''
});

// Repositories
const sbomRepo: ResultsRepository = new ResultsRepository();

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

// Models
const error = defineModel<boolean>('error', { default: false });
const selected_workspace = defineModel<string>('selected_workspace', { default: '.' });

const workspaces: Ref<WorkspacesOutput> = ref(new WorkspacesOutput());

async function getSbomWorkspaces() {
    if (!userStore.getDefaultOrg) return;
    if (!(authStore.getAuthenticated && authStore.getToken)) return;
    try {
        const res = await sbomRepo.getSbomWorkspaces({
            orgId: userStore.getDefaultOrg.id,
            projectId: props.projectID,
            analysisId: props.analysisID,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true
        });
        workspaces.value = res.data;
    } catch (_err) {
        console.error(_err);
        error.value = true;
        // if (_err instanceof BusinessLogicError) {
        //     errorCode.value = _err.error_code;
        // }
    }
}

onMounted(() => {
    getSbomWorkspaces();
});
</script>

<template>
    <div class="flex flex-col items-center">
        <Select
            @update:model-value="
                (e: string | number | null) => {
                    selected_workspace = e?.toString() || '';
                }
            "
        >
            <SelectTrigger class="w-[180px]">
                <SelectValue placeholder="Select a workspace" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Workspaces</SelectLabel>
                    <SelectItem
                        v-for="workspace of workspaces.workspaces"
                        :key="workspace"
                        :value="workspace"
                    >
                        {{ workspace }}
                    </SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
    </div>
</template>

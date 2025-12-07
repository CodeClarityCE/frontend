<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { Icon } from '@iconify/vue';
import { Button } from '@/shadcn/ui/button';
import { Input } from '@/shadcn/ui/input';
import { Label } from '@/shadcn/ui/label';
import { Checkbox } from '@/shadcn/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shadcn/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shadcn/ui/tabs';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { TicketsRepository } from '../tickets.repository';
import {
    ExternalTicketProvider,
    type IntegrationConfigSummary,
    type IntegrationHierarchyItem
} from '../tickets.entity';

defineProps<{
    existingConfig?: IntegrationConfigSummary;
}>();

const emit = defineEmits<{
    close: [];
    configured: [];
}>();

const { defaultOrg } = storeToRefs(useUserStore());
const auth = useAuthStore();
const ticketsRepository = new TicketsRepository();

// Form state
const authMethod = ref<'API_KEY' | 'OAUTH'>('API_KEY');
const apiKey = ref('');
const workspaceId = ref('');
const spaceId = ref('');
const folderId = ref('');
const listId = ref('');
const autoSyncOnCreate = ref(false);
const syncStatusChanges = ref(true);

// Hierarchy data
const workspaces = ref<IntegrationHierarchyItem[]>([]);
const spaces = ref<IntegrationHierarchyItem[]>([]);
const folders = ref<IntegrationHierarchyItem[]>([]);
const lists = ref<IntegrationHierarchyItem[]>([]);

// Loading states
const isLoadingWorkspaces = ref(false);
const isLoadingSpaces = ref(false);
const isLoadingFolders = ref(false);
const isLoadingLists = ref(false);
const isSaving = ref(false);
const isTesting = ref(false);

// Test result
const testResult = ref<{ success: boolean; message: string } | null>(null);

// Modal state
const isOpen = ref(true);

const canFetchWorkspaces = computed(() => {
    return authMethod.value === 'API_KEY' && apiKey.value.length > 0;
});

const canSave = computed(() => {
    return listId.value.length > 0;
});

function close() {
    isOpen.value = false;
    setTimeout(() => emit('close'), 300);
}

async function fetchWorkspaces() {
    if (!defaultOrg.value?.id || !auth.getToken || !canFetchWorkspaces.value) return;

    // First save the API key temporarily to fetch workspaces
    isLoadingWorkspaces.value = true;
    testResult.value = null;

    try {
        // We need to save a temporary config first to fetch hierarchy
        await ticketsRepository.configureClickUp({
            orgId: defaultOrg.value.id,
            data: {
                auth_method: authMethod.value,
                api_key: apiKey.value,
                list_id: 'temp' // Temporary, will be updated
            },
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });

        const response = await ticketsRepository.getWorkspaces({
            orgId: defaultOrg.value.id,
            provider: ExternalTicketProvider.CLICKUP,
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });
        workspaces.value = response.data;

        if (workspaces.value.length === 1) {
            workspaceId.value = workspaces.value[0].id;
        }

        testResult.value = { success: true, message: 'API key valid! Select your workspace.' };
    } catch {
        testResult.value = {
            success: false,
            message: 'Invalid API key or connection failed'
        };
        workspaces.value = [];
    } finally {
        isLoadingWorkspaces.value = false;
    }
}

async function fetchSpaces() {
    if (!defaultOrg.value?.id || !auth.getToken || !workspaceId.value) return;

    isLoadingSpaces.value = true;
    spaces.value = [];
    folders.value = [];
    lists.value = [];
    spaceId.value = '';
    folderId.value = '';
    listId.value = '';

    try {
        const response = await ticketsRepository.getSpaces({
            orgId: defaultOrg.value.id,
            provider: ExternalTicketProvider.CLICKUP,
            parentId: workspaceId.value,
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });
        spaces.value = response.data;
    } catch {
        console.error('Failed to fetch spaces');
    } finally {
        isLoadingSpaces.value = false;
    }
}

async function fetchFolders() {
    if (!defaultOrg.value?.id || !auth.getToken || !spaceId.value) return;

    isLoadingFolders.value = true;
    folders.value = [];
    lists.value = [];
    folderId.value = '';
    listId.value = '';

    try {
        const response = await ticketsRepository.getFolders({
            orgId: defaultOrg.value.id,
            provider: ExternalTicketProvider.CLICKUP,
            parentId: spaceId.value,
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });
        folders.value = response.data;

        // Also fetch folderless lists directly from space
        await fetchListsFromSpace();
    } catch {
        console.error('Failed to fetch folders');
    } finally {
        isLoadingFolders.value = false;
    }
}

async function fetchListsFromSpace() {
    // This fetches lists that are directly in a space (not in folders)
    // For simplicity, we'll load folder lists when folder is selected
}

async function fetchLists() {
    if (!defaultOrg.value?.id || !auth.getToken || !folderId.value) return;

    isLoadingLists.value = true;
    lists.value = [];
    listId.value = '';

    try {
        const response = await ticketsRepository.getLists({
            orgId: defaultOrg.value.id,
            provider: ExternalTicketProvider.CLICKUP,
            parentId: folderId.value,
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });
        lists.value = response.data;
    } catch {
        console.error('Failed to fetch lists');
    } finally {
        isLoadingLists.value = false;
    }
}

async function testConnection() {
    if (!defaultOrg.value?.id || !auth.getToken) return;

    isTesting.value = true;
    try {
        const response = await ticketsRepository.testIntegration({
            orgId: defaultOrg.value.id,
            provider: ExternalTicketProvider.CLICKUP,
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });

        if (response.data.success) {
            testResult.value = {
                success: true,
                message: `Connected as ${response.data.user_info?.name || 'Unknown'}`
            };
        } else {
            testResult.value = {
                success: false,
                message: response.data.error || 'Connection test failed'
            };
        }
    } catch {
        testResult.value = {
            success: false,
            message: 'Connection test failed'
        };
    } finally {
        isTesting.value = false;
    }
}

async function saveConfiguration() {
    if (!defaultOrg.value?.id || !auth.getToken || !canSave.value) return;

    isSaving.value = true;
    try {
        await ticketsRepository.configureClickUp({
            orgId: defaultOrg.value.id,
            data: {
                auth_method: authMethod.value,
                api_key: authMethod.value === 'API_KEY' ? apiKey.value : undefined,
                workspace_id: workspaceId.value || undefined,
                space_id: spaceId.value || undefined,
                folder_id: folderId.value || undefined,
                list_id: listId.value,
                auto_sync_on_create: autoSyncOnCreate.value,
                sync_status_changes: syncStatusChanges.value
            },
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });
        emit('configured');
    } catch (error) {
        console.error('Failed to save configuration:', error);
        testResult.value = {
            success: false,
            message: 'Failed to save configuration'
        };
    } finally {
        isSaving.value = false;
    }
}

// Watch for hierarchy changes
watch(workspaceId, () => {
    if (workspaceId.value) {
        fetchSpaces();
    }
});

watch(spaceId, () => {
    if (spaceId.value) {
        fetchFolders();
    }
});

watch(folderId, () => {
    if (folderId.value) {
        fetchLists();
    }
});
</script>

<template>
    <Teleport to="body">
        <!-- Backdrop -->
        <div
            class="fixed inset-0 bg-black/50 z-40 transition-opacity"
            :class="isOpen ? 'opacity-100' : 'opacity-0'"
            @click="close"
        />

        <!-- Modal -->
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                class="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden transition-all"
                :class="isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'"
                @click.stop
            >
                <!-- Header -->
                <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div class="flex items-center gap-3">
                        <div
                            class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"
                        >
                            <Icon icon="simple-icons:clickup" class="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h2 class="text-lg font-semibold text-gray-900">
                                {{ existingConfig ? 'Configure' : 'Connect' }} ClickUp
                            </h2>
                            <p class="text-sm text-gray-500">Sync tickets to ClickUp tasks</p>
                        </div>
                    </div>
                    <button
                        class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        @click="close"
                    >
                        <Icon icon="solar:close-circle-linear" class="w-6 h-6" />
                    </button>
                </div>

                <!-- Content -->
                <div class="px-6 py-6 overflow-y-auto max-h-[60vh]">
                    <Tabs v-model="authMethod" class="w-full">
                        <TabsList class="grid w-full grid-cols-2">
                            <TabsTrigger value="API_KEY">API Key</TabsTrigger>
                            <TabsTrigger value="OAUTH" disabled>
                                OAuth
                                <span class="ml-1 text-xs text-gray-400">(Soon)</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="API_KEY" class="space-y-4 mt-4">
                            <!-- API Key Input -->
                            <div class="space-y-2">
                                <Label for="api-key">ClickUp API Key</Label>
                                <div class="flex gap-2">
                                    <Input
                                        id="api-key"
                                        v-model="apiKey"
                                        type="password"
                                        placeholder="pk_xxxxxxxx"
                                        class="flex-1"
                                    />
                                    <Button
                                        variant="outline"
                                        :disabled="!canFetchWorkspaces || isLoadingWorkspaces"
                                        @click="fetchWorkspaces"
                                    >
                                        <Icon
                                            v-if="isLoadingWorkspaces"
                                            icon="solar:spinner-outline"
                                            class="w-4 h-4 mr-1 animate-spin"
                                        />
                                        Verify
                                    </Button>
                                </div>
                                <p class="text-xs text-gray-500">
                                    Get your API key from
                                    <a
                                        href="https://app.clickup.com/settings/apps"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="text-purple-600 hover:underline"
                                    >
                                        ClickUp Settings &rarr; Apps
                                    </a>
                                </p>
                            </div>

                            <!-- Test Result -->
                            <div
                                v-if="testResult"
                                class="p-3 rounded-lg text-sm"
                                :class="{
                                    'bg-green-50 text-green-700': testResult.success,
                                    'bg-red-50 text-red-700': !testResult.success
                                }"
                            >
                                <div class="flex items-center gap-2">
                                    <Icon
                                        v-if="testResult.success"
                                        icon="solar:check-circle-bold"
                                        class="w-4 h-4"
                                    />
                                    <Icon v-else icon="solar:close-circle-bold" class="w-4 h-4" />
                                    {{ testResult.message }}
                                </div>
                            </div>

                            <!-- Workspace Selector -->
                            <div v-if="workspaces.length > 0" class="space-y-2">
                                <Label for="workspace">Workspace</Label>
                                <Select v-model="workspaceId">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select workspace" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem
                                            v-for="workspace in workspaces"
                                            :key="workspace.id"
                                            :value="workspace.id"
                                        >
                                            {{ workspace.name }}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <!-- Space Selector -->
                            <div v-if="spaces.length > 0" class="space-y-2">
                                <Label for="space">Space</Label>
                                <Select v-model="spaceId" :disabled="isLoadingSpaces">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select space" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem
                                            v-for="space in spaces"
                                            :key="space.id"
                                            :value="space.id"
                                        >
                                            {{ space.name }}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <!-- Folder Selector -->
                            <div v-if="folders.length > 0" class="space-y-2">
                                <Label for="folder">Folder (optional)</Label>
                                <Select v-model="folderId" :disabled="isLoadingFolders">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select folder" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem
                                            v-for="folder in folders"
                                            :key="folder.id"
                                            :value="folder.id"
                                        >
                                            {{ folder.name }}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <!-- List Selector -->
                            <div v-if="lists.length > 0" class="space-y-2">
                                <Label for="list">List</Label>
                                <Select v-model="listId" :disabled="isLoadingLists">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select list" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem
                                            v-for="list in lists"
                                            :key="list.id"
                                            :value="list.id"
                                        >
                                            {{ list.name }}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <p class="text-xs text-gray-500">
                                    All synced tickets will be created as tasks in this list
                                </p>
                            </div>

                            <!-- Sync Options -->
                            <div v-if="listId" class="space-y-3 pt-4 border-t border-gray-200">
                                <h4 class="text-sm font-medium text-gray-700">Sync Options</h4>

                                <div class="flex items-center space-x-2">
                                    <Checkbox id="auto-sync" v-model:checked="autoSyncOnCreate" />
                                    <Label
                                        for="auto-sync"
                                        class="text-sm font-normal cursor-pointer"
                                    >
                                        Auto-sync new tickets to ClickUp
                                    </Label>
                                </div>

                                <div class="flex items-center space-x-2">
                                    <Checkbox
                                        id="sync-status"
                                        v-model:checked="syncStatusChanges"
                                    />
                                    <Label
                                        for="sync-status"
                                        class="text-sm font-normal cursor-pointer"
                                    >
                                        Sync status changes to ClickUp
                                    </Label>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="OAUTH" class="mt-4">
                            <div class="text-center py-8">
                                <Icon
                                    icon="solar:lock-linear"
                                    class="w-12 h-12 text-gray-300 mx-auto"
                                />
                                <p class="text-gray-500 mt-2">OAuth authentication coming soon</p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <!-- Footer -->
                <div
                    class="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50"
                >
                    <Button variant="outline" @click="close">Cancel</Button>
                    <div class="flex items-center gap-2">
                        <Button
                            v-if="existingConfig"
                            variant="outline"
                            :disabled="isTesting"
                            @click="testConnection"
                        >
                            <Icon
                                v-if="isTesting"
                                icon="solar:spinner-outline"
                                class="w-4 h-4 mr-1 animate-spin"
                            />
                            Test Connection
                        </Button>
                        <Button :disabled="!canSave || isSaving" @click="saveConfiguration">
                            <Icon
                                v-if="isSaving"
                                icon="solar:spinner-outline"
                                class="w-4 h-4 mr-2 animate-spin"
                            />
                            {{ existingConfig ? 'Save Changes' : 'Connect' }}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

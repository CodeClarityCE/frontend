<script setup lang="ts">
import { Button } from '@/shadcn/ui/button';
import { Checkbox } from '@/shadcn/ui/checkbox';
import { Input } from '@/shadcn/ui/input';
import { Label } from '@/shadcn/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shadcn/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shadcn/ui/tabs';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { Icon } from '@iconify/vue';
import { ref, computed, watch, onMounted } from 'vue';
import {
    ExternalTicketProvider,
    type IntegrationConfigSummary,
    type IntegrationHierarchyItem
} from '../tickets.entity';
import { TicketsRepository } from '../tickets.repository';

const props = defineProps<{
    existingConfig?: IntegrationConfigSummary;
}>();

const emit = defineEmits<{
    close: [];
    configured: [];
}>();

const userStore = useUserStore();
const auth = useAuthStore();
const ticketsRepository = new TicketsRepository();

// Form state
const authMethod = ref<'API_KEY' | 'OAUTH'>('API_KEY');
const apiKey = ref('');
const accessToken = ref(''); // OAuth access token
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
const isConnectingOAuth = ref(false);

// Create states
const isCreatingSpace = ref(false);
const isCreatingFolder = ref(false);
const isCreatingList = ref(false);
const newSpaceName = ref('');
const newFolderName = ref('');
const newListName = ref('');
const showCreateSpace = ref(false);
const showCreateFolder = ref(false);
const showCreateList = ref(false);

// Test result
const testResult = ref<{ success: boolean; message: string } | null>(null);

// Modal state
const isOpen = ref(true);

// OAuth state
const oauthConnected = ref(false);

const canFetchWorkspaces = computed(() => {
    if (authMethod.value === 'API_KEY') {
        return apiKey.value.length > 0;
    }
    return oauthConnected.value && accessToken.value.length > 0;
});

const canSave = computed(() => {
    return listId.value.length > 0;
});

function close(): void {
    isOpen.value = false;
    setTimeout(() => emit('close'), 300);
}

// OAuth redirect URI
function getOAuthRedirectUri(): string {
    return `${window.location.origin}/tickets/integrations/clickup/callback`;
}

async function copyRedirectUri(): Promise<void> {
    try {
        await navigator.clipboard.writeText(getOAuthRedirectUri());
        testResult.value = { success: true, message: 'Redirect URL copied to clipboard!' };
        setTimeout(() => {
            if (testResult.value?.message === 'Redirect URL copied to clipboard!') {
                testResult.value = null;
            }
        }, 2000);
    } catch {
        testResult.value = { success: false, message: 'Failed to copy URL' };
    }
}

async function startOAuthFlow(): Promise<void> {
    const orgId = userStore.defaultOrg?.id;
    const token = auth.getToken;
    if (!orgId || !token) return;

    isConnectingOAuth.value = true;
    testResult.value = null;

    try {
        const response = await ticketsRepository.getClickUpOAuthUrl({
            orgId,
            redirectUri: getOAuthRedirectUri(),
            bearerToken: token,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });

        // Store state in sessionStorage for callback verification
        sessionStorage.setItem('clickup_oauth_org_id', orgId);

        // Redirect to ClickUp OAuth
        window.location.href = response.data.url;
    } catch {
        testResult.value = {
            success: false,
            message: 'Failed to start OAuth flow. Make sure ClickUp OAuth is configured.'
        };
        isConnectingOAuth.value = false;
    }
}

async function fetchWorkspaces(): Promise<void> {
    if (!userStore.defaultOrg?.id || !auth.getToken || !canFetchWorkspaces.value) return;

    // First save the API key temporarily to fetch workspaces
    isLoadingWorkspaces.value = true;
    testResult.value = null;

    try {
        // We need to save a temporary config first to fetch hierarchy
        await ticketsRepository.configureClickUp({
            orgId: userStore.defaultOrg.id,
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
            orgId: userStore.defaultOrg.id,
            provider: ExternalTicketProvider.CLICKUP,
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });
        workspaces.value = response.data;

        if (workspaces.value.length === 1) {
            workspaceId.value = workspaces.value[0]?.id ?? '';
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

async function fetchSpaces(): Promise<void> {
    if (!userStore.defaultOrg?.id || !auth.getToken || !workspaceId.value) return;

    isLoadingSpaces.value = true;
    spaces.value = [];
    folders.value = [];
    lists.value = [];
    spaceId.value = '';
    folderId.value = '';
    listId.value = '';

    try {
        const response = await ticketsRepository.getSpaces({
            orgId: userStore.defaultOrg.id,
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

async function fetchFolders(): Promise<void> {
    if (!userStore.defaultOrg?.id || !auth.getToken || !spaceId.value) return;

    isLoadingFolders.value = true;
    folders.value = [];
    lists.value = [];
    folderId.value = '';
    listId.value = '';

    try {
        const response = await ticketsRepository.getFolders({
            orgId: userStore.defaultOrg.id,
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

async function fetchListsFromSpace(): Promise<void> {
    // This fetches lists that are directly in a space (not in folders)
    // For simplicity, we'll load folder lists when folder is selected
}

async function fetchLists(): Promise<void> {
    if (!userStore.defaultOrg?.id || !auth.getToken || !folderId.value) return;

    isLoadingLists.value = true;
    lists.value = [];
    listId.value = '';

    try {
        const response = await ticketsRepository.getLists({
            orgId: userStore.defaultOrg.id,
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

// Create functions
async function createSpace(): Promise<void> {
    if (
        !userStore.defaultOrg?.id ||
        !auth.getToken ||
        !workspaceId.value ||
        !newSpaceName.value.trim()
    )
        return;

    isCreatingSpace.value = true;
    try {
        const response = await ticketsRepository.createSpace({
            orgId: userStore.defaultOrg.id,
            provider: ExternalTicketProvider.CLICKUP,
            parentId: workspaceId.value,
            data: { name: newSpaceName.value.trim() },
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });

        // Add the new space to the list and select it
        spaces.value.push(response.data);
        spaceId.value = response.data.id;
        newSpaceName.value = '';
        showCreateSpace.value = false;
        testResult.value = { success: true, message: `Space "${response.data.name}" created!` };
    } catch {
        testResult.value = { success: false, message: 'Failed to create space' };
    } finally {
        isCreatingSpace.value = false;
    }
}

async function createFolder(): Promise<void> {
    if (
        !userStore.defaultOrg?.id ||
        !auth.getToken ||
        !spaceId.value ||
        !newFolderName.value.trim()
    )
        return;

    isCreatingFolder.value = true;
    try {
        const response = await ticketsRepository.createFolder({
            orgId: userStore.defaultOrg.id,
            provider: ExternalTicketProvider.CLICKUP,
            parentId: spaceId.value,
            data: { name: newFolderName.value.trim() },
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });

        // Add the new folder to the list and select it
        folders.value.push(response.data);
        folderId.value = response.data.id;
        newFolderName.value = '';
        showCreateFolder.value = false;
        testResult.value = { success: true, message: `Folder "${response.data.name}" created!` };
    } catch {
        testResult.value = { success: false, message: 'Failed to create folder' };
    } finally {
        isCreatingFolder.value = false;
    }
}

async function createList(): Promise<void> {
    if (!userStore.defaultOrg?.id || !auth.getToken || !newListName.value.trim()) return;

    isCreatingList.value = true;
    try {
        let response;
        if (folderId.value) {
            // Create list in folder
            response = await ticketsRepository.createList({
                orgId: userStore.defaultOrg.id,
                provider: ExternalTicketProvider.CLICKUP,
                parentId: folderId.value,
                data: { name: newListName.value.trim() },
                bearerToken: auth.getToken,
                handleBusinessErrors: true,
                handleHTTPErrors: true,
                handleOtherErrors: true
            });
        } else if (spaceId.value) {
            // Create folderless list in space
            response = await ticketsRepository.createFolderlessList({
                orgId: userStore.defaultOrg.id,
                provider: ExternalTicketProvider.CLICKUP,
                parentId: spaceId.value,
                data: { name: newListName.value.trim() },
                bearerToken: auth.getToken,
                handleBusinessErrors: true,
                handleHTTPErrors: true,
                handleOtherErrors: true
            });
        } else {
            return;
        }

        // Add the new list to the list and select it
        lists.value.push(response.data);
        listId.value = response.data.id;
        newListName.value = '';
        showCreateList.value = false;

        // Auto-save the configuration with the new list_id
        // This ensures the list_id is persisted immediately
        await saveConfigQuietly();
        testResult.value = {
            success: true,
            message: `List "${response.data.name}" created and configuration saved!`
        };
    } catch {
        testResult.value = { success: false, message: 'Failed to create list' };
    } finally {
        isCreatingList.value = false;
    }
}

// Save configuration without closing the modal
async function saveConfigQuietly(): Promise<void> {
    const orgId = userStore.defaultOrg?.id;
    const token = auth.getToken;
    if (!orgId || !token || !listId.value) return;

    await ticketsRepository.configureClickUp({
        orgId,
        data: {
            auth_method: authMethod.value,
            api_key: authMethod.value === 'API_KEY' && apiKey.value ? apiKey.value : undefined,
            access_token:
                authMethod.value === 'OAUTH' && accessToken.value ? accessToken.value : undefined,
            workspace_id: workspaceId.value ?? undefined,
            space_id: spaceId.value ?? undefined,
            folder_id: folderId.value ?? undefined,
            list_id: listId.value,
            auto_sync_on_create: autoSyncOnCreate.value,
            sync_status_changes: syncStatusChanges.value
        },
        bearerToken: token,
        handleBusinessErrors: true,
        handleHTTPErrors: true,
        handleOtherErrors: true
    });
}

async function testConnection(): Promise<void> {
    if (!userStore.defaultOrg?.id || !auth.getToken) return;

    isTesting.value = true;
    try {
        const response = await ticketsRepository.testIntegration({
            orgId: userStore.defaultOrg.id,
            provider: ExternalTicketProvider.CLICKUP,
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });

        if (response.data.success) {
            testResult.value = {
                success: true,
                message: `Connected as ${response.data.user_info?.name ?? 'Unknown'}`
            };
        } else {
            testResult.value = {
                success: false,
                message: response.data.error ?? 'Connection test failed'
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

async function saveConfiguration(): Promise<void> {
    const orgId = userStore.defaultOrg?.id;
    const token = auth.getToken;
    if (!orgId || !token || !canSave.value) return;

    isSaving.value = true;
    try {
        await ticketsRepository.configureClickUp({
            orgId,
            data: {
                auth_method: authMethod.value,
                // Only send api_key if using API_KEY auth and it has a value
                api_key: authMethod.value === 'API_KEY' && apiKey.value ? apiKey.value : undefined,
                // Only send access_token if using OAuth and it has a value
                // (token is stored on backend for existing configs, so we don't always have it)
                access_token:
                    authMethod.value === 'OAUTH' && accessToken.value
                        ? accessToken.value
                        : undefined,
                workspace_id: workspaceId.value ?? undefined,
                space_id: spaceId.value ?? undefined,
                folder_id: folderId.value ?? undefined,
                list_id: listId.value,
                auto_sync_on_create: autoSyncOnCreate.value,
                sync_status_changes: syncStatusChanges.value
            },
            bearerToken: token,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });
        void emit('configured');
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
        void fetchSpaces();
    }
});

watch(spaceId, () => {
    if (spaceId.value) {
        void fetchFolders();
    }
});

watch(folderId, () => {
    if (folderId.value) {
        void fetchLists();
    }
});

// Check for OAuth token from callback or existing config on mount
onMounted(async (): Promise<void> => {
    const storedToken = sessionStorage.getItem('clickup_oauth_access_token');
    if (storedToken) {
        // Switch to OAuth tab and use the stored token
        authMethod.value = 'OAUTH';
        accessToken.value = storedToken;
        oauthConnected.value = true;

        // Clean up sessionStorage
        sessionStorage.removeItem('clickup_oauth_access_token');

        // Fetch workspaces with the OAuth token
        await fetchWorkspacesWithOAuth();
    } else if (props.existingConfig?.has_config) {
        // Existing config - load workspaces directly (OAuth token stored on backend)
        authMethod.value = 'OAUTH';
        oauthConnected.value = true;
        await loadExistingConfigWorkspaces();
    }
});

async function loadExistingConfigWorkspaces(): Promise<void> {
    if (!userStore.defaultOrg?.id || !auth.getToken) return;

    isLoadingWorkspaces.value = true;
    testResult.value = null;

    try {
        const response = await ticketsRepository.getWorkspaces({
            orgId: userStore.defaultOrg.id,
            provider: ExternalTicketProvider.CLICKUP,
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });
        workspaces.value = response.data;

        if (workspaces.value.length === 1 && workspaces.value[0]) {
            workspaceId.value = workspaces.value[0].id;
        }

        testResult.value = {
            success: true,
            message: 'Connected! Select your workspace to update the configuration.'
        };
    } catch {
        testResult.value = {
            success: false,
            message: 'Failed to fetch workspaces. Please try reconnecting.'
        };
        oauthConnected.value = false;
        workspaces.value = [];
    } finally {
        isLoadingWorkspaces.value = false;
    }
}

async function fetchWorkspacesWithOAuth(): Promise<void> {
    if (!userStore.defaultOrg?.id || !auth.getToken || !accessToken.value) return;

    isLoadingWorkspaces.value = true;
    testResult.value = null;

    try {
        // First save the OAuth config to enable hierarchy fetching
        await ticketsRepository.configureClickUp({
            orgId: userStore.defaultOrg.id,
            data: {
                auth_method: 'OAUTH',
                access_token: accessToken.value,
                list_id: 'temp' // Temporary, will be updated when user selects a list
            },
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });

        const response = await ticketsRepository.getWorkspaces({
            orgId: userStore.defaultOrg.id,
            provider: ExternalTicketProvider.CLICKUP,
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });
        workspaces.value = response.data;

        if (workspaces.value.length === 1 && workspaces.value[0]) {
            workspaceId.value = workspaces.value[0].id;
        }

        testResult.value = {
            success: true,
            message: 'Connected via OAuth! Select your workspace.'
        };
    } catch {
        testResult.value = {
            success: false,
            message: 'Failed to fetch workspaces. Please try again.'
        };
        oauthConnected.value = false;
        workspaces.value = [];
    } finally {
        isLoadingWorkspaces.value = false;
    }
}
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
                            <TabsTrigger value="OAUTH">OAuth</TabsTrigger>
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

                        <TabsContent value="OAUTH" class="space-y-4 mt-4">
                            <!-- OAuth Connection Status -->
                            <div v-if="!oauthConnected" class="space-y-4">
                                <!-- Setup Instructions -->
                                <div class="p-4 rounded-lg bg-blue-50 border border-blue-200">
                                    <h4 class="text-sm font-medium text-blue-800 mb-2">
                                        <Icon
                                            icon="solar:info-circle-linear"
                                            class="w-4 h-4 inline mr-1"
                                        />
                                        Setup Instructions
                                    </h4>
                                    <ol class="text-xs text-blue-700 space-y-1 list-decimal ml-4">
                                        <li>
                                            Go to
                                            <a
                                                href="https://app.clickup.com/settings/apps"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="underline font-medium"
                                            >
                                                ClickUp API Settings
                                            </a>
                                        </li>
                                        <li>Click "Create an App"</li>
                                        <li>Enter App Name: <strong>CodeClarity</strong></li>
                                        <li>Copy the Redirect URL below and paste it:</li>
                                    </ol>
                                    <div class="mt-2 flex items-center gap-2">
                                        <code
                                            class="flex-1 px-2 py-1 bg-white rounded border border-blue-300 text-xs text-blue-900 break-all"
                                        >
                                            {{ getOAuthRedirectUri() }}
                                        </code>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            class="shrink-0 h-7 px-2"
                                            @click="copyRedirectUri"
                                        >
                                            <Icon icon="solar:copy-linear" class="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <!-- Connect Button -->
                                <div class="text-center py-4">
                                    <Icon
                                        icon="simple-icons:clickup"
                                        class="w-10 h-10 text-purple-400 mx-auto mb-3"
                                    />
                                    <p class="text-gray-600 mb-4 text-sm">
                                        Once you've created the app in ClickUp, click below to
                                        connect.
                                    </p>
                                    <Button
                                        :disabled="isConnectingOAuth"
                                        class="bg-purple-600 hover:bg-purple-700"
                                        @click="startOAuthFlow"
                                    >
                                        <Icon
                                            v-if="isConnectingOAuth"
                                            icon="solar:spinner-outline"
                                            class="w-4 h-4 mr-2 animate-spin"
                                        />
                                        <Icon
                                            v-else
                                            icon="solar:link-linear"
                                            class="w-4 h-4 mr-2"
                                        />
                                        Connect to ClickUp
                                    </Button>
                                </div>
                            </div>

                            <!-- OAuth Connected - Show hierarchy selectors -->
                            <template v-else>
                                <div
                                    class="p-3 rounded-lg bg-green-50 text-green-700 text-sm flex items-center gap-2"
                                >
                                    <Icon icon="solar:check-circle-bold" class="w-4 h-4" />
                                    Connected to ClickUp via OAuth
                                </div>

                                <!-- Workspace Selector -->
                                <div v-if="workspaces.length > 0" class="space-y-2">
                                    <Label for="workspace-oauth">Workspace</Label>
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

                                <!-- Space Selector / Create -->
                                <div v-if="workspaceId && !isLoadingSpaces" class="space-y-2">
                                    <div class="flex items-center justify-between">
                                        <Label for="space-oauth">Space</Label>
                                        <button
                                            v-if="!showCreateSpace"
                                            class="text-xs text-purple-600 hover:text-purple-700 font-medium"
                                            @click="showCreateSpace = true"
                                        >
                                            + Create new
                                        </button>
                                    </div>

                                    <!-- Create Space Input -->
                                    <div v-if="showCreateSpace" class="flex gap-2">
                                        <Input
                                            v-model="newSpaceName"
                                            placeholder="Enter space name"
                                            class="flex-1"
                                            @keyup.enter="createSpace"
                                        />
                                        <Button
                                            size="sm"
                                            :disabled="!newSpaceName.trim() || isCreatingSpace"
                                            @click="createSpace"
                                        >
                                            <Icon
                                                v-if="isCreatingSpace"
                                                icon="solar:spinner-outline"
                                                class="w-4 h-4 animate-spin"
                                            />
                                            <template v-else>Create</template>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            @click="
                                                showCreateSpace = false;
                                                newSpaceName = '';
                                            "
                                        >
                                            <Icon icon="solar:close-linear" class="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <!-- Space Dropdown -->
                                    <Select v-else-if="spaces.length > 0" v-model="spaceId">
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

                                    <!-- Empty state -->
                                    <div
                                        v-else-if="!showCreateSpace"
                                        class="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg"
                                    >
                                        No spaces found. Click "Create new" to add one.
                                    </div>
                                </div>

                                <!-- Loading Spaces -->
                                <div
                                    v-else-if="workspaceId && isLoadingSpaces"
                                    class="flex items-center gap-2 text-sm text-gray-500"
                                >
                                    <Icon
                                        icon="solar:spinner-outline"
                                        class="w-4 h-4 animate-spin"
                                    />
                                    Loading spaces...
                                </div>

                                <!-- Folder Selector / Create -->
                                <div v-if="spaceId && !isLoadingFolders" class="space-y-2">
                                    <div class="flex items-center justify-between">
                                        <Label for="folder-oauth">Folder (optional)</Label>
                                        <button
                                            v-if="!showCreateFolder"
                                            class="text-xs text-purple-600 hover:text-purple-700 font-medium"
                                            @click="showCreateFolder = true"
                                        >
                                            + Create new
                                        </button>
                                    </div>

                                    <!-- Create Folder Input -->
                                    <div v-if="showCreateFolder" class="flex gap-2">
                                        <Input
                                            v-model="newFolderName"
                                            placeholder="Enter folder name"
                                            class="flex-1"
                                            @keyup.enter="createFolder"
                                        />
                                        <Button
                                            size="sm"
                                            :disabled="!newFolderName.trim() || isCreatingFolder"
                                            @click="createFolder"
                                        >
                                            <Icon
                                                v-if="isCreatingFolder"
                                                icon="solar:spinner-outline"
                                                class="w-4 h-4 animate-spin"
                                            />
                                            <template v-else>Create</template>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            @click="
                                                showCreateFolder = false;
                                                newFolderName = '';
                                            "
                                        >
                                            <Icon icon="solar:close-linear" class="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <!-- Folder Dropdown -->
                                    <Select v-else-if="folders.length > 0" v-model="folderId">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select folder (or skip)" />
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

                                    <!-- Empty state with option to skip -->
                                    <p v-else-if="!showCreateFolder" class="text-xs text-gray-500">
                                        No folders found. Create one or skip to create a list
                                        directly in the space.
                                    </p>
                                </div>

                                <!-- Loading Folders -->
                                <div
                                    v-else-if="spaceId && isLoadingFolders"
                                    class="flex items-center gap-2 text-sm text-gray-500"
                                >
                                    <Icon
                                        icon="solar:spinner-outline"
                                        class="w-4 h-4 animate-spin"
                                    />
                                    Loading folders...
                                </div>

                                <!-- List Selector / Create -->
                                <div
                                    v-if="
                                        (spaceId && !folderId && !isLoadingFolders) ||
                                        (folderId && !isLoadingLists)
                                    "
                                    class="space-y-2"
                                >
                                    <div class="flex items-center justify-between">
                                        <Label for="list-oauth">List</Label>
                                        <button
                                            v-if="!showCreateList"
                                            class="text-xs text-purple-600 hover:text-purple-700 font-medium"
                                            @click="showCreateList = true"
                                        >
                                            + Create new
                                        </button>
                                    </div>

                                    <!-- Create List Input -->
                                    <div v-if="showCreateList" class="flex gap-2">
                                        <Input
                                            v-model="newListName"
                                            placeholder="Enter list name"
                                            class="flex-1"
                                            @keyup.enter="createList"
                                        />
                                        <Button
                                            size="sm"
                                            :disabled="!newListName.trim() || isCreatingList"
                                            @click="createList"
                                        >
                                            <Icon
                                                v-if="isCreatingList"
                                                icon="solar:spinner-outline"
                                                class="w-4 h-4 animate-spin"
                                            />
                                            <template v-else>Create</template>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            @click="
                                                showCreateList = false;
                                                newListName = '';
                                            "
                                        >
                                            <Icon icon="solar:close-linear" class="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <!-- List Dropdown -->
                                    <Select v-else-if="lists.length > 0" v-model="listId">
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

                                    <!-- Empty state -->
                                    <div
                                        v-else-if="!showCreateList"
                                        class="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg"
                                    >
                                        No lists found. Click "Create new" to add one.
                                    </div>

                                    <p class="text-xs text-gray-500">
                                        All synced tickets will be created as tasks in this list
                                    </p>
                                </div>

                                <!-- Loading Lists -->
                                <div
                                    v-else-if="folderId && isLoadingLists"
                                    class="flex items-center gap-2 text-sm text-gray-500"
                                >
                                    <Icon
                                        icon="solar:spinner-outline"
                                        class="w-4 h-4 animate-spin"
                                    />
                                    Loading lists...
                                </div>

                                <!-- Sync Options -->
                                <div v-if="listId" class="space-y-3 pt-4 border-t border-gray-200">
                                    <h4 class="text-sm font-medium text-gray-700">Sync Options</h4>

                                    <div class="flex items-center space-x-2">
                                        <Checkbox
                                            id="auto-sync-oauth"
                                            v-model:checked="autoSyncOnCreate"
                                        />
                                        <Label
                                            for="auto-sync-oauth"
                                            class="text-sm font-normal cursor-pointer"
                                        >
                                            Auto-sync new tickets to ClickUp
                                        </Label>
                                    </div>

                                    <div class="flex items-center space-x-2">
                                        <Checkbox
                                            id="sync-status-oauth"
                                            v-model:checked="syncStatusChanges"
                                        />
                                        <Label
                                            for="sync-status-oauth"
                                            class="text-sm font-normal cursor-pointer"
                                        >
                                            Sync status changes to ClickUp
                                        </Label>
                                    </div>
                                </div>
                            </template>

                            <!-- Test Result for OAuth -->
                            <div
                                v-if="testResult && authMethod === 'OAUTH'"
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

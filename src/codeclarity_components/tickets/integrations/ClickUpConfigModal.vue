<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { CircleCheck, CircleX, Copy, Info, LoaderCircle, X } from "@lucide/vue";
import { computed, onMounted, ref, watch } from "vue";

import { Button } from "@/shadcn/ui/button";
import { Checkbox } from "@/shadcn/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";

import {
  ExternalTicketProvider,
  type IntegrationConfigSummary,
  type IntegrationHierarchyItem,
} from "../tickets.entity";
import { TicketsRepository } from "../tickets.repository";

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
const authMethod = ref<"API_KEY" | "OAUTH">("API_KEY");
const apiKey = ref("");
const accessToken = ref(""); // OAuth access token
const workspaceId = ref("");
const spaceId = ref("");
const folderId = ref("");
const listId = ref("");
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
const newSpaceName = ref("");
const newFolderName = ref("");
const newListName = ref("");
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
  if (authMethod.value === "API_KEY") {
    return apiKey.value.length > 0;
  }
  return oauthConnected.value && accessToken.value.length > 0;
});

const canSave = computed(() => {
  return listId.value.length > 0;
});

// Lets the closing animation finish before the parent unmounts the dialog.
function close(): void {
  isOpen.value = false;
  setTimeout(() => emit("close"), 300);
}

function onOpenChange(open: boolean): void {
  if (!open) close();
}

// OAuth redirect URI
function getOAuthRedirectUri(): string {
  return `${window.location.origin}/tickets/integrations/clickup/callback`;
}

async function copyRedirectUri(): Promise<void> {
  try {
    await navigator.clipboard.writeText(getOAuthRedirectUri());
    testResult.value = {
      success: true,
      message: "Redirect URL copied to clipboard!",
    };
    setTimeout(() => {
      if (testResult.value?.message === "Redirect URL copied to clipboard!") {
        testResult.value = null;
      }
    }, 2000);
  } catch {
    testResult.value = { success: false, message: "Failed to copy URL" };
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
      handleOtherErrors: true,
    });

    // Store state in sessionStorage for callback verification
    sessionStorage.setItem("clickup_oauth_org_id", orgId);

    // Redirect to ClickUp OAuth
    window.location.href = response.data.url;
  } catch {
    testResult.value = {
      success: false,
      message:
        "Failed to start OAuth flow. Make sure ClickUp OAuth is configured.",
    };
    isConnectingOAuth.value = false;
  }
}

async function fetchWorkspaces(): Promise<void> {
  if (!userStore.defaultOrg?.id || !auth.getToken || !canFetchWorkspaces.value)
    return;

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
        list_id: "temp", // Temporary, will be updated
      },
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });

    const response = await ticketsRepository.getWorkspaces({
      orgId: userStore.defaultOrg.id,
      provider: ExternalTicketProvider.CLICKUP,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });
    workspaces.value = response.data;

    if (workspaces.value.length === 1) {
      workspaceId.value = workspaces.value[0]?.id ?? "";
    }

    testResult.value = {
      success: true,
      message: "API key valid! Select your workspace.",
    };
  } catch {
    testResult.value = {
      success: false,
      message: "Invalid API key or connection failed",
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
  spaceId.value = "";
  folderId.value = "";
  listId.value = "";

  try {
    const response = await ticketsRepository.getSpaces({
      orgId: userStore.defaultOrg.id,
      provider: ExternalTicketProvider.CLICKUP,
      parentId: workspaceId.value,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });
    spaces.value = response.data;
  } catch {
    testResult.value = { success: false, message: "Failed to load the spaces" };
  } finally {
    isLoadingSpaces.value = false;
  }
}

async function fetchFolders(): Promise<void> {
  if (!userStore.defaultOrg?.id || !auth.getToken || !spaceId.value) return;

  isLoadingFolders.value = true;
  folders.value = [];
  lists.value = [];
  folderId.value = "";
  listId.value = "";

  try {
    const response = await ticketsRepository.getFolders({
      orgId: userStore.defaultOrg.id,
      provider: ExternalTicketProvider.CLICKUP,
      parentId: spaceId.value,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });
    folders.value = response.data;

    // Also fetch folderless lists directly from space
    await fetchListsFromSpace();
  } catch {
    testResult.value = {
      success: false,
      message: "Failed to load the folders",
    };
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
  listId.value = "";

  try {
    const response = await ticketsRepository.getLists({
      orgId: userStore.defaultOrg.id,
      provider: ExternalTicketProvider.CLICKUP,
      parentId: folderId.value,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });
    lists.value = response.data;
  } catch {
    testResult.value = { success: false, message: "Failed to load the lists" };
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
      handleOtherErrors: true,
    });

    // Add the new space to the list and select it
    spaces.value.push(response.data);
    spaceId.value = response.data.id;
    newSpaceName.value = "";
    showCreateSpace.value = false;
    testResult.value = {
      success: true,
      message: `Space "${response.data.name}" created!`,
    };
  } catch {
    testResult.value = { success: false, message: "Failed to create space" };
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
      handleOtherErrors: true,
    });

    // Add the new folder to the list and select it
    folders.value.push(response.data);
    folderId.value = response.data.id;
    newFolderName.value = "";
    showCreateFolder.value = false;
    testResult.value = {
      success: true,
      message: `Folder "${response.data.name}" created!`,
    };
  } catch {
    testResult.value = { success: false, message: "Failed to create folder" };
  } finally {
    isCreatingFolder.value = false;
  }
}

async function createList(): Promise<void> {
  if (!userStore.defaultOrg?.id || !auth.getToken || !newListName.value.trim())
    return;

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
        handleOtherErrors: true,
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
        handleOtherErrors: true,
      });
    } else {
      return;
    }

    // Add the new list to the list and select it
    lists.value.push(response.data);
    listId.value = response.data.id;
    newListName.value = "";
    showCreateList.value = false;

    // Auto-save the configuration with the new list_id
    // This ensures the list_id is persisted immediately
    await saveConfigQuietly();
    testResult.value = {
      success: true,
      message: `List "${response.data.name}" created and configuration saved!`,
    };
  } catch {
    testResult.value = { success: false, message: "Failed to create list" };
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
      api_key:
        authMethod.value === "API_KEY" && apiKey.value
          ? apiKey.value
          : undefined,
      access_token:
        authMethod.value === "OAUTH" && accessToken.value
          ? accessToken.value
          : undefined,
      workspace_id: workspaceId.value ?? undefined,
      space_id: spaceId.value ?? undefined,
      folder_id: folderId.value ?? undefined,
      list_id: listId.value,
      auto_sync_on_create: autoSyncOnCreate.value,
      sync_status_changes: syncStatusChanges.value,
    },
    bearerToken: token,
    handleBusinessErrors: true,
    handleHTTPErrors: true,
    handleOtherErrors: true,
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
      handleOtherErrors: true,
    });

    if (response.data.success) {
      testResult.value = {
        success: true,
        message: `Connected as ${response.data.user_info?.name ?? "Unknown"}`,
      };
    } else {
      testResult.value = {
        success: false,
        message: response.data.error ?? "Connection test failed",
      };
    }
  } catch {
    testResult.value = {
      success: false,
      message: "Connection test failed",
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
        api_key:
          authMethod.value === "API_KEY" && apiKey.value
            ? apiKey.value
            : undefined,
        // Only send access_token if using OAuth and it has a value
        // (token is stored on backend for existing configs, so we don't always have it)
        access_token:
          authMethod.value === "OAUTH" && accessToken.value
            ? accessToken.value
            : undefined,
        workspace_id: workspaceId.value ?? undefined,
        space_id: spaceId.value ?? undefined,
        folder_id: folderId.value ?? undefined,
        list_id: listId.value,
        auto_sync_on_create: autoSyncOnCreate.value,
        sync_status_changes: syncStatusChanges.value,
      },
      bearerToken: token,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });
    void emit("configured");
  } catch {
    testResult.value = {
      success: false,
      message: "Failed to save configuration",
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
  const storedToken = sessionStorage.getItem("clickup_oauth_access_token");
  if (storedToken) {
    // Switch to OAuth tab and use the stored token
    authMethod.value = "OAUTH";
    accessToken.value = storedToken;
    oauthConnected.value = true;

    // Clean up sessionStorage
    sessionStorage.removeItem("clickup_oauth_access_token");

    // Fetch workspaces with the OAuth token
    await fetchWorkspacesWithOAuth();
  } else if (props.existingConfig?.has_config) {
    // Existing config - load workspaces directly (OAuth token stored on backend)
    authMethod.value = "OAUTH";
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
      handleOtherErrors: true,
    });
    workspaces.value = response.data;

    if (workspaces.value.length === 1 && workspaces.value[0]) {
      workspaceId.value = workspaces.value[0].id;
    }

    testResult.value = {
      success: true,
      message: "Connected! Select your workspace to update the configuration.",
    };
  } catch {
    testResult.value = {
      success: false,
      message: "Failed to fetch workspaces. Please try reconnecting.",
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
        auth_method: "OAUTH",
        access_token: accessToken.value,
        list_id: "temp", // Temporary, will be updated when user selects a list
      },
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });

    const response = await ticketsRepository.getWorkspaces({
      orgId: userStore.defaultOrg.id,
      provider: ExternalTicketProvider.CLICKUP,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });
    workspaces.value = response.data;

    if (workspaces.value.length === 1 && workspaces.value[0]) {
      workspaceId.value = workspaces.value[0].id;
    }

    testResult.value = {
      success: true,
      message: "Connected via OAuth! Select your workspace.",
    };
  } catch {
    testResult.value = {
      success: false,
      message: "Failed to fetch workspaces. Please try again.",
    };
    oauthConnected.value = false;
    workspaces.value = [];
  } finally {
    isLoadingWorkspaces.value = false;
  }
}
</script>

<template>
  <Dialog :open="isOpen" @update:open="onOpenChange">
    <DialogContent class="max-h-[90vh] max-w-lg overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Icon icon="simple-icons:clickup" aria-hidden="true" class="size-5" />
          {{ existingConfig ? "Configure" : "Connect" }} ClickUp
        </DialogTitle>
        <DialogDescription>Sync tickets to ClickUp tasks.</DialogDescription>
      </DialogHeader>

      <Tabs v-model="authMethod" class="w-full">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="API_KEY">API Key</TabsTrigger>
          <TabsTrigger value="OAUTH">OAuth</TabsTrigger>
        </TabsList>

        <TabsContent value="API_KEY" class="space-y-4 mt-4">
          <!-- API Key Input -->
          <div class="space-y-2">
            <Label for="api-key">ClickUp API key</Label>
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
                <LoaderCircle
                  v-if="isLoadingWorkspaces"
                  aria-hidden="true"
                  class="animate-spin motion-reduce:animate-none"
                />
                Verify
              </Button>
            </div>
            <p class="text-xs text-muted-foreground">
              Get your API key from
              <a
                href="https://app.clickup.com/settings/apps"
                target="_blank"
                rel="noopener noreferrer"
                class="text-brand-subtle-foreground underline underline-offset-4"
              >
                ClickUp Settings &rarr; Apps
              </a>
            </p>
          </div>

          <!-- Test Result -->
          <div
            v-if="testResult"
            role="status"
            class="rounded-control p-3 text-sm"
            :class="{
              'bg-success-subtle text-success': testResult.success,
              'border border-danger text-danger': !testResult.success,
            }"
          >
            <div class="flex items-center gap-2">
              <CircleCheck
                v-if="testResult.success"
                aria-hidden="true"
                class="size-4"
              />
              <CircleX v-else aria-hidden="true" class="size-4" />
              {{ testResult.message }}
            </div>
          </div>

          <!-- Workspace Selector -->
          <div v-if="workspaces.length > 0" class="space-y-2">
            <Label for="workspace">Workspace</Label>
            <Select v-model="workspaceId">
              <SelectTrigger id="workspace">
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
              <SelectTrigger id="space">
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
              <SelectTrigger id="folder">
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
              <SelectTrigger id="list">
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
            <p class="text-xs text-muted-foreground">
              All synced tickets will be created as tasks in this list
            </p>
          </div>

          <!-- Sync Options -->
          <div v-if="listId" class="space-y-3 border-t pt-4">
            <h4 class="text-sm font-semibold text-foreground-strong">
              Sync Options
            </h4>

            <div class="flex items-center space-x-2">
              <Checkbox id="auto-sync" v-model="autoSyncOnCreate" />
              <Label for="auto-sync" class="text-sm font-normal cursor-pointer">
                Auto-sync new tickets to ClickUp
              </Label>
            </div>

            <div class="flex items-center space-x-2">
              <Checkbox id="sync-status" v-model="syncStatusChanges" />
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
            <div class="rounded-card border bg-muted p-4">
              <h4 class="mb-2 text-sm font-semibold text-foreground-strong">
                <Info aria-hidden="true" class="mr-1 inline size-4" />
                Setup Instructions
              </h4>
              <ol class="ml-4 list-decimal space-y-1 text-xs text-foreground">
                <li>
                  Go to
                  <a
                    href="https://app.clickup.com/settings/apps"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="font-medium underline underline-offset-4"
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
                  class="flex-1 break-all rounded-control border bg-card px-2 py-1 text-xs text-foreground-strong"
                >
                  {{ getOAuthRedirectUri() }}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  class="shrink-0 h-7 px-2"
                  aria-label="Copy the redirect URL"
                  @click="copyRedirectUri"
                >
                  <Copy aria-hidden="true" class="size-4" />
                </Button>
              </div>
            </div>

            <!-- Connect Button -->
            <div class="text-center py-4">
              <Icon
                icon="simple-icons:clickup"
                aria-hidden="true"
                class="mx-auto mb-3 size-10 text-muted-foreground"
              />
              <p class="mb-4 text-sm text-muted-foreground">
                Once you've created the app in ClickUp, click below to connect.
              </p>
              <Button :disabled="isConnectingOAuth" @click="startOAuthFlow">
                <LoaderCircle
                  v-if="isConnectingOAuth"
                  aria-hidden="true"
                  class="animate-spin motion-reduce:animate-none"
                />

                Connect to ClickUp
              </Button>
            </div>
          </div>

          <!-- OAuth Connected - Show hierarchy selectors -->
          <template v-else>
            <div
              class="flex items-center gap-2 rounded-control bg-success-subtle p-3 text-sm text-success"
            >
              <CircleCheck aria-hidden="true" class="size-4" />
              Connected to ClickUp via OAuth
            </div>

            <!-- Workspace Selector -->
            <div v-if="workspaces.length > 0" class="space-y-2">
              <Label for="workspace-oauth">Workspace</Label>
              <Select v-model="workspaceId">
                <SelectTrigger id="workspace-oauth">
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
                  type="button"
                  class="rounded-sm text-xs font-medium text-brand-subtle-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  aria-label="New space name"
                  class="flex-1"
                  @keyup.enter="createSpace"
                />
                <Button
                  size="sm"
                  :disabled="!newSpaceName.trim() || isCreatingSpace"
                  @click="createSpace"
                >
                  <LoaderCircle
                    v-if="isCreatingSpace"
                    aria-hidden="true"
                    class="animate-spin motion-reduce:animate-none"
                  />
                  <template v-else>Create</template>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Cancel"
                  @click="
                    showCreateSpace = false;
                    newSpaceName = '';
                  "
                >
                  <X aria-hidden="true" class="size-4" />
                </Button>
              </div>

              <!-- Space Dropdown -->
              <Select v-else-if="spaces.length > 0" v-model="spaceId">
                <SelectTrigger id="space-oauth">
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
                class="rounded-control bg-muted p-3 text-sm text-muted-foreground"
              >
                No spaces found. Click "Create new" to add one.
              </div>
            </div>

            <!-- Loading Spaces -->
            <div
              v-else-if="workspaceId && isLoadingSpaces"
              role="status"
              class="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <LoaderCircle
                aria-hidden="true"
                class="size-4 animate-spin motion-reduce:animate-none"
              />
              Loading spaces...
            </div>

            <!-- Folder Selector / Create -->
            <div v-if="spaceId && !isLoadingFolders" class="space-y-2">
              <div class="flex items-center justify-between">
                <Label for="folder-oauth">Folder (optional)</Label>
                <button
                  v-if="!showCreateFolder"
                  type="button"
                  class="rounded-sm text-xs font-medium text-brand-subtle-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  aria-label="New folder name"
                  class="flex-1"
                  @keyup.enter="createFolder"
                />
                <Button
                  size="sm"
                  :disabled="!newFolderName.trim() || isCreatingFolder"
                  @click="createFolder"
                >
                  <LoaderCircle
                    v-if="isCreatingFolder"
                    aria-hidden="true"
                    class="animate-spin motion-reduce:animate-none"
                  />
                  <template v-else>Create</template>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Cancel"
                  @click="
                    showCreateFolder = false;
                    newFolderName = '';
                  "
                >
                  <X aria-hidden="true" class="size-4" />
                </Button>
              </div>

              <!-- Folder Dropdown -->
              <Select v-else-if="folders.length > 0" v-model="folderId">
                <SelectTrigger id="folder-oauth">
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
              <p
                v-else-if="!showCreateFolder"
                class="text-xs text-muted-foreground"
              >
                No folders found. Create one or skip to create a list directly
                in the space.
              </p>
            </div>

            <!-- Loading Folders -->
            <div
              v-else-if="spaceId && isLoadingFolders"
              role="status"
              class="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <LoaderCircle
                aria-hidden="true"
                class="size-4 animate-spin motion-reduce:animate-none"
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
                  type="button"
                  class="rounded-sm text-xs font-medium text-brand-subtle-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  aria-label="New list name"
                  class="flex-1"
                  @keyup.enter="createList"
                />
                <Button
                  size="sm"
                  :disabled="!newListName.trim() || isCreatingList"
                  @click="createList"
                >
                  <LoaderCircle
                    v-if="isCreatingList"
                    aria-hidden="true"
                    class="animate-spin motion-reduce:animate-none"
                  />
                  <template v-else>Create</template>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Cancel"
                  @click="
                    showCreateList = false;
                    newListName = '';
                  "
                >
                  <X aria-hidden="true" class="size-4" />
                </Button>
              </div>

              <!-- List Dropdown -->
              <Select v-else-if="lists.length > 0" v-model="listId">
                <SelectTrigger id="list-oauth">
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
                class="rounded-control bg-muted p-3 text-sm text-muted-foreground"
              >
                No lists found. Click "Create new" to add one.
              </div>

              <p class="text-xs text-muted-foreground">
                All synced tickets will be created as tasks in this list
              </p>
            </div>

            <!-- Loading Lists -->
            <div
              v-else-if="folderId && isLoadingLists"
              role="status"
              class="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <LoaderCircle
                aria-hidden="true"
                class="size-4 animate-spin motion-reduce:animate-none"
              />
              Loading lists...
            </div>

            <!-- Sync Options -->
            <div v-if="listId" class="space-y-3 border-t pt-4">
              <h4 class="text-sm font-semibold text-foreground-strong">
                Sync Options
              </h4>

              <div class="flex items-center space-x-2">
                <Checkbox id="auto-sync-oauth" v-model="autoSyncOnCreate" />
                <Label
                  for="auto-sync-oauth"
                  class="text-sm font-normal cursor-pointer"
                >
                  Auto-sync new tickets to ClickUp
                </Label>
              </div>

              <div class="flex items-center space-x-2">
                <Checkbox id="sync-status-oauth" v-model="syncStatusChanges" />
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
            role="status"
            class="rounded-control p-3 text-sm"
            :class="{
              'bg-success-subtle text-success': testResult.success,
              'border border-danger text-danger': !testResult.success,
            }"
          >
            <div class="flex items-center gap-2">
              <CircleCheck
                v-if="testResult.success"
                aria-hidden="true"
                class="size-4"
              />
              <CircleX v-else aria-hidden="true" class="size-4" />
              {{ testResult.message }}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter class="sm:justify-between">
        <Button variant="outline" @click="close">Cancel</Button>
        <div class="flex items-center gap-2">
          <Button
            v-if="existingConfig"
            variant="outline"
            :disabled="isTesting"
            @click="testConnection"
          >
            <LoaderCircle
              v-if="isTesting"
              aria-hidden="true"
              class="animate-spin motion-reduce:animate-none"
            />
            Test Connection
          </Button>
          <Button :disabled="!canSave || isSaving" @click="saveConfiguration">
            <LoaderCircle
              v-if="isSaving"
              aria-hidden="true"
              class="animate-spin motion-reduce:animate-none"
            />
            {{ existingConfig ? "Save Changes" : "Connect" }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { Check, Plug, RefreshCw, Settings, Trash2, X } from "@lucide/vue";
import { storeToRefs } from "pinia";
import { computed, onMounted, ref } from "vue";

import { StatusBadge } from "@/base_components/page";
import DeleteIntegrationDialog from "@/codeclarity_components/organizations/integrations/DeleteIntegrationDialog.vue";
import {
  isMemberRoleGreaterOrEqualTo,
  MemberRole,
} from "@/codeclarity_components/organizations/organization.entity";
import { Button } from "@/shadcn/ui/button";
import { Spinner } from "@/shadcn/ui/spinner";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { errorToast, successToast } from "@/utils/toasts";

import {
  type ConnectionTestResult,
  ExternalProviderIcons,
  ExternalProviderLabels,
  ExternalTicketProvider,
  type IntegrationConfigSummary,
} from "../tickets.entity";
import { TicketsRepository } from "../tickets.repository";

import ClickUpConfigModal from "./ClickUpConfigModal.vue";
import { connectionFailureText } from "./connection-test";

const { defaultOrg } = storeToRefs(useUserStore());
const auth = useAuthStore();

const ticketsRepository = new TicketsRepository();

// Only org admins and owners may set up, test or remove integrations.
const canManage = computed(() => {
  const role = defaultOrg?.value?.role;
  return (
    role !== undefined && isMemberRoleGreaterOrEqualTo(role, MemberRole.ADMIN)
  );
});

const integrations = ref<IntegrationConfigSummary[]>([]);
const isLoading = ref(false);
const loadFailed = ref(false);
const testingProvider = ref<ExternalTicketProvider | null>(null);
const testResults = ref<Map<ExternalTicketProvider, ConnectionTestResult>>(
  new Map(),
);
const showClickUpModal = ref(false);
const deletingProvider = ref<ExternalTicketProvider | null>(null);
// Provider waiting for the user to confirm the disconnect.
const pendingDisconnect = ref<ExternalTicketProvider | null>(null);
const disconnectOpen = computed({
  get: () => pendingDisconnect.value !== null,
  set: (open: boolean) => {
    if (!open) pendingDisconnect.value = null;
  },
});

// Available providers that can be configured
const availableProviders = [
  {
    provider: ExternalTicketProvider.CLICKUP,
    name: ExternalProviderLabels[ExternalTicketProvider.CLICKUP],
    icon: ExternalProviderIcons[ExternalTicketProvider.CLICKUP],
    description: "Sync tickets to ClickUp tasks",
    available: true,
  },
  {
    provider: ExternalTicketProvider.JIRA,
    name: ExternalProviderLabels[ExternalTicketProvider.JIRA],
    icon: ExternalProviderIcons[ExternalTicketProvider.JIRA],
    description: "Sync tickets to Jira issues",
    available: false,
  },
  {
    provider: ExternalTicketProvider.LINEAR,
    name: ExternalProviderLabels[ExternalTicketProvider.LINEAR],
    icon: ExternalProviderIcons[ExternalTicketProvider.LINEAR],
    description: "Sync tickets to Linear issues",
    available: false,
  },
];

async function loadIntegrations(): Promise<void> {
  const orgId = defaultOrg?.value?.id;
  if (!orgId || !auth.getToken) return;

  isLoading.value = true;
  loadFailed.value = false;
  try {
    const response = await ticketsRepository.getIntegrations({
      orgId,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });
    integrations.value = response.data;
  } catch {
    loadFailed.value = true;
  } finally {
    isLoading.value = false;
  }
}

async function testConnection(provider: ExternalTicketProvider): Promise<void> {
  const orgId = defaultOrg?.value?.id;
  if (!orgId || !auth.getToken) return;

  testingProvider.value = provider;
  try {
    const response = await ticketsRepository.testIntegration({
      orgId,
      provider,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });
    testResults.value.set(provider, response.data);
  } catch {
    testResults.value.set(provider, {
      success: false,
      error: "Failed to test connection",
    });
  } finally {
    testingProvider.value = null;
  }
}

async function confirmDisconnect(): Promise<void> {
  const provider = pendingDisconnect.value;
  const orgId = defaultOrg?.value?.id;
  if (!provider || !orgId || !auth.getToken) return;

  deletingProvider.value = provider;
  try {
    await ticketsRepository.deleteIntegration({
      orgId,
      provider,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });
    testResults.value.delete(provider);
    pendingDisconnect.value = null;
    successToast(`Disconnected ${ExternalProviderLabels[provider]}`);
    await loadIntegrations();
  } catch {
    errorToast("Failed to disconnect the integration");
  } finally {
    deletingProvider.value = null;
  }
}

function openConfigModal(provider: ExternalTicketProvider): void {
  if (canManage.value && provider === ExternalTicketProvider.CLICKUP) {
    showClickUpModal.value = true;
  }
}

function getIntegration(
  provider: ExternalTicketProvider,
): IntegrationConfigSummary | undefined {
  return integrations.value.find((i) => i.provider === provider);
}

function getTestResult(
  provider: ExternalTicketProvider,
): ConnectionTestResult | undefined {
  return testResults.value.get(provider);
}

function handleClickUpConfigured(): void {
  showClickUpModal.value = false;
  void loadIntegrations();
}

onMounted(() => {
  void loadIntegrations();
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between gap-4">
      <p class="text-sm text-muted-foreground">
        Synced tickets become tasks in the tool you connect.
      </p>
      <Button
        variant="outline"
        size="sm"
        :disabled="isLoading"
        @click="loadIntegrations"
      >
        <RefreshCw
          aria-hidden="true"
          :class="{ 'animate-spin motion-reduce:animate-none': isLoading }"
        />
        Refresh
      </Button>
    </div>

    <p v-if="!canManage" class="text-sm text-muted-foreground">
      Ask an organisation admin or owner to set up or change integrations.
    </p>

    <div
      v-if="isLoading && integrations.length === 0"
      role="status"
      class="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"
    >
      <Spinner />
      Loading integrations
    </div>

    <p
      v-else-if="loadFailed"
      role="alert"
      class="rounded-control border border-danger p-3 text-sm text-danger"
    >
      The integrations could not be loaded.
    </p>

    <ul v-else class="flex flex-col gap-3">
      <li
        v-for="providerInfo in availableProviders"
        :key="providerInfo.provider"
        class="flex items-start justify-between gap-4 rounded-card border bg-card p-4"
      >
        <div class="flex items-start gap-4">
          <div
            class="flex size-12 shrink-0 items-center justify-center rounded-control bg-muted"
          >
            <Icon
              :icon="providerInfo.icon"
              aria-hidden="true"
              class="size-6 text-foreground-strong"
            />
          </div>
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-foreground-strong">
                {{ providerInfo.name }}
              </h3>
              <StatusBadge
                v-if="!providerInfo.available"
                tone="neutral"
                label="Coming soon"
              />
              <StatusBadge
                v-else-if="getIntegration(providerInfo.provider)?.enabled"
                tone="success"
                label="Connected"
              />
            </div>
            <p class="text-sm text-muted-foreground">
              {{ providerInfo.description }}
            </p>
            <p
              v-if="getTestResult(providerInfo.provider)"
              role="status"
              class="flex items-center gap-1 text-sm"
              :class="
                getTestResult(providerInfo.provider)?.success
                  ? 'text-success'
                  : 'text-danger'
              "
            >
              <Check
                v-if="getTestResult(providerInfo.provider)?.success"
                aria-hidden="true"
                class="size-4"
              />
              <X v-else aria-hidden="true" class="size-4" />
              <template v-if="getTestResult(providerInfo.provider)?.success">
                Connected as
                {{
                  getTestResult(providerInfo.provider)?.user_info?.name ||
                  "Unknown"
                }}
              </template>
              <template v-else>
                {{
                  connectionFailureText(getTestResult(providerInfo.provider))
                }}
              </template>
            </p>
          </div>
        </div>

        <div v-if="canManage" class="flex shrink-0 items-center gap-2">
          <template v-if="getIntegration(providerInfo.provider)">
            <Button
              variant="outline"
              size="sm"
              :disabled="testingProvider === providerInfo.provider"
              @click="testConnection(providerInfo.provider)"
            >
              <Spinner v-if="testingProvider === providerInfo.provider" />
              <Plug v-else aria-hidden="true" />
              Test
            </Button>
            <Button
              variant="outline"
              size="sm"
              @click="openConfigModal(providerInfo.provider)"
            >
              <Settings aria-hidden="true" />
              Configure
            </Button>
            <Button
              variant="destructive"
              size="sm"
              :disabled="deletingProvider === providerInfo.provider"
              @click="pendingDisconnect = providerInfo.provider"
            >
              <Spinner v-if="deletingProvider === providerInfo.provider" />
              <Trash2 v-else aria-hidden="true" />
              Disconnect
            </Button>
          </template>
          <Button
            v-else-if="providerInfo.available"
            size="sm"
            @click="openConfigModal(providerInfo.provider)"
          >
            Connect <span class="sr-only">{{ providerInfo.name }}</span>
          </Button>
        </div>
      </li>
    </ul>

    <ClickUpConfigModal
      v-if="canManage && showClickUpModal"
      :existing-config="getIntegration(ExternalTicketProvider.CLICKUP)"
      @close="showClickUpModal = false"
      @configured="handleClickUpConfigured"
    />
    <DeleteIntegrationDialog
      v-model:open="disconnectOpen"
      verb="Disconnect"
      :name="pendingDisconnect ? ExternalProviderLabels[pendingDisconnect] : ''"
      description="Tickets stop syncing to it. Tasks already created there stay."
      :busy="deletingProvider !== null"
      @confirm="confirmDisconnect"
    />
  </div>
</template>

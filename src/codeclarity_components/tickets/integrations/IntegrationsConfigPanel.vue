<script setup lang="ts">
import { Icon } from "@iconify/vue";
import {
  Check,
  LoaderCircle,
  Plug,
  RefreshCw,
  Settings,
  Trash2,
  X,
} from "@lucide/vue";
import { storeToRefs } from "pinia";
import { onMounted, ref } from "vue";

import { StatusBadge } from "@/base_components/page";
import { Button } from "@/shadcn/ui/button";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { errorToast } from "@/utils/toasts";

import {
  type ConnectionTestResult,
  ExternalProviderIcons,
  ExternalProviderLabels,
  ExternalTicketProvider,
  type IntegrationConfigSummary,
} from "../tickets.entity";
import { TicketsRepository } from "../tickets.repository";

import ClickUpConfigModal from "./ClickUpConfigModal.vue";

const { defaultOrg } = storeToRefs(useUserStore());
const auth = useAuthStore();

const ticketsRepository = new TicketsRepository();

const integrations = ref<IntegrationConfigSummary[]>([]);
const isLoading = ref(false);
const loadFailed = ref(false);
const testingProvider = ref<ExternalTicketProvider | null>(null);
const testResults = ref<Map<ExternalTicketProvider, ConnectionTestResult>>(
  new Map(),
);
const showClickUpModal = ref(false);
const deletingProvider = ref<ExternalTicketProvider | null>(null);

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

async function deleteIntegration(
  provider: ExternalTicketProvider,
): Promise<void> {
  const orgId = defaultOrg?.value?.id;
  if (!orgId || !auth.getToken) return;

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
    await loadIntegrations();
  } catch {
    errorToast("Failed to disconnect the integration");
  } finally {
    deletingProvider.value = null;
  }
}

function openConfigModal(provider: ExternalTicketProvider): void {
  if (provider === ExternalTicketProvider.CLICKUP) {
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

    <div
      v-if="isLoading && integrations.length === 0"
      role="status"
      class="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"
    >
      <LoaderCircle
        aria-hidden="true"
        class="size-4 animate-spin motion-reduce:animate-none"
      />
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
            <div
              v-if="getIntegration(providerInfo.provider)"
              class="text-xs text-muted-foreground"
            >
              <p v-if="getIntegration(providerInfo.provider)?.workspace_name">
                Workspace:
                {{ getIntegration(providerInfo.provider)?.workspace_name }}
              </p>
              <p v-if="getIntegration(providerInfo.provider)?.list_name">
                List: {{ getIntegration(providerInfo.provider)?.list_name }}
              </p>
            </div>
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
                {{ getTestResult(providerInfo.provider)?.error }}
              </template>
            </p>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <template v-if="getIntegration(providerInfo.provider)">
            <Button
              variant="outline"
              size="sm"
              :disabled="testingProvider === providerInfo.provider"
              @click="testConnection(providerInfo.provider)"
            >
              <LoaderCircle
                v-if="testingProvider === providerInfo.provider"
                aria-hidden="true"
                class="animate-spin motion-reduce:animate-none"
              />
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
              @click="deleteIntegration(providerInfo.provider)"
            >
              <LoaderCircle
                v-if="deletingProvider === providerInfo.provider"
                aria-hidden="true"
                class="animate-spin motion-reduce:animate-none"
              />
              <Trash2 v-else aria-hidden="true" />
              Disconnect
            </Button>
          </template>
          <Button
            v-else-if="providerInfo.available"
            size="sm"
            @click="openConfigModal(providerInfo.provider)"
          >
            Connect<span class="sr-only"> {{ providerInfo.name }}</span>
          </Button>
        </div>
      </li>
    </ul>

    <ClickUpConfigModal
      v-if="showClickUpModal"
      :existing-config="getIntegration(ExternalTicketProvider.CLICKUP)"
      @close="showClickUpModal = false"
      @configured="handleClickUpConfigured"
    />
  </div>
</template>

<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { LoaderCircle, PlugZap, Settings, Trash2 } from "@lucide/vue";
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";

import { StatusBadge } from "@/base_components/page";
import ClickUpConfigModal from "@/codeclarity_components/tickets/integrations/ClickUpConfigModal.vue";
import {
  ExternalTicketProvider,
  type IntegrationConfigSummary,
} from "@/codeclarity_components/tickets/tickets.entity";
import { TicketsRepository } from "@/codeclarity_components/tickets/tickets.repository";
import router from "@/router";
import { Alert, AlertDescription, AlertTitle } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/shadcn/ui/card";
import { Skeleton } from "@/shadcn/ui/skeleton";
import { useAuthStore } from "@/stores/auth";
import { errorToast, successToast } from "@/utils/toasts";

import DeleteIntegrationDialog from "../DeleteIntegrationDialog.vue";

const props = defineProps<{ orgId: string }>();

const authStore = useAuthStore();
const ticketsRepository = new TicketsRepository();

const loading = ref(true);
const error = ref(false);
const clickUpConfig = ref<IntegrationConfigSummary | null>(null);
const showConfigModal = ref(false);
const confirmOpen = ref(false);
const isDeleting = ref(false);
const isTesting = ref(false);
const testResult = ref<{ success: boolean; message: string } | null>(null);

async function fetchClickUpConfig(): Promise<void> {
  if (!authStore.getToken) return;
  loading.value = true;
  error.value = false;
  try {
    const response = await ticketsRepository.getIntegrations({
      orgId: props.orgId,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });
    clickUpConfig.value =
      response.data.find(
        (i) => i.provider === ExternalTicketProvider.CLICKUP && i.has_config,
      ) ?? null;
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

async function testConnection(): Promise<void> {
  if (!authStore.getToken) return;
  isTesting.value = true;
  testResult.value = null;
  try {
    const response = await ticketsRepository.testIntegration({
      orgId: props.orgId,
      provider: ExternalTicketProvider.CLICKUP,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });
    testResult.value = response.data.success
      ? {
          success: true,
          message: `Connected as ${response.data.user_info?.name ?? "an unknown user"}`,
        }
      : {
          success: false,
          message: response.data.error ?? "The connection test failed",
        };
  } catch {
    testResult.value = {
      success: false,
      message: "The connection test failed",
    };
  } finally {
    isTesting.value = false;
  }
}

async function deleteIntegration(): Promise<void> {
  if (!authStore.getToken) return;
  isDeleting.value = true;
  try {
    await ticketsRepository.deleteIntegration({
      orgId: props.orgId,
      provider: ExternalTicketProvider.CLICKUP,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });
    successToast("Deleted the ClickUp integration");
    void router.push({
      name: "orgs",
      params: { orgId: props.orgId, page: "integrations", action: "manage" },
    });
  } catch {
    errorToast("Failed to delete the ClickUp integration");
  } finally {
    isDeleting.value = false;
  }
}

function onConfigured(): void {
  showConfigModal.value = false;
  void fetchClickUpConfig();
  successToast("Updated the ClickUp integration");
}

onMounted(() => void fetchClickUpConfig());
</script>

<template>
  <div class="flex flex-col gap-6">
    <h2
      class="flex items-center gap-3 text-2xl font-bold text-foreground-strong"
    >
      <Icon icon="simple-icons:clickup" aria-hidden="true" class="size-8" />
      ClickUp integration
    </h2>

    <div
      v-if="loading"
      role="status"
      aria-label="Loading the ClickUp integration"
      class="grid grid-cols-2 gap-6"
    >
      <Skeleton class="h-64 rounded-card" />
      <Skeleton class="h-64 rounded-card" />
    </div>

    <Alert v-else-if="error" variant="destructive">
      <AlertTitle>The ClickUp integration could not be loaded</AlertTitle>
      <AlertDescription class="flex flex-col items-start gap-3">
        We encountered an error while loading its configuration.
        <div class="flex gap-2">
          <Button variant="outline" size="sm" @click="fetchClickUpConfig">
            Try again
          </Button>
          <Button variant="outline" size="sm" @click="router.back()">
            Go back
          </Button>
        </div>
      </AlertDescription>
    </Alert>

    <Card v-else-if="!clickUpConfig" class="rounded-card shadow-card">
      <CardHeader>
        <h3 class="text-lg font-semibold leading-none text-foreground-strong">
          ClickUp is not configured
        </h3>
        <CardDescription>
          Configure it to sync tickets to ClickUp tasks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button @click="showConfigModal = true">Configure ClickUp</Button>
      </CardContent>
    </Card>

    <div v-else class="grid grid-cols-2 items-start gap-6">
      <Card class="rounded-card shadow-card">
        <CardHeader>
          <h3 class="text-lg font-semibold leading-none text-foreground-strong">
            Status
          </h3>
        </CardHeader>
        <CardContent class="flex flex-col gap-6">
          <dl class="grid grid-cols-[max-content_1fr] gap-x-8 gap-y-3 text-sm">
            <dt class="text-muted-foreground">Connection</dt>
            <dd>
              <StatusBadge
                :tone="clickUpConfig.enabled ? 'success' : 'neutral'"
                :label="clickUpConfig.enabled ? 'Connected' : 'Disabled'"
              />
            </dd>
            <dt class="text-muted-foreground">Workspace</dt>
            <dd>{{ clickUpConfig.workspace_name ?? "Not set" }}</dd>
            <dt class="text-muted-foreground">List</dt>
            <dd>{{ clickUpConfig.list_name ?? "Not set" }}</dd>
            <dt class="text-muted-foreground">Create tasks for new tickets</dt>
            <dd>{{ clickUpConfig.auto_sync_on_create ? "On" : "Off" }}</dd>
            <dt class="text-muted-foreground">Sync status changes</dt>
            <dd>{{ clickUpConfig.sync_status_changes ? "On" : "Off" }}</dd>
          </dl>

          <p
            v-if="testResult"
            role="status"
            class="text-sm"
            :class="testResult.success ? 'text-success' : 'text-destructive'"
          >
            {{ testResult.message }}
          </p>
        </CardContent>
      </Card>

      <Card class="rounded-card shadow-card">
        <CardHeader>
          <h3 class="text-lg font-semibold leading-none text-foreground-strong">
            Actions
          </h3>
          <CardDescription>
            Synced tasks appear on the
            <RouterLink
              :to="{ name: 'tickets' }"
              class="rounded-sm font-medium text-brand-subtle-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >Tickets</RouterLink
            >
            page.
          </CardDescription>
        </CardHeader>
        <CardContent class="flex flex-wrap gap-3">
          <Button variant="outline" @click="showConfigModal = true">
            <Settings aria-hidden="true" />
            Reconfigure
          </Button>
          <Button
            variant="outline"
            :disabled="isTesting"
            @click="testConnection"
          >
            <LoaderCircle
              v-if="isTesting"
              aria-hidden="true"
              class="animate-spin motion-reduce:animate-none"
            />
            <PlugZap v-else aria-hidden="true" />
            Test connection
          </Button>
          <Button variant="destructive" @click="confirmOpen = true">
            <Trash2 aria-hidden="true" />
            Delete integration
          </Button>
        </CardContent>
      </Card>
    </div>

    <ClickUpConfigModal
      v-if="showConfigModal"
      :existing-config="clickUpConfig || undefined"
      @close="showConfigModal = false"
      @configured="onConfigured"
    />
    <DeleteIntegrationDialog
      v-model:open="confirmOpen"
      name="ClickUp"
      :busy="isDeleting"
      @confirm="deleteIntegration"
    />
  </div>
</template>

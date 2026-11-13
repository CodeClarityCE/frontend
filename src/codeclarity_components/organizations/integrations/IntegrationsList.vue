<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { Trash2 } from "@lucide/vue";
import type { ColumnDef } from "@tanstack/vue-table";
import { computed, ref } from "vue";
import { type RouteLocationRaw, RouterLink } from "vue-router";

import { DataTable } from "@/base_components/data-table";
import { StatTile, StatusBadge, type StatusTone } from "@/base_components/page";
import {
  IntegrationProvider,
  type VCS,
} from "@/codeclarity_components/organizations/integrations/Integrations";
import { IntegrationsRepository } from "@/codeclarity_components/organizations/integrations/IntegrationsRepository";
import {
  isMemberRoleGreaterOrEqualTo,
  MemberRole,
  type Organization,
} from "@/codeclarity_components/organizations/organization.entity";
import HeaderItem from "@/codeclarity_components/organizations/subcomponents/HeaderItem.vue";
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
import { useAuthStore } from "@/stores/auth";
import { formatDate } from "@/utils/dateUtils";
import { errorToast, successToast } from "@/utils/toasts";

import DeleteIntegrationDialog from "./DeleteIntegrationDialog.vue";
import { integrationHealth } from "./integration-status";

interface Row {
  id: string;
  name: string;
  logo: string;
  host: string;
  kind: string;
  tone: StatusTone;
  status: string;
  addedOn: number;
  manage: RouteLocationRaw;
  provider: IntegrationProvider;
}

const props = defineProps<{ orgId: string }>();

const authStore = useAuthStore();
const integrationRepo = new IntegrationsRepository();
const ticketsRepo = new TicketsRepository();

const vcsIntegrations = ref<VCS[]>([]);
const clickUpConfig = ref<IntegrationConfigSummary | null>(null);
const loading = ref(true);
const vcsError = ref(false);
const ticketingError = ref(false);
const pendingDelete = ref<Row | null>(null);
const deleting = ref(false);

const deleteOpen = computed({
  get: () => pendingDelete.value !== null,
  set: (open: boolean) => {
    if (!open) pendingDelete.value = null;
  },
});

// Literal ids so the logo bundler finds them.
const logos: Record<string, string> = {
  [IntegrationProvider.GITHUB]: "devicon:github",
  [IntegrationProvider.GITLAB]: "devicon:gitlab",
  [IntegrationProvider.CLICKUP]: "simple-icons:clickup",
};

const providerNames: Record<string, string> = {
  [IntegrationProvider.GITHUB]: "GitHub",
  [IntegrationProvider.GITLAB]: "GitLab",
  [IntegrationProvider.CLICKUP]: "ClickUp",
};

function manageRoute(
  provider: IntegrationProvider,
  integrationId?: string,
): RouteLocationRaw {
  return {
    name: "orgs",
    params: { action: "edit", page: "integrations", orgId: props.orgId },
    query: integrationId ? { provider, integrationId } : { provider },
  };
}

const rows = computed<Row[]>(() => {
  const vcsRows = vcsIntegrations.value.map((integration): Row => {
    const health = integrationHealth(integration);
    const provider = integration.integration_provider;
    return {
      id: integration.id,
      name: providerNames[provider] ?? "Integration",
      logo: logos[provider] ?? "",
      host: integration.service_domain,
      kind: "Version control",
      tone: health.tone,
      status: health.label,
      addedOn: new Date(integration.added_on).getTime(),
      provider,
      manage: manageRoute(provider, integration.id),
    };
  });
  const config = clickUpConfig.value;
  if (!config) return vcsRows;
  const clickUpRow: Row = {
    id: config.id,
    name: "ClickUp",
    logo: logos[IntegrationProvider.CLICKUP] ?? "",
    host: config.workspace_name ?? "ClickUp workspace",
    kind: "Ticketing",
    tone: config.enabled ? "success" : "neutral",
    status: config.enabled ? "Connected" : "Disabled",
    addedOn: new Date(config.created_on).getTime(),
    provider: IntegrationProvider.CLICKUP,
    manage: manageRoute(IntegrationProvider.CLICKUP),
  };
  return [...vcsRows, clickUpRow];
});

const columns: ColumnDef<Row, unknown>[] = [
  { id: "service", accessorKey: "name", header: "Service" },
  { id: "host", accessorKey: "host", header: "Host" },
  { id: "kind", accessorKey: "kind", header: "Type" },
  { id: "status", accessorKey: "status", header: "Status" },
  {
    id: "added",
    accessorKey: "addedOn",
    header: "Added",
    enableGlobalFilter: false,
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    enableGlobalFilter: false,
  },
];

const counts = computed(() => {
  const tones = vcsIntegrations.value.map((i) => integrationHealth(i).tone);
  return {
    healthy: tones.filter((tone) => tone === "success").length,
    expiring: tones.filter((tone) => tone === "warning").length,
    invalid: tones.filter((tone) => tone === "danger").length,
  };
});

function connected(provider: IntegrationProvider): boolean {
  return vcsIntegrations.value.some((i) => i.integration_provider === provider);
}

const missing = computed(() =>
  [
    IntegrationProvider.GITHUB,
    IntegrationProvider.GITLAB,
    IntegrationProvider.CLICKUP,
  ].filter((provider) =>
    provider === IntegrationProvider.CLICKUP
      ? !clickUpConfig.value
      : !connected(provider),
  ),
);

function addRoute(provider: IntegrationProvider): RouteLocationRaw {
  return {
    name: "orgs",
    params: { action: "add", page: "integrations", orgId: props.orgId },
    query: { provider },
  };
}

function setOrgInfo(org: Organization): void {
  if (!isMemberRoleGreaterOrEqualTo(org.role, MemberRole.ADMIN)) {
    void router.push({ name: "orgs", params: { page: "", orgId: org.id } });
  }
}

async function fetchVcs(): Promise<void> {
  if (!authStore.getToken) return;
  try {
    const resp = await integrationRepo.getVCS({
      orgId: props.orgId,
      bearerToken: authStore.getToken,
      pagination: { page: 0, entries_per_page: 100 },
      handleBusinessErrors: true,
    });
    vcsIntegrations.value = resp.data;
    vcsError.value = false;
  } catch {
    vcsError.value = true;
  }
}

async function fetchTicketing(): Promise<void> {
  if (!authStore.getToken) return;
  try {
    const resp = await ticketsRepo.getIntegrations({
      orgId: props.orgId,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });
    clickUpConfig.value =
      resp.data.find(
        (i) => i.provider === ExternalTicketProvider.CLICKUP && i.has_config,
      ) ?? null;
    ticketingError.value = false;
  } catch {
    ticketingError.value = true;
  }
}

async function load(): Promise<void> {
  loading.value = true;
  await Promise.all([fetchVcs(), fetchTicketing()]);
  loading.value = false;
}

async function confirmDelete(): Promise<void> {
  const row = pendingDelete.value;
  if (!row || !authStore.getToken) return;
  deleting.value = true;
  try {
    if (row.provider === IntegrationProvider.CLICKUP) {
      await ticketsRepo.deleteIntegration({
        orgId: props.orgId,
        bearerToken: authStore.getToken,
        provider: ExternalTicketProvider.CLICKUP,
        handleBusinessErrors: true,
      });
    } else {
      await integrationRepo.deleteIntegration({
        orgId: props.orgId,
        bearerToken: authStore.getToken,
        integrationId: row.id,
        handleBusinessErrors: true,
      });
    }
    successToast(`Deleted the ${row.name} integration`);
    pendingDelete.value = null;
    await load();
  } catch {
    errorToast("Failed to delete the integration");
  } finally {
    deleting.value = false;
  }
}

void load();
</script>

<template>
  <div class="flex flex-col gap-8">
    <HeaderItem v-if="orgId" :org-id="orgId" @on-org-info="setOrgInfo" />

    <ul aria-label="Integration health" class="grid grid-cols-4 gap-4">
      <StatTile label="Healthy" :value="counts.healthy" />
      <StatTile label="Expiring soon" :value="counts.expiring" />
      <StatTile label="Invalid or expired" :value="counts.invalid" />
      <StatTile label="Total" :value="rows.length" />
    </ul>

    <Alert v-if="vcsError || ticketingError" variant="destructive">
      <AlertTitle>Some integrations could not be loaded</AlertTitle>
      <AlertDescription class="flex items-center justify-between gap-4">
        {{
          vcsError
            ? "The version control integrations failed to load."
            : "The ticketing integrations failed to load."
        }}
        <Button variant="outline" size="sm" @click="load">Try again</Button>
      </AlertDescription>
    </Alert>

    <section aria-labelledby="integrations-heading" class="flex flex-col gap-4">
      <h2
        id="integrations-heading"
        class="text-xl font-semibold text-foreground-strong"
      >
        Connected services
      </h2>
      <DataTable
        :columns="columns"
        :data="rows"
        :loading="loading"
        :row-key="(row: Row) => row.id"
        caption="Integrations"
        empty-text="No integrations yet. Add one below."
      >
        <template #cell-service="{ row }">
          <span class="flex items-center gap-2 font-semibold">
            <Icon :icon="row.logo" aria-hidden="true" class="size-5" />
            {{ row.name }}
          </span>
        </template>
        <template #cell-status="{ row }">
          <StatusBadge :tone="row.tone" :label="row.status" />
        </template>
        <template #cell-added="{ row }">
          {{ formatDate(new Date(row.addedOn), "MMM DD, YYYY") }}
        </template>
        <template #cell-actions="{ row }">
          <div class="flex items-center gap-2">
            <Button
              :as="RouterLink"
              :to="row.manage"
              variant="outline"
              size="sm"
            >
              Manage
              <span class="sr-only">the {{ row.name }} integration</span>
            </Button>
            <Button
              variant="destructive"
              size="icon-sm"
              :aria-label="`Delete the ${row.name} integration on ${row.host}`"
              @click="pendingDelete = row"
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        </template>
      </DataTable>
    </section>

    <Card class="rounded-card shadow-card">
      <CardHeader>
        <h2 class="font-semibold leading-none text-foreground-strong">
          Add an integration
        </h2>
        <CardDescription>
          Import repositories from version control, or sync tickets to your
          tracker.
        </CardDescription>
      </CardHeader>
      <CardContent class="flex flex-wrap gap-3">
        <Button
          v-for="provider in missing"
          :key="provider"
          :as="RouterLink"
          :to="addRoute(provider)"
          variant="outline"
        >
          <Icon :icon="logos[provider]!" aria-hidden="true" />
          Add {{ providerNames[provider] }}
        </Button>
        <p v-if="missing.length === 0" class="text-sm text-muted-foreground">
          Every supported service is connected.
        </p>
      </CardContent>
    </Card>

    <DeleteIntegrationDialog
      v-model:open="deleteOpen"
      :name="pendingDelete?.name ?? ''"
      :busy="deleting"
      @confirm="confirmDelete"
    />
  </div>
</template>

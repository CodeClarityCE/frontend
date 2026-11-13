<script lang="ts" setup>
import { Pencil, Plus, Trash2 } from "@lucide/vue";
import type { ColumnDef } from "@tanstack/vue-table";
import { ref } from "vue";
import { RouterLink } from "vue-router";

import { DataTable } from "@/base_components/data-table";
import {
  BrandEmphasis,
  OwlEmptyState,
  PageHeading,
} from "@/base_components/page";
import type { Analyzer } from "@/codeclarity_components/organizations/analyzers/Analyzer";
import { AnalyzerRepository } from "@/codeclarity_components/organizations/analyzers/AnalyzerRepository";
import {
  isMemberRoleGreaterOrEqualTo,
  MemberRole,
  type Organization,
} from "@/codeclarity_components/organizations/organization.entity";
import HeaderItem from "@/codeclarity_components/organizations/subcomponents/HeaderItem.vue";
import router from "@/router";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { useAuthStore } from "@/stores/auth";
import { formatShortDate } from "@/utils/dateUtils";
import { errorToast, successToast } from "@/utils/toasts";

const authStore = useAuthStore();
const analyzerRepo = new AnalyzerRepository();

const orgInfo = ref<Organization>();
const analyzers = ref<Analyzer[]>([]);
const loaded = ref(false);
const error = ref(false);
const pendingDelete = ref<Analyzer | null>(null);
const deleting = ref(false);

const props = defineProps<{
  action?: string;
  page?: string;
  orgId: string;
}>();

const columns: ColumnDef<Analyzer, unknown>[] = [
  { id: "name", accessorKey: "name", header: "Name" },
  {
    id: "stages",
    accessorFn: (analyzer) => analyzer.steps.length,
    header: "Stages",
    enableGlobalFilter: false,
  },
  {
    id: "created",
    accessorFn: (analyzer) => new Date(analyzer.created_on).getTime(),
    header: "Created",
    enableGlobalFilter: false,
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    enableGlobalFilter: false,
  },
];

// Only admins manage analyzers; others go back to the organisation overview.
function setOrgInfo(_orgInfo: Organization): void {
  orgInfo.value = _orgInfo;
  if (!isMemberRoleGreaterOrEqualTo(_orgInfo.role, MemberRole.ADMIN)) {
    void router.push({
      name: "orgs",
      params: { action: "manage", page: "main", orgId: _orgInfo.id },
    });
  }
}

async function fetchAnalyzers(): Promise<void> {
  if (!(authStore.getAuthenticated && authStore.getToken)) return;
  error.value = false;
  try {
    const resp = await analyzerRepo.getAnalyzers({
      orgId: props.orgId,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
      page: 0,
      entries_per_page: 0,
      search_key: "",
    });
    analyzers.value = resp.data;
  } catch {
    error.value = true;
  } finally {
    loaded.value = true;
  }
}

async function confirmDelete(): Promise<void> {
  const target = pendingDelete.value;
  if (!target || !authStore.getToken) return;
  deleting.value = true;
  try {
    await analyzerRepo.deleteAnalyzer({
      orgId: props.orgId,
      analyzer_id: target.id,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
    });
    successToast(`Deleted ${target.name}`);
    pendingDelete.value = null;
    await fetchAnalyzers();
  } catch {
    errorToast(`Failed to delete ${target.name}`);
  } finally {
    deleting.value = false;
  }
}

function closeDialog(open: boolean): void {
  if (!open) pendingDelete.value = null;
}

const createRoute = {
  name: "orgs",
  params: { action: "add", page: "analyzers", orgId: props.orgId },
};

void fetchAnalyzers();

defineExpose({ fetchAnalyzers, orgInfo });
</script>
<template>
  <div class="flex flex-col gap-8">
    <HeaderItem
      v-if="orgId"
      :org-id="orgId"
      @on-org-info="setOrgInfo($event)"
    />

    <PageHeading
      description="Analyzers are the workflows of plugins an analysis runs."
    >
      <BrandEmphasis>Analyzers</BrandEmphasis>
      <template #actions>
        <Button :as="RouterLink" :to="createRoute">
          <Plus aria-hidden="true" />
          New analyzer
        </Button>
      </template>
    </PageHeading>

    <Alert v-if="error" variant="destructive">
      <AlertDescription class="flex flex-wrap items-center gap-3">
        The analyzers could not be loaded.
        <Button variant="outline" size="sm" @click="fetchAnalyzers">
          Try again
        </Button>
      </AlertDescription>
    </Alert>

    <OwlEmptyState
      v-else-if="loaded && analyzers.length === 0"
      title="No analyzers yet"
      description="An analyzer chains plugins, such as an SBOM builder and a vulnerability finder, into the workflow an analysis runs."
    >
      <Button :as="RouterLink" :to="createRoute" arrow>
        Create an analyzer
      </Button>
    </OwlEmptyState>

    <DataTable
      v-else
      :columns="columns"
      :data="analyzers"
      :loading="!loaded"
      :row-key="(analyzer: Analyzer) => analyzer.id"
      caption="Analyzers"
      filter-label="Filter analyzers"
      empty-text="No analyzers match."
    >
      <template #cell-name="{ row }">
        <div class="flex flex-col">
          <span class="font-semibold text-foreground-strong">
            {{ row.name }}
          </span>
          <span class="text-xs text-muted-foreground">
            {{ row.description }}
          </span>
        </div>
      </template>
      <template #cell-stages="{ row }">
        <span class="tabular-nums">
          {{ row.steps.length }}
          {{ row.steps.length === 1 ? "stage" : "stages" }}
        </span>
      </template>
      <template #cell-created="{ row }">
        {{ formatShortDate(row.created_on) }}
      </template>
      <template #cell-actions="{ row }">
        <div class="flex items-center gap-2">
          <Button
            :as="RouterLink"
            :to="{
              name: 'orgs',
              params: { action: 'edit', page: 'analyzers', orgId },
              query: { analyzerId: row.id },
            }"
            variant="outline"
            size="sm"
            :aria-label="`Edit ${row.name}`"
          >
            <Pencil aria-hidden="true" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="text-destructive hover:bg-destructive/10 hover:text-destructive"
            :aria-label="`Delete ${row.name}`"
            @click="pendingDelete = row"
          >
            <Trash2 aria-hidden="true" />
            Delete
          </Button>
        </div>
      </template>
    </DataTable>

    <Dialog :open="pendingDelete !== null" @update:open="closeDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {{ pendingDelete?.name }}?</DialogTitle>
          <DialogDescription>
            Analyses can no longer use this analyzer. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            :disabled="deleting"
            @click="confirmDelete"
          >
            Delete analyzer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

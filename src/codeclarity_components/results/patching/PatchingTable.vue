<script lang="ts" setup>
import type { ColumnDef } from "@tanstack/vue-table";
import { computed, type Ref, ref, watch } from "vue";

import { DataTable } from "@/base_components/data-table";
import { StatusBadge } from "@/base_components/page";
import type {
  PatchInfo,
  Workspace,
} from "@/codeclarity_components/results/patching/Patching";
import { ResultsRepository } from "@/codeclarity_components/results/results.repository";
import { Alert, AlertDescription, AlertTitle } from "@/shadcn/ui/alert";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { SortDirection } from "@/utils/api/PaginatedRequestOptions";

import PatchComponent from "./patch/PatchComponent.vue";
import { patchStatus, semverText } from "./patch-format";

const props = withDefaults(
  defineProps<{ analysisID?: string; projectID?: string }>(),
  { analysisID: "", projectID: "" },
);

interface PatchRow {
  name: string;
  type: "prod" | "dev";
  patch: PatchInfo;
}

const resultsRepository = new ResultsRepository();
const userStore = useUserStore();
const authStore = useAuthStore();

const workspace: Ref<Workspace | null> = ref(null);
const loading = ref(true);
const failed = ref(false);

let latestRequest = 0;

// The API answers with every patch of the workspace at once.
async function load(): Promise<void> {
  const org = userStore.getDefaultOrg;
  const token = authStore.getToken;
  if (!org || !token || props.projectID === "" || props.analysisID === "")
    return;
  const request = ++latestRequest;
  try {
    const res = await resultsRepository.getPatches({
      orgId: org.id,
      projectId: props.projectID,
      analysisId: props.analysisID,
      workspace: ".",
      bearerToken: token,
      pagination: { page: 0, entries_per_page: 100 },
      sort: { sortKey: "patch_type", sortDirection: SortDirection.DESC },
      active_filters: "",
      search_key: "",
      handleBusinessErrors: true,
    });
    if (request !== latestRequest) return;
    workspace.value = res.data;
    failed.value = false;
  } catch {
    if (request === latestRequest) failed.value = true;
  } finally {
    if (request === latestRequest) loading.value = false;
  }
}

watch([() => props.projectID, () => props.analysisID], () => void load(), {
  immediate: true,
});

const rows = computed<PatchRow[]>(() => [
  ...Object.entries(workspace.value?.patches ?? {}).map(([name, patch]) => ({
    name,
    type: "prod" as const,
    patch,
  })),
  ...Object.entries(workspace.value?.dev_patches ?? {}).map(
    ([name, patch]) => ({ name, type: "dev" as const, patch }),
  ),
]);

function vulnerabilityCount(row: PatchRow): number {
  return (
    (row.patch.Patchable?.length ?? 0) + (row.patch.Unpatchable?.length ?? 0)
  );
}

const columns: ColumnDef<PatchRow, unknown>[] = [
  { id: "name", header: "Direct dependency", accessorFn: (r) => r.name },
  {
    id: "scope",
    header: "Scope",
    enableGlobalFilter: false,
    accessorFn: (r) => (r.type === "dev" ? "Development" : "Production"),
  },
  {
    id: "status",
    header: "Status",
    enableGlobalFilter: false,
    accessorFn: (r) => patchStatus(r.patch.IsPatchable).label,
  },
  {
    id: "vulnerabilities",
    header: "Vulnerabilities",
    enableGlobalFilter: false,
    accessorFn: vulnerabilityCount,
  },
  {
    id: "fixed",
    header: "Fixed",
    enableGlobalFilter: false,
    accessorFn: (r) => r.patch.Patchable?.length ?? 0,
  },
  {
    id: "upgrade",
    header: "Upgrade to",
    enableSorting: false,
    enableGlobalFilter: false,
    accessorFn: (r) => semverText(r.patch.Update) ?? "",
  },
  {
    id: "details",
    header: "Details",
    enableSorting: false,
    enableGlobalFilter: false,
    accessorFn: () => null,
  },
];

function rowKey(row: PatchRow): string {
  return `${row.type}:${row.name}`;
}
</script>

<template>
  <section aria-labelledby="patch-table-heading" class="flex flex-col gap-4">
    <h3
      id="patch-table-heading"
      class="text-lg font-semibold tracking-tight text-foreground-strong"
    >
      Patches by direct dependency
    </h3>
    <Alert v-if="failed" variant="destructive">
      <AlertTitle>Could not load the patches</AlertTitle>
      <AlertDescription>Reload the page to try again.</AlertDescription>
    </Alert>
    <DataTable
      v-else
      :columns="columns"
      :data="rows"
      :loading="loading"
      :row-key="rowKey"
      caption="Patches"
      filter-label="Search patches"
      empty-text="No vulnerable direct dependencies."
    >
      <template #cell-name="{ row }">
        <code class="font-mono font-semibold text-foreground-strong">{{
          row.name
        }}</code>
      </template>
      <template #cell-status="{ row }">
        <StatusBadge
          v-bind="patchStatus(row.patch.IsPatchable)"
          class="whitespace-nowrap"
        />
      </template>
      <template #cell-upgrade="{ row }">
        <code v-if="semverText(row.patch.Update)" class="font-mono text-sm">{{
          semverText(row.patch.Update)
        }}</code>
        <span v-else class="text-muted-foreground">No fixed version</span>
      </template>
      <template #cell-details="{ row }">
        <PatchComponent :patch="row.patch" :name="row.name" :type="row.type" />
      </template>
    </DataTable>
  </section>
</template>

<script lang="ts" setup>
import type { SortingState } from "@tanstack/vue-table";
import { refDebounced } from "@vueuse/core";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

import { BrandEmphasis, PageHeading } from "@/base_components/page";
import { leaveUnlessOrgAdmin } from "@/codeclarity_components/organizations/admin-only";
import type { AuditLog } from "@/codeclarity_components/organizations/audit_logs/AuditLog";
import { type Organization } from "@/codeclarity_components/organizations/organization.entity";
import { OrgRepository } from "@/codeclarity_components/organizations/organization.repository";
import HeaderItem from "@/codeclarity_components/organizations/subcomponents/HeaderItem.vue";
import AuditLogsTable from "@/enterprise_components/activity_logs/AuditLogsTable.vue";
import router from "@/router";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import { useAuthStore } from "@/stores/auth";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { SortDirection } from "@/utils/api/PaginatedRequestOptions";

const PAGE_SIZE = 20;

const props = defineProps<{ orgId?: string; page?: string }>();

const orgRepo = new OrgRepository();
const authStore = useAuthStore();
const route = useRoute();

const orgId =
  props.orgId ??
  (typeof route.params.orgId === "string" ? route.params.orgId : "");

const logs = ref<AuditLog[]>([]);
const total = ref(0);
const loading = ref(true);
const hasError = ref(false);
const errorCode = ref<string>();
const search = ref("");
const debouncedSearch = refDebounced(search, 300);
const pageIndex = ref(0);
const sorting = ref<SortingState>([{ id: "created_on", desc: true }]);

const emptyText = computed(() =>
  debouncedSearch.value.trim() !== ""
    ? "No audit log entries match."
    : "No audit log entries yet.",
);

// Counts requests so an answer for an earlier query is dropped.
let latestRequest = 0;

async function load(): Promise<void> {
  const token = authStore.getToken;
  if (!orgId || !token) return;
  const request = ++latestRequest;
  const sort = sorting.value[0] ?? { id: "created_on", desc: true };
  loading.value = true;
  try {
    const response = await orgRepo.getOrgAuditLogs({
      orgId,
      bearerToken: token,
      search: { searchKey: debouncedSearch.value.trim() },
      pagination: { page: pageIndex.value, entries_per_page: PAGE_SIZE },
      sort: {
        sortKey: sort.id,
        sortDirection: sort.desc ? SortDirection.DESC : SortDirection.ASC,
      },
      handleBusinessErrors: true,
    });
    if (request !== latestRequest) return;
    logs.value = response.data;
    total.value = response.matching_count ?? response.total_entries;
    hasError.value = false;
    errorCode.value = undefined;
  } catch (err) {
    if (request !== latestRequest) return;
    hasError.value = true;
    errorCode.value =
      err instanceof BusinessLogicError ? err.error_code : undefined;
  } finally {
    if (request === latestRequest) loading.value = false;
  }
}

// Audit logs need an admin, as on the API.
function setOrgInfo(info: Organization): void {
  leaveUnlessOrgAdmin(info);
}

// A new search starts from the first page.
watch(debouncedSearch, () => {
  pageIndex.value = 0;
});

watch([pageIndex, sorting, debouncedSearch], () => void load());

onMounted(() => {
  if (!orgId) {
    router.back();
    return;
  }
  void load();
});
</script>

<template>
  <div class="flex flex-col gap-8">
    <HeaderItem v-if="orgId" :org-id="orgId" @on-org-info="setOrgInfo" />

    <PageHeading description="Who changed what in the organisation, and when.">
      Audit <BrandEmphasis>logs</BrandEmphasis>
    </PageHeading>

    <Alert v-if="hasError" variant="destructive">
      <AlertDescription class="flex flex-wrap items-center gap-3">
        <template v-if="errorCode === APIErrors.NotAuthorized">
          You do not have permission to see this organisation's audit logs.
        </template>
        <template v-else>
          The audit logs could not be loaded.
          <Button variant="outline" size="sm" @click="load">Try again</Button>
        </template>
      </AlertDescription>
    </Alert>

    <AuditLogsTable
      v-else
      v-model:filter="search"
      v-model:page-index="pageIndex"
      :logs="logs"
      :loading="loading"
      :total="total"
      :page-size="PAGE_SIZE"
      :empty-text="emptyText"
      @update:sorting="sorting = $event"
    />
  </div>
</template>

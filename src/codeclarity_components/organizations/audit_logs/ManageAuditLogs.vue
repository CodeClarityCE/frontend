<script lang="ts" setup>
import { X } from "@lucide/vue";
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";

import { BrandEmphasis, PageHeading } from "@/base_components/page";
import type { AuditLog } from "@/codeclarity_components/organizations/audit_logs/AuditLog";
import {
  isMemberRoleGreaterThan,
  MemberRole,
  type Organization,
} from "@/codeclarity_components/organizations/organization.entity";
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

/** The API's largest page; every entry is loaded so the table can sort and filter them all */
const FETCH_PAGE_SIZE = 100;

const props = defineProps<{ orgId?: string; page?: string }>();

const orgRepo = new OrgRepository();
const authStore = useAuthStore();
const route = useRoute();

const orgId =
  props.orgId ??
  (typeof route.params.orgId === "string" ? route.params.orgId : "");
const orgInfo = ref<Organization>();
const logs = ref<AuditLog[]>([]);
const loaded = ref(false);
const hasError = ref(false);
const errorCode = ref<string>();

// The members page links here with ?search=<email> to show one member's entries.
const person = computed(() =>
  typeof route.query.search === "string" ? route.query.search : "",
);
const shownLogs = computed(() =>
  person.value
    ? logs.value.filter(
        (log) => (log.blame_on?.email ?? log.blame_on_email) === person.value,
      )
    : logs.value,
);

async function fetchAll(token: string): Promise<AuditLog[]> {
  const all: AuditLog[] = [];
  for (let page = 0; ; page++) {
    const response = await orgRepo.getOrgAuditLogs({
      orgId,
      bearerToken: token,
      search: { searchKey: "" },
      pagination: { page, entries_per_page: FETCH_PAGE_SIZE },
      sort: { sortKey: "created_on", sortDirection: SortDirection.DESC },
      handleBusinessErrors: true,
    });
    all.push(...response.data);
    if (page + 1 >= response.total_pages) return all;
  }
}

async function load(): Promise<void> {
  if (!orgId || !authStore.getToken) return;
  hasError.value = false;
  errorCode.value = undefined;
  try {
    logs.value = await fetchAll(authStore.getToken);
  } catch (err) {
    hasError.value = true;
    if (err instanceof BusinessLogicError) errorCode.value = err.error_code;
  } finally {
    loaded.value = true;
  }
}

function setOrgInfo(info: Organization): void {
  orgInfo.value = info;
  if (!isMemberRoleGreaterThan(info.role, MemberRole.USER)) {
    void router.push({
      name: "orgs",
      params: { action: "manage", page: "main", orgId: info.id },
    });
  }
}

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

    <div
      v-if="person"
      class="flex w-fit items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-sm"
    >
      <span>
        Showing entries by <strong>{{ person }}</strong>
      </span>
      <RouterLink
        :to="{
          name: 'orgs',
          params: { action: 'manage', page: 'logs', orgId },
        }"
        class="inline-flex items-center gap-1 rounded-sm font-medium text-foreground-strong underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <X aria-hidden="true" class="size-3.5" />
        Show everyone
      </RouterLink>
    </div>

    <Alert v-if="hasError" variant="destructive">
      <AlertDescription class="flex flex-wrap items-center gap-3">
        <template v-if="errorCode === APIErrors.NotAuthorized">
          You do not have permission to see this organisation's audit logs.
        </template>
        <template v-else-if="errorCode === APIErrors.EntityNotFound">
          This organisation does not exist.
        </template>
        <template v-else>
          The audit logs could not be loaded.
          <Button variant="outline" size="sm" @click="load">Try again</Button>
        </template>
      </AlertDescription>
    </Alert>

    <AuditLogsTable v-else :logs="shownLogs" :loading="!loaded" />
  </div>
</template>

<script lang="ts" setup>
import { LogOut, Plus, Trash2 } from "@lucide/vue";
import type { ColumnDef } from "@tanstack/vue-table";
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";

import { DataTable } from "@/base_components/data-table";
import {
  BrandEmphasis,
  OwlEmptyState,
  PageHeading,
} from "@/base_components/page";
import { MemberRole } from "@/codeclarity_components/organizations/organization.entity";
import { OrgRepository } from "@/codeclarity_components/organizations/organization.repository";
import type { OrganizationMembership } from "@/codeclarity_components/organizations/organization_membership.entity";
import OrgActionDialog from "@/codeclarity_components/organizations/subcomponents/OrgActionDialog.vue";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import { useAuthStore } from "@/stores/auth";
import { formatDate } from "@/utils/dateUtils";

/** The API's largest page; every membership is loaded so the table can sort and filter them all */
const FETCH_PAGE_SIZE = 100;

const roleLabels: Record<MemberRole, string> = {
  [MemberRole.OWNER]: "Owner",
  [MemberRole.ADMIN]: "Admin",
  [MemberRole.MODERATOR]: "Moderator",
  [MemberRole.USER]: "Member",
};

const authStore = useAuthStore();
const orgRepo = new OrgRepository();

const memberships = ref<OrganizationMembership[]>([]);
const loaded = ref(false);
const hasError = ref(false);

const dialogOpen = ref(false);
const pending = ref<{
  action: "leave" | "delete";
  id: string;
  name: string;
} | null>(null);

const columns: ColumnDef<OrganizationMembership, unknown>[] = [
  { id: "name", accessorFn: (m) => m.organization.name, header: "Name" },
  {
    id: "role",
    accessorFn: (m) => roleLabels[m.organization.role] ?? "Member",
    header: "Your role",
  },
  {
    id: "members",
    accessorFn: (m) => m.organization.number_of_members,
    header: "Members",
    enableGlobalFilter: false,
  },
  {
    id: "joined",
    accessorFn: (m) => new Date(m.organization.joined_on).getTime(),
    header: "Joined",
    enableGlobalFilter: false,
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    enableGlobalFilter: false,
  },
];

async function load(): Promise<void> {
  if (!authStore.getToken) return;
  try {
    const all: OrganizationMembership[] = [];
    for (let page = 0; ; page++) {
      const response = await orgRepo.getMany({
        bearerToken: authStore.getToken,
        handleBusinessErrors: true,
        pagination: { page, entries_per_page: FETCH_PAGE_SIZE },
      });
      all.push(...response.data);
      if (page + 1 >= response.total_pages) break;
    }
    memberships.value = all;
    hasError.value = false;
  } catch {
    hasError.value = true;
  } finally {
    loaded.value = true;
  }
}

function ask(action: "leave" | "delete", m: OrganizationMembership): void {
  pending.value = { action, id: m.organization.id, name: m.organization.name };
  dialogOpen.value = true;
}

onMounted(() => void load());
</script>

<template>
  <PageHeading
    description="The organisations you belong to. Each one has its own projects, members and settings."
  >
    <BrandEmphasis>Organisations</BrandEmphasis>
    <template #actions>
      <Button
        :as="RouterLink"
        :to="{ name: 'orgs', params: { action: 'add' } }"
      >
        <Plus aria-hidden="true" />
        New organisation
      </Button>
    </template>
  </PageHeading>

  <Alert v-if="hasError" variant="destructive">
    <AlertDescription class="flex items-center justify-between gap-4">
      The organisations could not be loaded.
      <Button size="sm" variant="outline" @click="load()">Try again</Button>
    </AlertDescription>
  </Alert>

  <OwlEmptyState
    v-else-if="loaded && memberships.length === 0"
    title="No organisations yet"
    description="An organisation groups projects, members, integrations and policies."
  >
    <Button
      :as="RouterLink"
      :to="{ name: 'orgs', params: { action: 'add' } }"
      arrow
    >
      Create an organisation
    </Button>
  </OwlEmptyState>

  <DataTable
    v-else
    :columns="columns"
    :data="memberships"
    :loading="!loaded"
    :row-key="(m: OrganizationMembership) => m.organization.id"
    caption="Organisations"
    filter-label="Filter organisations"
    empty-text="No organisations match."
    row-testid="org-row"
  >
    <template #cell-name="{ row }">
      <div class="flex flex-col">
        <RouterLink
          :to="{
            name: 'orgs',
            params: {
              action: 'manage',
              page: 'main',
              orgId: row.organization.id,
            },
          }"
          class="w-fit rounded-sm font-semibold text-foreground-strong underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {{ row.organization.name }}
        </RouterLink>
        <span
          v-if="row.organization.personal"
          class="text-xs text-muted-foreground"
        >
          Personal
        </span>
      </div>
    </template>
    <template #cell-members="{ row }">
      <span class="tabular-nums">{{ row.organization.number_of_members }}</span>
    </template>
    <template #cell-joined="{ row }">
      {{ formatDate(row.organization.joined_on, "MMM DD, YYYY") }}
    </template>
    <template #cell-actions="{ row }">
      <div v-if="!row.organization.personal" class="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          :aria-label="`Leave ${row.organization.name}`"
          @click="ask('leave', row)"
        >
          <LogOut aria-hidden="true" />
          Leave
        </Button>
        <Button
          v-if="row.organization.role === MemberRole.OWNER"
          size="sm"
          variant="destructive"
          :aria-label="`Delete ${row.organization.name}`"
          @click="ask('delete', row)"
        >
          <Trash2 aria-hidden="true" />
          Delete
        </Button>
      </div>
    </template>
  </DataTable>

  <OrgActionDialog
    v-if="pending"
    v-model:open="dialogOpen"
    :action="pending.action"
    :org-id="pending.id"
    :org-name="pending.name"
    @done="load()"
  />
</template>

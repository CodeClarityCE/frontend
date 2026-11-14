<script lang="ts" setup>
import { ScrollText, UserMinus, UserPlus } from "@lucide/vue";
import type { ColumnDef } from "@tanstack/vue-table";
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";

import { DataTable } from "@/base_components/data-table";
import { BrandEmphasis, PageHeading } from "@/base_components/page";
import {
  isMemberRoleGreaterThan,
  MemberRole,
  type Organization,
  type TeamMember,
} from "@/codeclarity_components/organizations/organization.entity";
import { OrgRepository } from "@/codeclarity_components/organizations/organization.repository";
import HeaderItem from "@/codeclarity_components/organizations/subcomponents/HeaderItem.vue";
import router from "@/router";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { SortDirection } from "@/utils/api/PaginatedRequestOptions";
import { formatDate } from "@/utils/dateUtils";
import { errorToast, successToast } from "@/utils/toasts";

import ConfirmDestructiveDialog from "./ConfirmDestructiveDialog.vue";
import { roleLabel } from "./member-role";
import RoleBadge from "./RoleBadge.vue";

/** The API's largest page; every member is loaded so the table can sort and filter them all */
const FETCH_PAGE_SIZE = 100;

const orgRepo = new OrgRepository();
const authStore = useAuthStore();
const userStore = useUserStore();
const route = useRoute();

const props = defineProps<{ orgId?: string; page?: string }>();
const orgId =
  props.orgId ??
  (typeof route.params.orgId === "string" ? route.params.orgId : "");
const orgInfo = ref<Organization>();
const members = ref<TeamMember[]>([]);
const loaded = ref(false);
const errorCode = ref<string>();
const hasError = ref(false);

const removing = ref<TeamMember>();
const removeOpen = ref(false);
const removeBusy = ref(false);

const canInvite = computed(
  () =>
    !!orgInfo.value &&
    !orgInfo.value.personal &&
    isMemberRoleGreaterThan(orgInfo.value.role, MemberRole.USER),
);

const columns: ColumnDef<TeamMember, unknown>[] = [
  {
    id: "member",
    accessorFn: (m) => `${m.first_name} ${m.last_name} @${m.handle}`,
    header: "Member",
  },
  { id: "email", accessorKey: "email", header: "Email" },
  {
    id: "role",
    accessorFn: (m) => roleLabel(m.role),
    // Owners first when sorted ascending
    sortingFn: (a, b) => a.original.role - b.original.role,
    header: "Role",
  },
  {
    id: "joined",
    accessorFn: (m) => new Date(m.joined_on).getTime(),
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

function fullName(m: TeamMember): string {
  return `${m.first_name} ${m.last_name}`;
}

function isSelf(m: TeamMember): boolean {
  return m.id === userStore.getUser?.id;
}

function canSeeLogs(m: TeamMember): boolean {
  if (!orgInfo.value) return false;
  return (
    isSelf(m) ||
    isMemberRoleGreaterThan(orgInfo.value.role, m.role) ||
    m.added_by === userStore.getUser?.id
  );
}

function canRemove(m: TeamMember): boolean {
  if (!orgInfo.value || isSelf(m)) return false;
  return (
    isMemberRoleGreaterThan(orgInfo.value.role, m.role) ||
    m.added_by === userStore.getUser?.id
  );
}

async function fetchAll(token: string): Promise<TeamMember[]> {
  const all: TeamMember[] = [];
  for (let page = 0; ; page++) {
    const response = await orgRepo.getOrgMembers({
      orgId,
      bearerToken: token,
      search: { searchKey: "" },
      pagination: { page, entries_per_page: FETCH_PAGE_SIZE },
      sort: { sortKey: "role", sortDirection: SortDirection.ASC },
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
    members.value = await fetchAll(authStore.getToken);
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

function askRemove(m: TeamMember): void {
  removing.value = m;
  removeOpen.value = true;
}

function removeError(code: string): string {
  switch (code) {
    case APIErrors.NotAuthorized:
      return "Your role does not allow removing this member";
    case APIErrors.CannotRevokeOwnMembership:
      return "You cannot remove yourself";
    case APIErrors.PersonalOrgCannotBeModified:
      return "A personal organisation cannot be changed";
    default:
      return "Failed to remove the member";
  }
}

async function confirmRemove(): Promise<void> {
  const target = removing.value;
  if (!target || !authStore.getToken) return;
  removeBusy.value = true;
  try {
    await orgRepo.revokeMembership({
      orgId,
      userId: target.id,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
    });
    successToast(`Removed ${fullName(target)}`);
  } catch (err) {
    const code = err instanceof BusinessLogicError ? err.error_code : "";
    // Someone who already left counts as removed
    if (code === APIErrors.NotAMember) {
      successToast(`Removed ${fullName(target)}`);
    } else {
      errorToast(removeError(code));
    }
  } finally {
    removeBusy.value = false;
    removeOpen.value = false;
    await load();
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

    <PageHeading
      description="Everyone in the organisation and the role they hold."
    >
      <BrandEmphasis>Members</BrandEmphasis>
      <template v-if="canInvite" #actions>
        <Button
          variant="outline"
          :as="RouterLink"
          :to="{
            name: 'orgs',
            params: { action: 'manage', page: 'invites', orgId },
          }"
        >
          Open invitations
        </Button>
        <Button
          :as="RouterLink"
          :to="{
            name: 'orgs',
            params: { action: 'add', page: 'invites', orgId },
          }"
        >
          <UserPlus aria-hidden="true" />
          Invite a member
        </Button>
      </template>
    </PageHeading>

    <Alert v-if="hasError" variant="destructive">
      <AlertDescription class="flex flex-wrap items-center gap-3">
        <template v-if="errorCode === APIErrors.NotAuthorized">
          You do not have permission to see this organisation's members.
        </template>
        <template v-else-if="errorCode === APIErrors.EntityNotFound">
          This organisation does not exist.
        </template>
        <template v-else>
          The members could not be loaded.
          <Button variant="outline" size="sm" @click="load">Try again</Button>
        </template>
      </AlertDescription>
    </Alert>

    <DataTable
      v-else
      :columns="columns"
      :data="members"
      :loading="!loaded"
      :row-key="(m: TeamMember) => m.id"
      caption="Members"
      filter-label="Filter members"
      empty-text="No members match."
    >
      <template #cell-member="{ row }">
        <div class="flex flex-col">
          <span class="font-semibold text-foreground-strong">
            {{ fullName(row) }}
            <span v-if="isSelf(row)" class="font-normal text-muted-foreground">
              (you)
            </span>
          </span>
          <span class="text-xs text-muted-foreground">@{{ row.handle }}</span>
        </div>
      </template>
      <template #cell-role="{ row }">
        <RoleBadge :role="row.role" />
      </template>
      <template #cell-joined="{ row }">
        {{ formatDate(row.joined_on, "MMM DD, YYYY") }}
      </template>
      <template #cell-actions="{ row }">
        <div class="flex items-center gap-2">
          <Button
            v-if="canSeeLogs(row)"
            variant="outline"
            size="sm"
            :as="RouterLink"
            :to="{
              name: 'orgs',
              params: { action: 'manage', page: 'logs', orgId },
              query: { search: row.email },
            }"
            :aria-label="`Audit logs of ${fullName(row)}`"
          >
            <ScrollText aria-hidden="true" />
            Audit logs
          </Button>
          <Button
            v-if="canRemove(row)"
            variant="destructive"
            size="sm"
            :aria-label="`Remove ${fullName(row)}`"
            @click="askRemove(row)"
          >
            <UserMinus aria-hidden="true" />
            Remove
          </Button>
        </div>
      </template>
    </DataTable>

    <ConfirmDestructiveDialog
      v-model:open="removeOpen"
      :title="`Remove ${removing ? fullName(removing) : ''} from the organisation?`"
      description="They lose access to its projects and results straight away. You can invite them back later."
      confirm-label="Remove member"
      :icon="UserMinus"
      :busy="removeBusy"
      @confirm="confirmRemove"
    />
  </div>
</template>

<script lang="ts" setup>
import { MailX, RefreshCw, UserPlus } from "@lucide/vue";
import type { ColumnDef } from "@tanstack/vue-table";
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";

import { DataTable } from "@/base_components/data-table";
import {
  BrandEmphasis,
  OwlEmptyState,
  PageHeading,
} from "@/base_components/page";
import OrgHeaderItem from "@/codeclarity_components/organizations/subcomponents/HeaderItem.vue";
import router from "@/router";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { SortDirection } from "@/utils/api/PaginatedRequestOptions";
import { formatDate, formatRelativeTime } from "@/utils/dateUtils";
import { errorToast, successToast } from "@/utils/toasts";

import ConfirmDestructiveDialog from "../members/ConfirmDestructiveDialog.vue";
import { roleLabel } from "../members/member-role";
import RoleBadge from "../members/RoleBadge.vue";
import {
  isMemberRoleGreaterThan,
  MemberRole,
  type Organization,
} from "../organization.entity";
import { OrgRepository } from "../organization.repository";

import type { Invitation } from "./invitation.entity";
import InviteMemberDialog from "./InviteMemberDialog.vue";

/** The API's largest page; every invitation is loaded so the table can sort and filter them all */
const FETCH_PAGE_SIZE = 100;

const props = defineProps<{
  page?: string;
  orgId: string;
  action?: string;
}>();

const orgRepository = new OrgRepository();
const authStore = useAuthStore();
const userStore = useUserStore();

const orgInfo = ref<Organization>();
const invitations = ref<Invitation[]>([]);
const loaded = ref(false);
const hasError = ref(false);
const errorCode = ref<string>();

// The "add" route opens the invite form straight away.
const route = useRoute();
const inviteOpen = ref((props.action ?? route.params.action) === "add");
const revoking = ref<Invitation>();
const revokeOpen = ref(false);
const revokeBusy = ref(false);
const resending = ref<string>();

const canInvite = computed(
  () =>
    !!orgInfo.value &&
    !orgInfo.value.personal &&
    isMemberRoleGreaterThan(orgInfo.value.role, MemberRole.USER),
);

const columns: ColumnDef<Invitation, unknown>[] = [
  { id: "email", accessorKey: "user_email", header: "Invitee" },
  {
    id: "role",
    accessorFn: (i) => roleLabel(i.role),
    sortingFn: (a, b) => a.original.role - b.original.role,
    header: "Role",
  },
  {
    id: "inviter",
    accessorFn: (i) => inviterName(i),
    header: "Invited by",
  },
  {
    id: "invited",
    accessorFn: (i) => new Date(i.created_on).getTime(),
    header: "Invited on",
    enableGlobalFilter: false,
  },
  {
    id: "expires",
    accessorFn: (i) => new Date(i.ttl).getTime(),
    header: "Expires",
    enableGlobalFilter: false,
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    enableGlobalFilter: false,
  },
];

function inviterName(i: Invitation): string {
  if (!i.created_by) return "Deleted user";
  return `${i.created_by.first_name} ${i.created_by.last_name}`;
}

function canRevoke(i: Invitation): boolean {
  if (!orgInfo.value) return false;
  return (
    !i.created_by ||
    i.created_by.id === userStore.getUser?.id ||
    isMemberRoleGreaterThan(orgInfo.value.role, i.created_by.role)
  );
}

async function fetchAll(token: string): Promise<Invitation[]> {
  const all: Invitation[] = [];
  for (let page = 0; ; page++) {
    const response = await orgRepository.getInvitations({
      orgId: props.orgId,
      bearerToken: token,
      pagination: { page, entries_per_page: FETCH_PAGE_SIZE },
      search: { searchKey: "" },
      sort: { sortKey: "invited_on", sortDirection: SortDirection.DESC },
      handleBusinessErrors: true,
    });
    all.push(...response.data);
    if (page + 1 >= response.total_pages) return all;
  }
}

async function load(): Promise<void> {
  if (!authStore.getToken) return;
  hasError.value = false;
  errorCode.value = undefined;
  try {
    invitations.value = await fetchAll(authStore.getToken);
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

function actionError(code: string, verb: string): string {
  if (code === APIErrors.NotAuthorized) {
    return "Your role does not allow this";
  }
  return `Failed to ${verb} the invitation`;
}

async function resend(i: Invitation): Promise<void> {
  if (!authStore.getToken || resending.value) return;
  resending.value = i.id;
  try {
    await orgRepository.resendOrgInvitationEmail({
      orgId: props.orgId,
      invitationId: i.id,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
    });
    successToast(`Invitation sent again to ${i.user_email}`);
  } catch (err) {
    const code = err instanceof BusinessLogicError ? err.error_code : "";
    errorToast(actionError(code, "resend"));
  } finally {
    resending.value = undefined;
    await load();
  }
}

function askRevoke(i: Invitation): void {
  revoking.value = i;
  revokeOpen.value = true;
}

async function confirmRevoke(): Promise<void> {
  const target = revoking.value;
  if (!target || !authStore.getToken) return;
  revokeBusy.value = true;
  try {
    await orgRepository.revokeInvitation({
      orgId: props.orgId,
      invitationId: target.id,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
    });
    successToast(`Revoked the invitation to ${target.user_email}`);
  } catch (err) {
    const code = err instanceof BusinessLogicError ? err.error_code : "";
    // An invitation that is already gone counts as revoked
    if (code === APIErrors.EntityNotFound) {
      successToast(`Revoked the invitation to ${target.user_email}`);
    } else {
      errorToast(actionError(code, "revoke"));
    }
  } finally {
    revokeBusy.value = false;
    revokeOpen.value = false;
    await load();
  }
}

onMounted(() => void load());
</script>

<template>
  <div class="flex flex-col gap-8">
    <OrgHeaderItem v-if="orgId" :org-id="orgId" @on-org-info="setOrgInfo" />

    <PageHeading description="Invitations that have not been accepted yet.">
      <BrandEmphasis>Invitations</BrandEmphasis>
      <template v-if="canInvite" #actions>
        <Button
          variant="outline"
          :as="RouterLink"
          :to="{
            name: 'orgs',
            params: { action: 'manage', page: 'members', orgId },
          }"
        >
          Members
        </Button>
        <Button @click="inviteOpen = true">
          <UserPlus aria-hidden="true" />
          Invite a member
        </Button>
      </template>
    </PageHeading>

    <Alert v-if="hasError" variant="destructive">
      <AlertDescription class="flex flex-wrap items-center gap-3">
        <template v-if="errorCode === APIErrors.NotAuthorized">
          You do not have permission to see this organisation's invitations.
        </template>
        <template v-else>
          The invitations could not be loaded.
          <Button variant="outline" size="sm" @click="load">Try again</Button>
        </template>
      </AlertDescription>
    </Alert>

    <OwlEmptyState
      v-else-if="loaded && invitations.length === 0"
      title="No open invitations"
      description="Everyone you invited has joined, or nobody has been invited yet."
    >
      <Button v-if="canInvite" arrow @click="inviteOpen = true">
        Invite a member
      </Button>
    </OwlEmptyState>

    <DataTable
      v-else
      :columns="columns"
      :data="invitations"
      :loading="!loaded"
      :row-key="(i: Invitation) => i.id"
      caption="Open invitations"
      filter-label="Filter invitations"
      empty-text="No invitations match."
    >
      <template #cell-email="{ row }">
        <span class="font-semibold text-foreground-strong">
          {{ row.user_email }}
        </span>
      </template>
      <template #cell-role="{ row }">
        <RoleBadge :role="row.role" />
      </template>
      <template #cell-inviter="{ row }">
        <div class="flex flex-col">
          <span>{{ inviterName(row) }}</span>
          <span v-if="row.created_by" class="text-xs text-muted-foreground">
            @{{ row.created_by.handle }}
          </span>
        </div>
      </template>
      <template #cell-invited="{ row }">
        {{ formatDate(row.created_on, "MMM DD, YYYY") }}
      </template>
      <template #cell-expires="{ row }">
        {{ formatRelativeTime(row.ttl) }}
      </template>
      <template #cell-actions="{ row }">
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="resending === row.id"
            :aria-label="`Resend the invitation to ${row.user_email}`"
            @click="resend(row)"
          >
            <RefreshCw
              aria-hidden="true"
              :class="
                resending === row.id
                  ? 'animate-spin motion-reduce:animate-none'
                  : ''
              "
            />
            Resend
          </Button>
          <Button
            v-if="canRevoke(row)"
            variant="destructive"
            size="sm"
            :aria-label="`Revoke the invitation to ${row.user_email}`"
            @click="askRevoke(row)"
          >
            <MailX aria-hidden="true" />
            Revoke
          </Button>
        </div>
      </template>
    </DataTable>

    <InviteMemberDialog
      v-model:open="inviteOpen"
      :org-id="orgId"
      @invited="load"
    />

    <ConfirmDestructiveDialog
      v-model:open="revokeOpen"
      :title="`Revoke the invitation to ${revoking?.user_email ?? ''}?`"
      description="The link in their email stops working. You can invite them again later."
      confirm-label="Revoke invitation"
      :icon="MailX"
      :busy="revokeBusy"
      @confirm="confirmRevoke"
    />
  </div>
</template>

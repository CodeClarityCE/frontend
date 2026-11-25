<script lang="ts" setup>
import { onMounted, ref } from "vue";

import {
  BrandEmphasis,
  PageHeading,
  StatusBadge,
} from "@/base_components/page";
import CopyCommand from "@/base_components/ui/CopyCommand.vue";
import { leaveUnlessOrgAdmin } from "@/codeclarity_components/organizations/admin-only";
import { type Organization } from "@/codeclarity_components/organizations/organization.entity";
import HeaderItem from "@/codeclarity_components/organizations/subcomponents/HeaderItem.vue";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shadcn/ui/alert-dialog";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { NativeSelect, NativeSelectOption } from "@/shadcn/ui/native-select";
import { Spinner } from "@/shadcn/ui/spinner";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";
import { useAuthStore } from "@/stores/auth";
import { formatShortDate } from "@/utils/dateUtils";

import {
  type CreatedOrganizationToken,
  OrganizationTokenScope,
  type OrganizationTokenSummary,
} from "./organization_token.entity";
import { OrganizationTokenRepository } from "./organization_token.repository";

const DAY = 86_400_000;
const EXPIRY_DAYS = [30, 90, 365];

const props = defineProps<{ orgId: string; page?: string }>();

const authStore = useAuthStore();
const tokenRepo = new OrganizationTokenRepository();

const name = ref("");
const scope = ref<OrganizationTokenScope>(OrganizationTokenScope.READ);
const expiryDays = ref("30");
const nameMissing = ref(false);
const failed = ref(false);
const creating = ref(false);
// Held only until the admin clicks Done; the API never sends it again.
const created = ref<CreatedOrganizationToken>();

const tokens = ref<OrganizationTokenSummary[]>();
const listFailed = ref(false);
// The token the revoke dialog asks about.
const toRevoke = ref<OrganizationTokenSummary>();
const revokeOpen = ref(false);
const revoking = ref(false);
const revokeFailed = ref(false);

const SCOPE_LABEL: Record<OrganizationTokenScope, string> = {
  [OrganizationTokenScope.READ]: "Read",
  [OrganizationTokenScope.ANALYZE]: "Analyze",
};

// The create form's scope choices, built from the same labels.
const SCOPE_OPTIONS = [
  {
    value: OrganizationTokenScope.READ,
    text: SCOPE_LABEL[OrganizationTokenScope.READ],
  },
  {
    value: OrganizationTokenScope.ANALYZE,
    text: `${SCOPE_LABEL[OrganizationTokenScope.ANALYZE]} (includes read)`,
  },
];

function isExpired(token: OrganizationTokenSummary): boolean {
  return token.expires_on.getTime() <= Date.now();
}

async function loadTokens(): Promise<void> {
  const bearerToken = authStore.getToken;
  if (!bearerToken) return;
  try {
    tokens.value = await tokenRepo.list({
      orgId: props.orgId,
      bearerToken,
      handleBusinessErrors: true,
    });
    listFailed.value = false;
  } catch {
    listFailed.value = true;
  }
}

function askRevoke(token: OrganizationTokenSummary): void {
  toRevoke.value = token;
  revokeFailed.value = false;
  revokeOpen.value = true;
}

async function revoke(): Promise<void> {
  const bearerToken = authStore.getToken;
  const token = toRevoke.value;
  if (!bearerToken || !token || revoking.value) return;
  revoking.value = true;
  revokeFailed.value = false;
  try {
    await tokenRepo.revoke({
      orgId: props.orgId,
      tokenId: token.id,
      bearerToken,
      handleBusinessErrors: true,
    });
    revokeOpen.value = false;
    await loadTokens();
  } catch {
    revokeFailed.value = true;
  } finally {
    revoking.value = false;
  }
}

onMounted(() => void loadTokens());

async function create(): Promise<void> {
  nameMissing.value = name.value.trim() === "";
  const bearerToken = authStore.getToken;
  if (nameMissing.value || !bearerToken || creating.value) return;
  creating.value = true;
  failed.value = false;
  try {
    created.value = await tokenRepo.create({
      orgId: props.orgId,
      bearerToken,
      data: {
        name: name.value.trim(),
        scope: scope.value,
        expires_on: new Date(
          Date.now() + Number(expiryDays.value) * DAY,
        ).toISOString(),
      },
      handleBusinessErrors: true,
    });
    name.value = "";
    await loadTokens();
  } catch {
    failed.value = true;
  } finally {
    creating.value = false;
  }
}

// Tokens need an admin, as on the API.
function setOrgInfo(info: Organization): void {
  leaveUnlessOrgAdmin(info);
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <HeaderItem :org-id="props.orgId" @on-org-info="setOrgInfo" />

    <PageHeading
      description="Secrets a pipeline uses to act in this organization without a member's password."
    >
      Organization <BrandEmphasis>tokens</BrandEmphasis>
    </PageHeading>

    <section
      v-if="created"
      aria-labelledby="new-token-title"
      class="flex flex-col gap-3 rounded-lg border p-4"
    >
      <h2 id="new-token-title" class="font-semibold text-foreground-strong">
        New token
      </h2>
      <p class="text-sm text-muted-foreground">
        {{ created.name }} ({{ SCOPE_LABEL[created.scope] }}). Copy it now: it
        will not be shown again.
      </p>
      <CopyCommand :command="created.secret" label="token" />
      <div>
        <Button type="button" variant="outline" @click="created = undefined">
          Done
        </Button>
      </div>
    </section>

    <form
      class="flex flex-col gap-4 rounded-lg border p-4"
      novalidate
      @submit.prevent="() => void create()"
    >
      <h2 class="font-semibold text-foreground-strong">Create a token</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="flex min-w-48 flex-1 flex-col gap-1">
          <label for="token-name" class="text-sm font-medium">Name</label>
          <Input
            id="token-name"
            v-model="name"
            maxlength="100"
            placeholder="ci-pipeline"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label for="token-scope" class="text-sm font-medium">Scope</label>
          <NativeSelect id="token-scope" v-model="scope">
            <NativeSelectOption
              v-for="option in SCOPE_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ option.text }}
            </NativeSelectOption>
          </NativeSelect>
        </div>
        <div class="flex flex-col gap-1">
          <label for="token-expiry" class="text-sm font-medium">
            Expires after
          </label>
          <NativeSelect id="token-expiry" v-model="expiryDays">
            <NativeSelectOption
              v-for="days in EXPIRY_DAYS"
              :key="days"
              :value="String(days)"
            >
              {{ days }} days
            </NativeSelectOption>
          </NativeSelect>
        </div>
        <Button type="submit" :disabled="creating">Create token</Button>
      </div>
      <p v-if="nameMissing" role="alert" class="text-sm text-destructive">
        Give the token a name.
      </p>
      <Alert v-if="failed" variant="destructive">
        <AlertDescription>The token could not be created.</AlertDescription>
      </Alert>
    </form>

    <section
      aria-labelledby="tokens-title"
      class="flex flex-col gap-3 rounded-lg border p-4"
    >
      <h2 id="tokens-title" class="font-semibold text-foreground-strong">
        Tokens
      </h2>
      <Alert v-if="listFailed" variant="destructive">
        <AlertDescription>The tokens could not be loaded.</AlertDescription>
      </Alert>
      <p
        v-else-if="tokens && tokens.length === 0"
        class="text-sm text-muted-foreground"
      >
        No tokens yet.
      </p>
      <Table v-else-if="tokens">
        <TableCaption class="sr-only">Tokens</TableCaption>
        <TableHeader>
          <TableRow class="hover:bg-transparent">
            <TableHead>Name</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead>Created by</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead><span class="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="token in tokens" :key="token.id">
            <TableCell class="font-medium">{{ token.name }}</TableCell>
            <TableCell>{{ SCOPE_LABEL[token.scope] }}</TableCell>
            <TableCell>
              {{ token.created_by_email ?? "Deleted account" }}
            </TableCell>
            <TableCell>
              <StatusBadge
                v-if="isExpired(token)"
                tone="neutral"
                label="Expired"
              />
              <span v-else>{{ formatShortDate(token.expires_on) }}</span>
            </TableCell>
            <TableCell class="text-right">
              <Button
                type="button"
                variant="outline"
                size="sm"
                :aria-label="`Revoke ${token.name}`"
                @click="askRevoke(token)"
              >
                Revoke
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </section>

    <AlertDialog v-model:open="revokeOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke {{ toRevoke?.name }}?</AlertDialogTitle>
          <AlertDialogDescription>
            Pipelines using this token are refused from their next request. This
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Alert v-if="revokeFailed" variant="destructive">
          <AlertDescription>The token could not be revoked.</AlertDescription>
        </Alert>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            :disabled="revoking"
            @click="() => void revoke()"
          >
            <Spinner v-if="revoking" />
            Revoke token
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

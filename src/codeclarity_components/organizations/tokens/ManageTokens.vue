<script lang="ts" setup>
import { ref } from "vue";

import { BrandEmphasis, PageHeading } from "@/base_components/page";
import CopyCommand from "@/base_components/ui/CopyCommand.vue";
import {
  MemberRole,
  type Organization,
} from "@/codeclarity_components/organizations/organization.entity";
import HeaderItem from "@/codeclarity_components/organizations/subcomponents/HeaderItem.vue";
import router from "@/router";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { NativeSelect, NativeSelectOption } from "@/shadcn/ui/native-select";
import { useAuthStore } from "@/stores/auth";

import {
  type CreatedOrganizationToken,
  OrganizationTokenScope,
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
  } catch {
    failed.value = true;
  } finally {
    creating.value = false;
  }
}

// Tokens need an admin, as on the API.
function setOrgInfo(info: Organization): void {
  if (info.role !== MemberRole.OWNER && info.role !== MemberRole.ADMIN) {
    void router.push({
      name: "orgs",
      params: { action: "manage", page: "main", orgId: info.id },
    });
  }
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <HeaderItem :org-id="props.orgId" @on-org-info="setOrgInfo" />

    <PageHeading
      description="Secrets a pipeline uses to act in this organisation without a member's password."
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
        {{ created.name }} ({{ created.scope }}). Copy it now: it will not be
        shown again.
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
            <NativeSelectOption :value="OrganizationTokenScope.READ">
              Read
            </NativeSelectOption>
            <NativeSelectOption :value="OrganizationTokenScope.ANALYZE">
              Analyze (includes read)
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
  </div>
</template>

<script lang="ts" setup>
import { Building2, Calendar, Crown, Lock, Users } from "@lucide/vue";
import { type Ref, ref } from "vue";

import {
  MemberRole,
  type Organization,
} from "@/codeclarity_components/organizations/organization.entity";
import { OrgRepository } from "@/codeclarity_components/organizations/organization.repository";
import router from "@/router";
import { Alert, AlertDescription, AlertTitle } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import { Skeleton } from "@/shadcn/ui/skeleton";
import { useAuthStore } from "@/stores/auth";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { formatDate } from "@/utils/dateUtils";

const loading: Ref<boolean> = ref(false);
const orgInfo: Ref<Organization | undefined> = ref();
const errorCode: Ref<string | undefined> = ref();
const error: Ref<boolean> = ref(false);
const orgRepo = new OrgRepository();
const authStore = useAuthStore();

const props = defineProps<{
  orgId: string;
}>();

const emit = defineEmits<{
  (e: "onOrgInfo", orgInfo: Organization): void;
  (e: "onOrgInfoError", error: Error | BusinessLogicError): void;
}>();

const roleLabels: Record<MemberRole, string> = {
  [MemberRole.OWNER]: "Owner",
  [MemberRole.ADMIN]: "Admin",
  [MemberRole.MODERATOR]: "Moderator",
  [MemberRole.USER]: "Member",
};

async function fetchOrgInfo(): Promise<void> {
  if (!props.orgId) return;
  if (authStore.getAuthenticated && authStore.getToken) {
    loading.value = true;
    error.value = false;
    errorCode.value = "";
    try {
      const org = await orgRepo.get({
        orgId: props.orgId,
        bearerToken: authStore.getToken,
        handleBusinessErrors: true,
      });
      orgInfo.value = org;
      emit("onOrgInfo", org);
    } catch (err) {
      error.value = true;
      if (err instanceof BusinessLogicError) {
        errorCode.value = err.error_code;
      }
      emit("onOrgInfoError", err as Error | BusinessLogicError);
    } finally {
      loading.value = false;
    }
  }
}

void fetchOrgInfo();
</script>
<template>
  <div
    v-if="loading"
    role="status"
    aria-label="Loading the organisation"
    class="flex flex-col gap-3 rounded-card border bg-card p-5 shadow-card"
  >
    <Skeleton class="h-6 w-1/4" />
    <Skeleton class="h-4 w-1/2" />
  </div>

  <Alert v-else-if="error" variant="destructive">
    <AlertTitle>The organisation could not be loaded</AlertTitle>
    <AlertDescription class="flex flex-col gap-3">
      <p v-if="errorCode === APIErrors.EntityNotFound">
        This organisation does not exist.
      </p>
      <p v-else-if="errorCode === APIErrors.NotAuthorized">
        You do not have permission to view this organisation.
      </p>
      <p v-else>Something went wrong while loading it.</p>
      <div class="flex gap-2">
        <Button
          v-if="errorCode !== APIErrors.NotAuthorized"
          size="sm"
          @click="fetchOrgInfo()"
        >
          Try again
        </Button>
        <Button size="sm" variant="outline" @click="router.back()">
          Go back
        </Button>
      </div>
    </AlertDescription>
  </Alert>

  <section
    v-else-if="orgInfo"
    aria-label="Organisation"
    class="flex flex-col gap-3 rounded-card border bg-card p-5 text-card-foreground shadow-card"
  >
    <div class="flex flex-wrap items-center gap-3">
      <Building2 aria-hidden="true" class="size-5 text-muted-foreground" />
      <p class="text-lg font-semibold text-foreground-strong">
        {{ orgInfo.name }}
      </p>
      <span
        class="inline-flex items-center gap-1 rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-semibold text-brand-subtle-foreground"
      >
        <Crown
          v-if="orgInfo.role === MemberRole.OWNER"
          aria-hidden="true"
          class="size-3"
        />
        <span class="sr-only">Your role:</span>
        {{ roleLabels[orgInfo.role] ?? "Member" }}
      </span>
      <span
        v-if="orgInfo.personal"
        class="inline-flex items-center gap-1 rounded-full bg-neutral-subtle px-2.5 py-0.5 text-xs font-semibold text-neutral"
        title="Only you can access a personal organisation; nobody else can be invited."
      >
        <Lock aria-hidden="true" class="size-3" />
        Personal
      </span>
    </div>
    <p v-if="orgInfo.description" class="text-sm text-muted-foreground">
      {{ orgInfo.description }}
    </p>
    <dl class="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
      <div class="flex items-center gap-1.5">
        <Users aria-hidden="true" class="size-4" />
        <dt class="sr-only">Members</dt>
        <dd>
          {{ orgInfo.number_of_members }}
          {{ orgInfo.number_of_members === 1 ? "member" : "members" }}
        </dd>
      </div>
      <div class="flex items-center gap-1.5">
        <Calendar aria-hidden="true" class="size-4" />
        <dt class="sr-only">Joined</dt>
        <dd>Joined {{ formatDate(orgInfo.joined_on, "MMM DD, YYYY") }}</dd>
      </div>
      <div class="flex items-center gap-1.5">
        <dt>Owner</dt>
        <dd class="font-medium text-foreground">
          <template v-if="orgInfo.created_by"
            >@{{ orgInfo.created_by.handle }}</template
          >
          <template v-else>Deleted user</template>
        </dd>
      </div>
    </dl>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

import { OrgRepository } from "@/codeclarity_components/organizations/organization.repository";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { useAuthStore } from "@/stores/auth";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { errorToast, successToast } from "@/utils/toasts";

// The days after which a project's current analysis counts as stale.
const props = defineProps<{
  orgId: string;
  days: number;
}>();

const authStore = useAuthStore();
const orgRepo = new OrgRepository();

const value = ref(String(props.days));
const invalid = ref(false);
const saving = ref(false);
watch(
  () => props.days,
  (days) => (value.value = String(days)),
);

async function save(): Promise<void> {
  const days = Number(value.value);
  invalid.value = !Number.isInteger(days) || days < 1 || days > 365;
  if (invalid.value || !authStore.getAuthenticated || saving.value) return;
  saving.value = true;
  try {
    await orgRepo.updateSettings({
      orgId: props.orgId,
      data: { freshness_threshold_days: days },
      handleBusinessErrors: true,
    });
    successToast(`Projects are now stale after ${days} days`);
  } catch (err) {
    errorToast(
      err instanceof BusinessLogicError &&
        err.error_code === APIErrors.NotAuthorized
        ? "You do not have permission to change this setting"
        : "The setting could not be saved",
    );
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <form
    class="flex flex-wrap items-end justify-between gap-6"
    @submit.prevent="() => void save()"
  >
    <div class="flex flex-col gap-1">
      <label
        for="org-freshness-days"
        class="font-medium text-foreground-strong"
      >
        Stale after (days)
      </label>
      <p id="org-freshness-hint" class="text-sm text-muted-foreground">
        A project whose current analysis is older than this is flagged on the
        dashboard, since newer vulnerabilities are not checked in it yet.
      </p>
      <p v-if="invalid" role="alert" class="text-sm text-destructive">
        Enter a whole number of days from 1 to 365.
      </p>
    </div>
    <div class="flex items-center gap-2">
      <Input
        id="org-freshness-days"
        v-model="value"
        type="number"
        min="1"
        max="365"
        step="1"
        class="w-24"
        aria-describedby="org-freshness-hint"
      />
      <Button type="submit" variant="outline" :disabled="saving">Save</Button>
    </div>
  </form>
</template>

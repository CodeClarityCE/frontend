<script setup lang="ts">
import { ref, watch } from "vue";

import type { ServiceLevelTargetDays } from "@/codeclarity_components/organizations/organization.entity";
import { OrgRepository } from "@/codeclarity_components/organizations/organization.repository";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Switch } from "@/shadcn/ui/switch";
import { useAuthStore } from "@/stores/auth";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { errorToast, successToast } from "@/utils/toasts";

// Days allowed per severity, which set the default due date of new tickets.
const props = defineProps<{
  orgId: string;
  enabled: boolean;
  days: ServiceLevelTargetDays;
}>();

const SEVERITIES = [
  { key: "critical", label: "Critical" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
] as const;

type Fields = Record<keyof ServiceLevelTargetDays, string>;

const authStore = useAuthStore();
const orgRepo = new OrgRepository();

const fieldsOf = (days: ServiceLevelTargetDays): Fields => ({
  critical: days.critical === null ? "" : String(days.critical),
  high: days.high === null ? "" : String(days.high),
  medium: days.medium === null ? "" : String(days.medium),
  low: days.low === null ? "" : String(days.low),
});

const on = ref(props.enabled);
const fields = ref<Fields>(fieldsOf(props.days));
const invalid = ref(false);
const saving = ref(false);
watch(
  () => props.enabled,
  (enabled) => (on.value = enabled),
);
watch(
  () => props.days,
  (days) => (fields.value = fieldsOf(days)),
);

// A blank field means no target; anything else must be whole days.
function parse(value: string): number | null | undefined {
  if (String(value).trim() === "") return null;
  const days = Number(value);
  return Number.isInteger(days) && days >= 1 && days <= 3650 ? days : undefined;
}

async function save(): Promise<void> {
  const days = {
    critical: parse(fields.value.critical),
    high: parse(fields.value.high),
    medium: parse(fields.value.medium),
    low: parse(fields.value.low),
  };
  invalid.value = Object.values(days).some((d) => d === undefined);
  if (invalid.value || !authStore.getToken || saving.value) return;
  saving.value = true;
  try {
    await orgRepo.updateSettings({
      orgId: props.orgId,
      bearerToken: authStore.getToken,
      data: {
        service_level_targets_enabled: on.value,
        service_level_targets: days,
      },
      handleBusinessErrors: true,
    });
    successToast(
      on.value
        ? "New tickets now get due dates from the targets"
        : "Service level targets are off",
    );
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
  <form class="flex flex-col gap-4" @submit.prevent="() => void save()">
    <div class="flex items-center justify-between gap-6">
      <div class="flex flex-col gap-1">
        <label for="slt-enabled" class="font-medium text-foreground-strong">
          Use service level targets
        </label>
        <p id="slt-hint" class="text-sm text-muted-foreground">
          A new ticket's due date defaults to the days allowed for the worst
          severity it resolves. Anyone can still change it on the ticket.
        </p>
      </div>
      <Switch
        id="slt-enabled"
        v-model="on"
        :disabled="saving"
        aria-describedby="slt-hint"
      />
    </div>
    <fieldset class="flex flex-wrap items-end gap-4">
      <legend class="mb-2 text-sm text-muted-foreground">
        Days allowed per severity. Leave a field blank for no target.
      </legend>
      <div
        v-for="severity in SEVERITIES"
        :key="severity.key"
        class="flex flex-col gap-1"
      >
        <label :for="`slt-${severity.key}`" class="text-sm font-medium">
          {{ severity.label }}
        </label>
        <Input
          :id="`slt-${severity.key}`"
          v-model="fields[severity.key]"
          type="number"
          min="1"
          max="3650"
          step="1"
          placeholder="None"
          class="w-24"
        />
      </div>
      <Button type="submit" variant="outline" :disabled="saving">Save</Button>
    </fieldset>
    <p v-if="invalid" role="alert" class="text-sm text-destructive">
      Enter whole days from 1 to 3650, or leave a field blank for no target.
    </p>
  </form>
</template>

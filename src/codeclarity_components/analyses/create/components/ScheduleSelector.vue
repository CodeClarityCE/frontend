<script lang="ts" setup>
import { computed, ref, watch } from "vue";

import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";

import type { ScheduleData, ScheduleType } from "./schedule";

const schedule = defineModel<ScheduleData>({ required: true });

const options: { value: ScheduleType; label: string }[] = [
  { value: "once", label: "Once, right away" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

const date = ref("");
const time = ref("12:00");

const recurring = computed(() => schedule.value.schedule_type !== "once");

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function localDate(value: Date): string {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

const today = localDate(new Date());

// Keeps the inputs in step with the model.
watch(
  () => schedule.value.next_scheduled_run,
  (next) => {
    if (!next) return;
    date.value = localDate(next);
    time.value = `${pad(next.getHours())}:${pad(next.getMinutes())}`;
  },
  { immediate: true },
);

function setType(value: unknown): void {
  if (typeof value !== "string") return;
  const type = value as ScheduleType;
  let next = schedule.value.next_scheduled_run;
  if (type !== "once" && !next) {
    // Starts at the next full hour by default.
    next = new Date();
    next.setHours(next.getHours() + 1, 0, 0, 0);
  }
  schedule.value = {
    schedule_type: type,
    is_active: type !== "once",
    next_scheduled_run: type === "once" ? undefined : next,
  };
}

function setDateTime(): void {
  if (!date.value || !time.value) return;
  schedule.value = {
    ...schedule.value,
    next_scheduled_run: new Date(`${date.value}T${time.value}`),
  };
}

function onDate(value: string | number): void {
  date.value = String(value);
  setDateTime();
}

function onTime(value: string | number): void {
  time.value = String(value);
  setDateTime();
}

const summary = computed(() => {
  const next = schedule.value.next_scheduled_run;
  if (!recurring.value) return "Runs once, as soon as you start it.";
  const from = next
    ? ` from ${next.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })}`
    : "";
  return `Runs ${schedule.value.schedule_type}${from}.`;
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-3 gap-4">
      <div class="flex flex-col gap-2">
        <Label for="analysis-schedule">Runs</Label>
        <Select
          :model-value="schedule.schedule_type"
          @update:model-value="setType"
        >
          <SelectTrigger id="analysis-schedule">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in options"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <template v-if="recurring">
        <div class="flex flex-col gap-2">
          <Label for="analysis-first-date">First run date</Label>
          <Input
            id="analysis-first-date"
            type="date"
            :model-value="date"
            :min="today"
            @update:model-value="onDate"
          />
        </div>
        <div class="flex flex-col gap-2">
          <Label for="analysis-first-time">First run time</Label>
          <Input
            id="analysis-first-time"
            type="time"
            :model-value="time"
            @update:model-value="onTime"
          />
        </div>
      </template>
    </div>
    <p class="text-sm text-muted-foreground" aria-live="polite">
      {{ summary }}
    </p>
  </div>
</template>

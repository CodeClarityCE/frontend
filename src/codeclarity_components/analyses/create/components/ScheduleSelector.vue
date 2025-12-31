<!--
  ScheduleSelector Component
  
  A Vue component for configuring analysis scheduling options. Provides a user-friendly
  interface for setting up recurring analysis execution with simplified options.
  
  Features:
  - Three schedule types: once (immediate), daily, weekly
  - Date/time picker for recurring schedules
  - Real-time schedule summary display
  - Form validation and user-friendly error messages
  
  Props:
  - modelValue: ScheduleData object containing current schedule configuration
  
  Emits:
  - update:modelValue: When schedule configuration changes
  
  Usage:
  <ScheduleSelector v-model="scheduleConfig" />
-->
<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { computed, ref, watch } from "vue";

import { cn } from "@/shadcn/lib/utils";
import Button from "@/shadcn/ui/button/Button.vue";
import { FormField } from "@/shadcn/ui/form";
import FormControl from "@/shadcn/ui/form/FormControl.vue";
import FormDescription from "@/shadcn/ui/form/FormDescription.vue";
import FormItem from "@/shadcn/ui/form/FormItem.vue";
import FormLabel from "@/shadcn/ui/form/FormLabel.vue";
import { Input } from "@/shadcn/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { formatDate } from "@/utils/dateUtils";

/**
 * Type definition for schedule configuration data
 * Simplified from original complex scheduling system for better maintainability
 */
interface ScheduleData {
  /** How frequently the analysis should run */
  schedule_type: "once" | "daily" | "weekly";
  /** When the analysis should next be executed (for recurring schedules) */
  next_scheduled_run?: Date;
  /** Whether the schedule is currently active/enabled */
  is_active: boolean;
}

const props = defineProps<{
  modelValue: ScheduleData;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: ScheduleData];
}>();

// ===== REACTIVE DATA =====

/** Two-way binding with parent component for schedule configuration */
const scheduleData = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

// Local state for date/time picker UI
const calendarOpen = ref(false);
const selectedDate = ref(""); // Format: YYYY-MM-DD for HTML date input
const selectedTime = ref("12:00"); // Format: HH:MM for HTML time input

// ===== CONFIGURATION =====

/** Available schedule options with display information */
const scheduleOptions = [
  {
    value: "once",
    label: "Run Once",
    icon: "solar:play-linear",
    description: "Execute immediately",
  },
  {
    value: "daily",
    label: "Daily",
    icon: "solar:calendar-linear",
    description: "Every day",
  },
  {
    value: "weekly",
    label: "Weekly",
    icon: "solar:calendar-mark-linear",
    description: "Every week",
  },
];

// ===== COMPUTED PROPERTIES =====

/** Check if the selected schedule type requires date/time configuration */
const isRecurring = computed(() => scheduleData.value.schedule_type !== "once");

/** Format the selected date/time for display in the button */
const formatScheduleTime = computed(() => {
  if (!scheduleData.value.next_scheduled_run) return "Select date and time";
  return formatDate(
    scheduleData.value.next_scheduled_run,
    "MMM DD, YYYY [at] h:mm A",
  );
});

// ===== HELPER FUNCTIONS =====

/**
 * Initialize default date/time when switching to recurring schedule
 * Sets the next run time to one hour from now as a sensible default
 */
const initializeSchedule = (): void => {
  if (!scheduleData.value.next_scheduled_run && isRecurring.value) {
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0); // Round to next hour
    void updateScheduleData({ next_scheduled_run: nextHour });

    // Update form fields to match the default
    selectedDate.value = getLocalDateString(nextHour);
    selectedTime.value = `${nextHour.getHours().toString().padStart(2, "0")}:00`;
  }
};

// Helper function to get local date string for input[type=date]
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper function to get today's date in local timezone for min attribute
const getTodayLocalDateString = (): string => {
  return getLocalDateString(new Date());
};

// Update form fields when the model value changes
watch(
  () => scheduleData.value.next_scheduled_run,
  (newDate) => {
    if (newDate) {
      selectedDate.value = getLocalDateString(newDate);
      selectedTime.value = `${newDate.getHours().toString().padStart(2, "0")}:${newDate.getMinutes().toString().padStart(2, "0")}`;
    }
  },
  { immediate: true },
);

const updateScheduleData = (updates: Partial<ScheduleData>): void => {
  scheduleData.value = { ...scheduleData.value, ...updates };
};

const updateScheduleType = (
  type: string | number | boolean | bigint | Record<string, unknown> | null,
): void => {
  if (typeof type !== "string") return;
  updateScheduleData({
    schedule_type: type as ScheduleData["schedule_type"],
    is_active: type !== "once", // Automatically enable for recurring schedules
  });
  if (type !== "once") {
    void initializeSchedule();
  }
};

const setDate = (dateStr: string | number): void => {
  selectedDate.value = String(dateStr);
  updateDateTimeIfComplete();
};

const setTime = (timeStr: string | number): void => {
  selectedTime.value = String(timeStr);
  updateDateTimeIfComplete();
};

const updateDateTimeIfComplete = (): void => {
  if (selectedDate.value && selectedTime.value) {
    // Create date in user's local timezone
    const dateTime = new Date(`${selectedDate.value}T${selectedTime.value}`);
    void updateScheduleData({ next_scheduled_run: dateTime });
  }
};

const confirmDateTime = (): void => {
  if (selectedDate.value && selectedTime.value) {
    // Create date in user's local timezone
    const dateTime = new Date(`${selectedDate.value}T${selectedTime.value}`);
    void updateScheduleData({ next_scheduled_run: dateTime });
    calendarOpen.value = false;
  }
};

// Watch for schedule type changes
watch(() => scheduleData.value.schedule_type, initializeSchedule);
</script>

<template>
  <div class="space-y-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
    <div class="flex items-center gap-3">
      <Icon icon="solar:alarm-linear" class="h-5 w-5 text-theme-primary" />
      <h3 class="text-lg font-semibold text-gray-900">Schedule Analysis</h3>
    </div>

    <!-- Schedule Type Selection -->
    <FormField name="schedule_type">
      <FormItem>
        <FormLabel class="text-sm font-medium text-gray-700">
          Schedule Type
        </FormLabel>
        <Select
          :model-value="scheduleData.schedule_type"
          @update:model-value="updateScheduleType"
        >
          <FormControl>
            <SelectTrigger
              class="border-gray-300 focus:ring-1 focus:ring-theme-primary focus:border-theme-primary"
            >
              <SelectValue placeholder="Select schedule type" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectGroup>
              <SelectItem
                v-for="option in scheduleOptions"
                :key="option.value"
                :value="option.value"
              >
                <div class="flex items-center gap-3">
                  <Icon :icon="option.icon" class="h-4 w-4" />
                  <div>
                    <div class="font-medium">{{ option.label }}</div>
                    <div class="text-xs text-gray-500">
                      {{ option.description }}
                    </div>
                  </div>
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <FormDescription class="text-xs text-gray-500">
          Choose how often the analysis should run
        </FormDescription>
      </FormItem>
    </FormField>

    <!-- Date/Time Selection for Recurring Schedules -->
    <div v-if="isRecurring" class="space-y-4">
      <FormField name="next_scheduled_run">
        <FormItem>
          <FormLabel class="text-sm font-medium text-gray-700">
            {{
              scheduleData.schedule_type === "once" ? "Run At" : "First Run At"
            }}
          </FormLabel>
          <Popover v-model:open="calendarOpen">
            <PopoverTrigger as-child>
              <FormControl>
                <Button
                  variant="outline"
                  :class="
                    cn(
                      'w-full justify-start text-left font-normal border-gray-300',
                      !scheduleData.next_scheduled_run &&
                        'text-muted-foreground',
                    )
                  "
                >
                  <Icon icon="solar:calendar-linear" class="mr-2 h-4 w-4" />
                  {{ formatScheduleTime }}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent class="w-80 p-4" align="start">
              <div class="space-y-4">
                <div class="space-y-2">
                  <label class="text-sm font-medium text-gray-700">Date</label>
                  <Input
                    type="date"
                    :model-value="selectedDate"
                    :min="getTodayLocalDateString()"
                    class="w-full"
                    @update:model-value="setDate"
                  />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium text-gray-700">Time</label>
                  <Input
                    type="time"
                    :model-value="selectedTime"
                    class="w-full"
                    @update:model-value="setTime"
                  />
                </div>
                <Button
                  class="w-full"
                  :disabled="!selectedDate || !selectedTime"
                  @click="confirmDateTime"
                >
                  Set Date & Time
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <FormDescription class="text-xs text-gray-500">
            When should the {{ scheduleData.schedule_type }} analysis start?
          </FormDescription>
        </FormItem>
      </FormField>
    </div>

    <!-- Summary -->
    <div
      class="p-3 rounded-lg"
      style="
        background-color: rgba(29, 206, 121, 0.1);
        border: 1px solid rgba(29, 206, 121, 0.3);
      "
    >
      <div class="flex items-start gap-2">
        <Icon
          icon="solar:info-circle-linear"
          class="h-4 w-4 mt-0.5"
          style="color: #1dce79"
        />
        <div class="text-sm text-gray-800">
          <div class="font-medium mb-1">Schedule Summary</div>
          <div v-if="scheduleData.schedule_type === 'once'">
            Analysis will run immediately when created.
          </div>
          <div v-else>
            Analysis will run {{ scheduleData.schedule_type }}
            <span v-if="scheduleData.next_scheduled_run">
              starting
              {{
                formatDate(
                  scheduleData.next_scheduled_run,
                  "MMM DD, YYYY [at] h:mm A",
                )
              }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

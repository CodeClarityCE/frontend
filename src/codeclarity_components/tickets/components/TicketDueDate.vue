<script setup lang="ts">
import { X } from "@lucide/vue";
import { ref, watch } from "vue";

import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { errorToast, successToast } from "@/utils/toasts";

import { TicketsRepository } from "../tickets.repository";

// Edits a ticket's due date, which may have come from a service level target.
const props = defineProps<{
  ticketId: string;
  dueDate?: string | Date | undefined;
}>();

const emit = defineEmits<{ updated: [] }>();

const authStore = useAuthStore();
const userStore = useUserStore();
const ticketsRepository = new TicketsRepository();

// The local calendar day of a date, as a date input wants it.
function dayOf(date: string | Date | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const day = ref(dayOf(props.dueDate));
const saving = ref(false);
watch(
  () => props.dueDate,
  (date) => (day.value = dayOf(date)),
);

async function update(dueDate: string | null): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !authStore.getAuthenticated || saving.value) return;
  saving.value = true;
  try {
    await ticketsRepository.updateTicket({
      orgId,
      ticketId: props.ticketId,
      data: { due_date: dueDate },
      handleBusinessErrors: true,
    });
    successToast(dueDate ? "Due date saved" : "Due date cleared");
    emit("updated");
  } catch {
    errorToast("The due date could not be saved");
  } finally {
    saving.value = false;
  }
}

// A ticket is due until the end of its chosen day.
function save(): Promise<void> {
  if (!day.value) return update(null);
  const [year, month, date] = day.value.split("-").map(Number);
  return update(new Date(year!, month! - 1, date, 23, 59, 59).toISOString());
}
</script>

<template>
  <form class="flex items-center gap-2" @submit.prevent="() => void save()">
    <label for="ticket-due-date" class="sr-only">Due date</label>
    <Input
      id="ticket-due-date"
      v-model="day"
      type="date"
      class="h-8 w-40"
      :disabled="saving"
    />
    <Button type="submit" size="sm" variant="outline" :disabled="saving">
      Save
    </Button>
    <Button
      v-if="dueDate"
      type="button"
      size="sm"
      variant="ghost"
      aria-label="Clear due date"
      :disabled="saving"
      @click="() => void update(null)"
    >
      <X class="h-4 w-4" />
    </Button>
  </form>
</template>

<script setup lang="ts">
import { Ticket } from "@lucide/vue";
import { ref } from "vue";

import { Button } from "@/shadcn/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/ui/tooltip";

import TicketCreateModal, {
  type VulnerabilityData,
} from "./TicketCreateModal.vue";

defineProps<{
  projectId: string;
  projectName?: string;
  vulnerability: VulnerabilityData;
  size?: "default" | "sm" | "lg" | "icon";
  variant?:
    "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}>();

const emit = defineEmits<{
  created: [ticketId: string];
}>();

const isModalOpen = ref(false);

function openModal(): void {
  isModalOpen.value = true;
}

function handleCreated(ticketId: string): void {
  void emit("created", ticketId);
}
</script>

<template>
  <div>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            :size="size || 'sm'"
            :variant="variant || 'outline'"
            @click="openModal"
          >
            <Ticket aria-hidden="true" />
            Create Ticket
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Create a ticket to track remediation</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

    <TicketCreateModal
      v-model:open="isModalOpen"
      :project-id="projectId"
      :project-name="projectName"
      :vulnerability="vulnerability"
      @created="handleCreated"
    />
  </div>
</template>

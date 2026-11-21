<script setup lang="ts">
import { Eye, Ticket } from "@lucide/vue";
import { ref } from "vue";
import { RouterLink } from "vue-router";

import { ticketRoute } from "@/codeclarity_components/tickets/ticket-route";
import { Button } from "@/shadcn/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/ui/tooltip";
import { successToast } from "@/utils/toasts";

import { useVulnerabilityTicket } from "../composables/useVulnerabilityTicket";
import type { VulnerabilityData } from "../tickets.entity";

import TicketCreateModal from "./TicketCreateModal.vue";

const props = defineProps<{
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
const { ticketId, remember } = useVulnerabilityTicket(
  () => props.projectId,
  () => props.vulnerability.vulnerability_id,
);

function openModal(): void {
  isModalOpen.value = true;
}

function handleCreated(id: string): void {
  remember(id);
  successToast("Ticket created");
  void emit("created", id);
}
</script>

<template>
  <div>
    <Button
      v-if="ticketId"
      as-child
      :size="size || 'sm'"
      :variant="variant || 'outline'"
    >
      <RouterLink :to="ticketRoute(ticketId)">
        <Eye aria-hidden="true" />
        View ticket
      </RouterLink>
    </Button>
    <TooltipProvider v-else>
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

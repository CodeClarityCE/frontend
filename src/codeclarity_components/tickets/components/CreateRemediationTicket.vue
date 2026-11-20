<script setup lang="ts">
import { Ticket } from "@lucide/vue";
import { ref } from "vue";
import type { RouteLocationRaw } from "vue-router";

import type { Remediation } from "@/codeclarity_components/vulnerabilities/organization_vulnerability.entity";
import { Button } from "@/shadcn/ui/button";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { logger } from "@/utils/logger";

import type { CreateRemediationTicketResult } from "../tickets.entity";
import { TicketsRepository } from "../tickets.repository";

// Creates a ticket from one remediation, warning first when an open ticket already tracks it.
const props = defineProps<{ projectId: string; remediation: Remediation }>();

const userStore = useUserStore();
const authStore = useAuthStore();
const repository = new TicketsRepository();

const busy = ref(false);
const failed = ref(false);
const createdId = ref<string | null>(null);
const duplicate = ref<CreateRemediationTicketResult["duplicate"]>(null);

const ticketRoute = (ticketId: string): RouteLocationRaw => ({
  path: "/tickets",
  query: { ticket_id: ticketId },
});

async function create(allowDuplicate = false): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  const token = authStore.getToken;
  if (!orgId || !token) return;
  busy.value = true;
  failed.value = false;
  try {
    const { kind, workspace, package: pkg } = props.remediation;
    const response = await repository.createRemediationTicket({
      orgId,
      projectId: props.projectId,
      bearerToken: token,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      data: {
        kind,
        workspace,
        package: pkg,
        ...(allowDuplicate ? { allow_duplicate: true } : {}),
      },
    });
    createdId.value = response.data.ticket_id;
    duplicate.value = response.data.duplicate;
  } catch (error) {
    failed.value = true;
    logger.warn(
      "Could not create a ticket from a remediation",
      { projectId: props.projectId },
      error,
    );
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 text-sm">
    <template v-if="createdId">
      <span role="status">Ticket created</span>
      <RouterLink
        :to="ticketRoute(createdId)"
        class="font-medium text-brand-subtle-foreground underline-offset-4 hover:underline"
        >View ticket</RouterLink
      >
    </template>
    <div
      v-else-if="duplicate"
      role="alert"
      class="flex flex-wrap items-center gap-2 rounded-control border border-warning bg-warning-subtle px-3 py-2"
    >
      <span
        >An open ticket already tracks this remediation:
        {{ duplicate.title }}</span
      >
      <RouterLink
        :to="ticketRoute(duplicate.ticket_id)"
        class="font-medium underline-offset-4 hover:underline"
        >View ticket</RouterLink
      >
      <Button size="sm" variant="outline" :disabled="busy" @click="create(true)"
        >Create anyway</Button
      >
    </div>
    <template v-else>
      <Button size="sm" variant="outline" :disabled="busy" @click="create()">
        <Ticket aria-hidden="true" />
        Create ticket
      </Button>
      <span v-if="failed" role="status" class="text-destructive"
        >Could not create the ticket. Try again.</span
      >
    </template>
  </div>
</template>

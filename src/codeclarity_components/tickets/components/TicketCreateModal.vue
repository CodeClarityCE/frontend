<script setup lang="ts">
import { Eye, LoaderCircle, Plus, Ticket } from "@lucide/vue";
import { computed, ref, watch } from "vue";

import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Textarea } from "@/shadcn/ui/textarea";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";

import {
  TicketPriority,
  TicketPriorityLabels,
  TicketType,
  TicketTypeLabels,
} from "../tickets.entity";
import { TicketsRepository } from "../tickets.repository";

export interface VulnerabilityData {
  vulnerability_id: string;
  severity_score?: number;
  severity_class?: string;
  affected_package?: string;
  affected_version?: string;
  description?: string;
  recommended_version?: string;
}

const props = defineProps<{
  projectId: string;
  projectName?: string;
  vulnerability?: VulnerabilityData;
}>();

const emit = defineEmits<{
  created: [ticketId: string];
  close: [];
}>();

const isOpen = defineModel<boolean>("open", { default: false });

const userStore = useUserStore();
const authStore = useAuthStore();
const ticketsRepository = new TicketsRepository();

const isLoading = ref(false);
const isCheckingDuplicate = ref(false);
const duplicateTicket = ref<{ id: string; title: string } | null>(null);
const error = ref<string | null>(null);

// Form state
const title = ref("");
const description = ref("");
const priority = ref<TicketPriority>(TicketPriority.MEDIUM);
const ticketType = ref<TicketType>(TicketType.VULNERABILITY);
const remediationNotes = ref("");

// Computed default priority based on severity
const suggestedPriority = computed(() => {
  const score = props.vulnerability?.severity_score;
  if (!score) return TicketPriority.MEDIUM;
  if (score >= 9) return TicketPriority.CRITICAL;
  if (score >= 7) return TicketPriority.HIGH;
  if (score >= 4) return TicketPriority.MEDIUM;
  return TicketPriority.LOW;
});

// Initialize form when vulnerability changes
watch(
  () => props.vulnerability,
  (vuln) => {
    if (vuln) {
      title.value = `${vuln.vulnerability_id}: ${vuln.affected_package ?? "Unknown package"}`;
      description.value = vuln.description ?? "";
      priority.value = suggestedPriority.value;

      if (vuln.recommended_version) {
        remediationNotes.value = `Upgrade ${vuln.affected_package} from ${vuln.affected_version ?? "current version"} to ${vuln.recommended_version}`;
      }

      // Check for duplicate
      void checkDuplicate();
    }
  },
  { immediate: true },
);

async function checkDuplicate(): Promise<void> {
  if (!props.vulnerability?.vulnerability_id || !props.projectId) return;

  const orgId = userStore.getDefaultOrg?.id;
  const token = authStore.getToken;
  if (!orgId || !token) return;

  isCheckingDuplicate.value = true;
  duplicateTicket.value = null;

  try {
    const response = await ticketsRepository.checkDuplicate({
      orgId,
      bearerToken: token,
      data: {
        project_id: props.projectId,
        vulnerability_id: props.vulnerability.vulnerability_id,
      },
    });

    const result = response.data;
    if (result.exists && result.existing_ticket_id) {
      duplicateTicket.value = {
        id: result.existing_ticket_id,
        title: result.existing_ticket_title ?? "Existing ticket",
      };
    }
  } catch {
    // Without the check the user can still create the ticket.
  } finally {
    isCheckingDuplicate.value = false;
  }
}

async function handleSubmit(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  const token = authStore.getToken;
  if (!orgId || !token) {
    error.value = "Not authenticated";
    return;
  }

  if (!title.value.trim()) {
    error.value = "Title is required";
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    const result = await ticketsRepository.createTicket({
      orgId,
      bearerToken: token,
      data: {
        title: title.value,
        description: description.value,
        priority: priority.value,
        type: ticketType.value,
        project_id: props.projectId,
        vulnerability_id: props.vulnerability?.vulnerability_id,
        affected_package: props.vulnerability?.affected_package,
        affected_version: props.vulnerability?.affected_version,
        severity_score: props.vulnerability?.severity_score,
        severity_class: props.vulnerability?.severity_class,
        recommended_version: props.vulnerability?.recommended_version,
        remediation_notes: remediationNotes.value ?? undefined,
      },
    });

    void emit("created", result.id);
    isOpen.value = false;
    void resetForm();
  } catch {
    error.value = "Failed to create ticket. Please try again.";
  } finally {
    isLoading.value = false;
  }
}

function resetForm(): void {
  title.value = "";
  description.value = "";
  priority.value = TicketPriority.MEDIUM;
  ticketType.value = TicketType.VULNERABILITY;
  remediationNotes.value = "";
  error.value = null;
  duplicateTicket.value = null;
}

function handleClose(): void {
  isOpen.value = false;
  void emit("close");
}

function viewExistingTicket(): void {
  if (duplicateTicket.value) {
    // Navigate to existing ticket
    window.location.href = `/tickets?ticket_id=${duplicateTicket.value.id}`;
  }
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Ticket aria-hidden="true" class="size-5" />
          Create Ticket
        </DialogTitle>
        <DialogDescription>
          Create a ticket to track remediation of this vulnerability.
        </DialogDescription>
      </DialogHeader>

      <div
        v-if="duplicateTicket"
        role="status"
        class="flex flex-col gap-2 rounded-card border border-warning bg-warning-subtle p-4 text-sm text-warning"
      >
        <p class="font-semibold">
          A ticket already exists for this vulnerability
        </p>
        <p>{{ duplicateTicket.title }}</p>
        <Button
          variant="outline"
          size="sm"
          class="w-fit"
          @click="viewExistingTicket"
        >
          <Eye aria-hidden="true" />
          View Existing Ticket
        </Button>
      </div>

      <p
        v-if="isCheckingDuplicate"
        role="status"
        class="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <LoaderCircle
          aria-hidden="true"
          class="size-4 animate-spin motion-reduce:animate-none"
        />
        Checking for existing tickets
      </p>

      <dl
        v-if="vulnerability"
        class="flex flex-col gap-2 rounded-card bg-muted p-4 text-sm"
      >
        <div class="flex items-center justify-between">
          <dt class="font-medium text-foreground">Vulnerability</dt>
          <dd class="font-mono font-semibold text-foreground-strong">
            {{ vulnerability.vulnerability_id }}
          </dd>
        </div>
        <div
          v-if="vulnerability.severity_score"
          class="flex items-center justify-between"
        >
          <dt class="text-muted-foreground">Severity</dt>
          <dd class="font-medium text-foreground-strong">
            {{ vulnerability.severity_score?.toFixed(1) }}
            <span
              v-if="vulnerability.severity_class"
              class="text-muted-foreground"
            >
              ({{ vulnerability.severity_class }})
            </span>
          </dd>
        </div>
        <div
          v-if="vulnerability.affected_package"
          class="flex items-center justify-between"
        >
          <dt class="text-muted-foreground">Package</dt>
          <dd class="text-foreground-strong">
            {{ vulnerability.affected_package }}@{{
              vulnerability.affected_version
            }}
          </dd>
        </div>
      </dl>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div class="space-y-2">
          <Label for="ticket-title">Title</Label>
          <Input
            id="ticket-title"
            v-model="title"
            placeholder="Enter ticket title"
            :disabled="isLoading"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="ticket-priority">Priority</Label>
            <Select v-model="priority" :disabled="isLoading">
              <SelectTrigger id="ticket-priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="(label, key) in TicketPriorityLabels"
                  :key="key"
                  :value="key"
                >
                  {{ label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="ticket-type">Type</Label>
            <Select v-model="ticketType" :disabled="isLoading">
              <SelectTrigger id="ticket-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="(label, key) in TicketTypeLabels"
                  :key="key"
                  :value="key"
                >
                  {{ label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="ticket-description">Description</Label>
          <Textarea
            id="ticket-description"
            v-model="description"
            placeholder="Describe the issue..."
            rows="3"
            :disabled="isLoading"
          />
        </div>

        <div class="space-y-2">
          <Label for="ticket-remediation">Remediation Notes (Optional)</Label>
          <Textarea
            id="ticket-remediation"
            v-model="remediationNotes"
            placeholder="Steps to remediate this vulnerability..."
            rows="2"
            :disabled="isLoading"
          />
        </div>

        <p
          v-if="error"
          role="alert"
          class="rounded-control border border-danger p-3 text-sm text-danger"
        >
          {{ error }}
        </p>
      </form>

      <DialogFooter>
        <Button variant="outline" :disabled="isLoading" @click="handleClose">
          Cancel
        </Button>
        <Button :disabled="isLoading || !title.trim()" @click="handleSubmit">
          <LoaderCircle
            v-if="isLoading"
            aria-hidden="true"
            class="animate-spin motion-reduce:animate-none"
          />
          <Plus v-else aria-hidden="true" />
          {{ isLoading ? "Creating..." : "Create Ticket" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

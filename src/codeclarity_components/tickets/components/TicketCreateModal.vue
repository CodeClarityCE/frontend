<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Icon } from '@iconify/vue';
import { Button } from '@/shadcn/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/shadcn/ui/dialog';
import { Input } from '@/shadcn/ui/input';
import { Label } from '@/shadcn/ui/label';
import { Textarea } from '@/shadcn/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/shadcn/ui/select';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { TicketsRepository } from '../tickets.repository';
import {
    TicketPriority,
    TicketType,
    TicketPriorityLabels,
    TicketTypeLabels
} from '../tickets.entity';

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

const isOpen = defineModel<boolean>('open', { default: false });

const userStore = useUserStore();
const authStore = useAuthStore();
const ticketsRepository = new TicketsRepository();

const isLoading = ref(false);
const isCheckingDuplicate = ref(false);
const duplicateTicket = ref<{ id: string; title: string } | null>(null);
const error = ref<string | null>(null);

// Form state
const title = ref('');
const description = ref('');
const priority = ref<TicketPriority>(TicketPriority.MEDIUM);
const ticketType = ref<TicketType>(TicketType.VULNERABILITY);
const remediationNotes = ref('');

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
            title.value = `${vuln.vulnerability_id}: ${vuln.affected_package || 'Unknown package'}`;
            description.value = vuln.description || '';
            priority.value = suggestedPriority.value;

            if (vuln.recommended_version) {
                remediationNotes.value = `Upgrade ${vuln.affected_package} from ${vuln.affected_version || 'current version'} to ${vuln.recommended_version}`;
            }

            // Check for duplicate
            checkDuplicate();
        }
    },
    { immediate: true }
);

async function checkDuplicate() {
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
                vulnerability_id: props.vulnerability.vulnerability_id
            }
        });

        const result = response.data;
        if (result.exists && result.existing_ticket_id) {
            duplicateTicket.value = {
                id: result.existing_ticket_id,
                title: result.existing_ticket_title || 'Existing ticket'
            };
        }
    } catch (err) {
        console.error('Error checking duplicate:', err);
    } finally {
        isCheckingDuplicate.value = false;
    }
}

async function handleSubmit() {
    const orgId = userStore.getDefaultOrg?.id;
    const token = authStore.getToken;
    if (!orgId || !token) {
        error.value = 'Not authenticated';
        return;
    }

    if (!title.value.trim()) {
        error.value = 'Title is required';
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
                remediation_notes: remediationNotes.value || undefined
            }
        });

        emit('created', result.id);
        isOpen.value = false;
        resetForm();
    } catch (err) {
        console.error('Error creating ticket:', err);
        error.value = 'Failed to create ticket. Please try again.';
    } finally {
        isLoading.value = false;
    }
}

function resetForm() {
    title.value = '';
    description.value = '';
    priority.value = TicketPriority.MEDIUM;
    ticketType.value = TicketType.VULNERABILITY;
    remediationNotes.value = '';
    error.value = null;
    duplicateTicket.value = null;
}

function handleClose() {
    isOpen.value = false;
    emit('close');
}

function viewExistingTicket() {
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
                    <Icon icon="solar:ticket-bold" class="w-5 h-5 text-blue-600" />
                    Create Ticket
                </DialogTitle>
                <DialogDescription>
                    Create a ticket to track remediation of this vulnerability.
                </DialogDescription>
            </DialogHeader>

            <!-- Duplicate Warning -->
            <div
                v-if="duplicateTicket"
                class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3"
            >
                <Icon icon="solar:info-circle-bold" class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div class="flex-1">
                    <p class="text-sm font-medium text-yellow-800">A ticket already exists for this vulnerability</p>
                    <p class="text-sm text-yellow-700 mt-1">{{ duplicateTicket.title }}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        class="mt-2 text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                        @click="viewExistingTicket"
                    >
                        <Icon icon="solar:eye-bold" class="w-4 h-4 mr-1" />
                        View Existing Ticket
                    </Button>
                </div>
            </div>

            <!-- Checking duplicate loading -->
            <div
                v-if="isCheckingDuplicate"
                class="flex items-center gap-2 text-sm text-gray-500"
            >
                <Icon icon="solar:refresh-bold" class="w-4 h-4 animate-spin" />
                Checking for existing tickets...
            </div>

            <!-- Vulnerability Info -->
            <div
                v-if="vulnerability"
                class="bg-gray-50 rounded-lg p-4 space-y-2"
            >
                <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-700">Vulnerability</span>
                    <span class="font-mono text-sm font-semibold text-gray-900">
                        {{ vulnerability.vulnerability_id }}
                    </span>
                </div>
                <div v-if="vulnerability.severity_score" class="flex items-center justify-between">
                    <span class="text-sm text-gray-600">Severity</span>
                    <span
                        class="text-sm font-medium"
                        :class="{
                            'text-red-600': (vulnerability.severity_score || 0) >= 9,
                            'text-orange-600': (vulnerability.severity_score || 0) >= 7 && (vulnerability.severity_score || 0) < 9,
                            'text-yellow-600': (vulnerability.severity_score || 0) >= 4 && (vulnerability.severity_score || 0) < 7,
                            'text-green-600': (vulnerability.severity_score || 0) < 4
                        }"
                    >
                        {{ vulnerability.severity_score?.toFixed(1) }}
                        <span v-if="vulnerability.severity_class" class="text-gray-500">
                            ({{ vulnerability.severity_class }})
                        </span>
                    </span>
                </div>
                <div v-if="vulnerability.affected_package" class="flex items-center justify-between">
                    <span class="text-sm text-gray-600">Package</span>
                    <span class="text-sm text-gray-900">
                        {{ vulnerability.affected_package }}@{{ vulnerability.affected_version }}
                    </span>
                </div>
            </div>

            <!-- Form -->
            <form class="space-y-4" @submit.prevent="handleSubmit">
                <div class="space-y-2">
                    <Label for="title">Title</Label>
                    <Input
                        id="title"
                        v-model="title"
                        placeholder="Enter ticket title"
                        :disabled="isLoading"
                    />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <Label for="priority">Priority</Label>
                        <Select v-model="priority" :disabled="isLoading">
                            <SelectTrigger>
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
                        <Label for="type">Type</Label>
                        <Select v-model="ticketType" :disabled="isLoading">
                            <SelectTrigger>
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
                    <Label for="description">Description</Label>
                    <Textarea
                        id="description"
                        v-model="description"
                        placeholder="Describe the issue..."
                        rows="3"
                        :disabled="isLoading"
                    />
                </div>

                <div class="space-y-2">
                    <Label for="remediation">Remediation Notes (Optional)</Label>
                    <Textarea
                        id="remediation"
                        v-model="remediationNotes"
                        placeholder="Steps to remediate this vulnerability..."
                        rows="2"
                        :disabled="isLoading"
                    />
                </div>

                <!-- Error Message -->
                <div
                    v-if="error"
                    class="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2"
                >
                    <Icon icon="solar:danger-triangle-bold" class="w-4 h-4 text-red-600" />
                    <span class="text-sm text-red-700">{{ error }}</span>
                </div>
            </form>

            <DialogFooter>
                <Button variant="outline" :disabled="isLoading" @click="handleClose">
                    Cancel
                </Button>
                <Button
                    :disabled="isLoading || !title.trim()"
                    @click="handleSubmit"
                >
                    <Icon
                        v-if="isLoading"
                        icon="solar:refresh-bold"
                        class="w-4 h-4 mr-2 animate-spin"
                    />
                    <Icon
                        v-else
                        icon="solar:add-circle-bold"
                        class="w-4 h-4 mr-2"
                    />
                    {{ isLoading ? 'Creating...' : 'Create Ticket' }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

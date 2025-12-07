<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { Icon } from '@iconify/vue';
import { Button } from '@/shadcn/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/shadcn/ui/dropdown-menu';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { TicketsRepository } from '../tickets.repository';
import {
    type TicketDetails,
    TicketStatusLabels,
    TicketStatusColors,
    TicketPriorityLabels,
    TicketPriorityColors,
    TicketTypeLabels,
    TicketTypeColors,
    TicketStatus,
    ExternalTicketProvider,
    ExternalProviderLabels,
    ExternalProviderIcons,
    type IntegrationConfigSummary
} from '../tickets.entity';

const props = defineProps<{
    ticket: TicketDetails;
    isLoading: boolean;
}>();

const emit = defineEmits<{
    close: [];
    updated: [];
}>();

const { defaultOrg } = storeToRefs(useUserStore());
const auth = useAuthStore();
const ticketsRepository = new TicketsRepository();

const isOpen = ref(true);
const isSyncing = ref(false);
const isUnlinking = ref<string | null>(null);
const availableIntegrations = ref<IntegrationConfigSummary[]>([]);

async function loadIntegrations() {
    if (!defaultOrg.value?.id || !auth.getToken) return;

    try {
        const response = await ticketsRepository.getIntegrations({
            orgId: defaultOrg.value.id,
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });
        availableIntegrations.value = response.data.filter((i) => i.enabled);
    } catch {
        console.error('Failed to load integrations');
    }
}

async function syncToProvider(provider: ExternalTicketProvider) {
    if (!defaultOrg.value?.id || !auth.getToken) return;

    isSyncing.value = true;
    try {
        await ticketsRepository.syncTicket({
            orgId: defaultOrg.value.id,
            ticketId: props.ticket.id,
            provider,
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });
        emit('updated');
    } catch (error) {
        console.error('Failed to sync ticket:', error);
    } finally {
        isSyncing.value = false;
    }
}

async function unlinkFromProvider(linkId: string) {
    if (!defaultOrg.value?.id || !auth.getToken) return;

    isUnlinking.value = linkId;
    try {
        await ticketsRepository.unlinkTicket({
            orgId: defaultOrg.value.id,
            ticketId: props.ticket.id,
            linkId,
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });
        emit('updated');
    } catch (error) {
        console.error('Failed to unlink ticket:', error);
    } finally {
        isUnlinking.value = null;
    }
}

function close() {
    isOpen.value = false;
    setTimeout(() => emit('close'), 300);
}

function formatDate(date: Date | undefined): string {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

const severityColor = computed(() => {
    const score = props.ticket.severity_score;
    if (!score) return 'text-gray-500';
    if (score >= 9) return 'text-red-600';
    if (score >= 7) return 'text-orange-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-green-600';
});

// Get providers that aren't already linked
const availableSyncProviders = computed(() => {
    const linkedProviders = new Set(props.ticket.external_links.map((link) => link.provider));
    return availableIntegrations.value.filter(
        (integration) => !linkedProviders.has(integration.provider as ExternalTicketProvider)
    );
});

onMounted(() => {
    loadIntegrations();
});
</script>

<template>
    <Teleport to="body">
        <!-- Backdrop -->
        <div
            class="fixed inset-0 bg-black/50 z-40 transition-opacity"
            :class="isOpen ? 'opacity-100' : 'opacity-0'"
            @click="close"
        />

        <!-- Slide-over Panel -->
        <div
            class="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-xl transition-transform duration-300"
            :class="isOpen ? 'translate-x-0' : 'translate-x-full'"
        >
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div class="flex items-center gap-3">
                    <div
                        class="w-10 h-10 rounded-lg flex items-center justify-center"
                        :class="TicketTypeColors[ticket.type]"
                    >
                        <Icon
                            v-if="ticket.type === 'VULNERABILITY'"
                            icon="solar:shield-warning-bold"
                            class="w-5 h-5"
                        />
                        <Icon
                            v-else-if="ticket.type === 'LICENSE'"
                            icon="solar:document-bold"
                            class="w-5 h-5"
                        />
                        <Icon v-else icon="solar:upload-bold" class="w-5 h-5" />
                    </div>
                    <div>
                        <span class="text-xs text-gray-500 uppercase tracking-wide">
                            {{ TicketTypeLabels[ticket.type] }}
                        </span>
                        <h2 class="text-lg font-semibold text-gray-900">Ticket Details</h2>
                    </div>
                </div>
                <button
                    class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    @click="close"
                >
                    <Icon icon="solar:close-circle-linear" class="w-6 h-6" />
                </button>
            </div>

            <!-- Content -->
            <div class="overflow-y-auto h-[calc(100vh-140px)] px-6 py-6 space-y-6">
                <!-- Title & Status -->
                <div>
                    <h3 class="text-xl font-semibold text-gray-900 mb-3">
                        {{ ticket.title }}
                    </h3>
                    <div class="flex items-center gap-2 flex-wrap">
                        <span
                            class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                            :class="TicketStatusColors[ticket.status]"
                        >
                            {{ TicketStatusLabels[ticket.status] }}
                        </span>
                        <span
                            class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                            :class="TicketPriorityColors[ticket.priority]"
                        >
                            {{ TicketPriorityLabels[ticket.priority] }}
                        </span>
                    </div>
                </div>

                <!-- Vulnerability Info -->
                <div v-if="ticket.vulnerability_id" class="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h4 class="text-sm font-medium text-gray-700">Vulnerability Information</h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-xs text-gray-500">CVE ID</p>
                            <p class="font-mono text-sm font-medium text-gray-900">
                                {{ ticket.vulnerability_id }}
                            </p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500">Severity Score</p>
                            <p class="text-sm font-semibold" :class="severityColor">
                                {{ ticket.severity_score?.toFixed(1) || 'N/A' }}
                                <span
                                    v-if="ticket.severity_class"
                                    class="text-xs font-normal text-gray-500"
                                >
                                    ({{ ticket.severity_class }})
                                </span>
                            </p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500">Affected Package</p>
                            <p class="text-sm text-gray-900">
                                {{ ticket.affected_package || 'N/A' }}
                            </p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500">Affected Version</p>
                            <p class="text-sm text-gray-900">
                                {{ ticket.affected_version || 'N/A' }}
                            </p>
                        </div>
                        <div v-if="ticket.recommended_version" class="col-span-2">
                            <p class="text-xs text-gray-500">Recommended Version</p>
                            <p class="text-sm text-green-600 font-medium">
                                {{ ticket.recommended_version }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Description -->
                <div>
                    <h4 class="text-sm font-medium text-gray-700 mb-2">Description</h4>
                    <p class="text-sm text-gray-600 whitespace-pre-wrap">
                        {{ ticket.description }}
                    </p>
                </div>

                <!-- Remediation Notes -->
                <div v-if="ticket.remediation_notes">
                    <h4 class="text-sm font-medium text-gray-700 mb-2">Remediation Notes</h4>
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p class="text-sm text-blue-800 whitespace-pre-wrap">
                            {{ ticket.remediation_notes }}
                        </p>
                    </div>
                </div>

                <!-- Metadata -->
                <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                        <p class="text-xs text-gray-500">Project</p>
                        <p class="text-sm text-gray-900">{{ ticket.project_name }}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Created By</p>
                        <p class="text-sm text-gray-900">{{ ticket.created_by_name }}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Assigned To</p>
                        <p class="text-sm text-gray-900">
                            {{ ticket.assigned_to_name || 'Unassigned' }}
                        </p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Due Date</p>
                        <p class="text-sm text-gray-900">{{ formatDate(ticket.due_date) }}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Created On</p>
                        <p class="text-sm text-gray-900">{{ formatDate(ticket.created_on) }}</p>
                    </div>
                    <div v-if="ticket.resolved_on">
                        <p class="text-xs text-gray-500">Resolved On</p>
                        <p class="text-sm text-green-600">{{ formatDate(ticket.resolved_on) }}</p>
                    </div>
                </div>

                <!-- Occurrence Stats -->
                <div class="flex items-center gap-4 pt-4 border-t border-gray-200">
                    <div class="flex items-center gap-2">
                        <Icon icon="solar:document-bold" class="w-4 h-4 text-gray-400" />
                        <span class="text-sm text-gray-600">
                            <strong>{{ ticket.occurrence_count }}</strong> total occurrences
                        </span>
                    </div>
                    <div class="flex items-center gap-2">
                        <Icon icon="solar:danger-triangle-bold" class="w-4 h-4 text-orange-400" />
                        <span class="text-sm text-gray-600">
                            <strong>{{ ticket.active_occurrence_count }}</strong> active
                        </span>
                    </div>
                </div>

                <!-- External Links -->
                <div v-if="ticket.external_links.length > 0" class="pt-4 border-t border-gray-200">
                    <h4 class="text-sm font-medium text-gray-700 mb-3">External Links</h4>
                    <div class="space-y-2">
                        <div
                            v-for="link in ticket.external_links"
                            :key="link.id"
                            class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
                        >
                            <a
                                :href="link.external_url"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                            >
                                <div
                                    class="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200"
                                >
                                    <Icon
                                        :icon="
                                            ExternalProviderIcons[
                                                link.provider as ExternalTicketProvider
                                            ] || 'solar:link-bold'
                                        "
                                        class="w-4 h-4"
                                        :class="{
                                            'text-purple-600': link.provider === 'CLICKUP',
                                            'text-blue-600': link.provider === 'JIRA',
                                            'text-indigo-600': link.provider === 'LINEAR',
                                            'text-gray-400': ![
                                                'CLICKUP',
                                                'JIRA',
                                                'LINEAR'
                                            ].includes(link.provider)
                                        }"
                                    />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-medium text-gray-900">
                                        {{
                                            ExternalProviderLabels[
                                                link.provider as ExternalTicketProvider
                                            ] || link.provider
                                        }}
                                    </p>
                                    <p class="text-xs text-gray-500 truncate">
                                        {{ link.external_id }}
                                    </p>
                                </div>
                                <Icon
                                    icon="solar:arrow-right-up-linear"
                                    class="w-4 h-4 text-gray-400"
                                />
                            </a>
                            <button
                                class="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                title="Unlink from external"
                                :disabled="isUnlinking === link.id"
                                @click.stop="unlinkFromProvider(link.id)"
                            >
                                <Icon
                                    v-if="isUnlinking === link.id"
                                    icon="solar:spinner-outline"
                                    class="w-4 h-4 animate-spin"
                                />
                                <Icon v-else icon="solar:link-broken-linear" class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer Actions -->
            <div
                class="absolute bottom-0 left-0 right-0 px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between gap-3"
            >
                <Button variant="outline" @click="close">Close</Button>
                <div class="flex items-center gap-2">
                    <!-- Sync Button -->
                    <DropdownMenu v-if="availableSyncProviders.length > 0">
                        <DropdownMenuTrigger as-child>
                            <Button variant="outline" :disabled="isSyncing">
                                <Icon
                                    v-if="isSyncing"
                                    icon="solar:spinner-outline"
                                    class="w-4 h-4 mr-2 animate-spin"
                                />
                                <Icon v-else icon="solar:link-linear" class="w-4 h-4 mr-2" />
                                Sync
                                <Icon icon="solar:alt-arrow-down-linear" class="w-3 h-3 ml-1" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                v-for="integration in availableSyncProviders"
                                :key="integration.provider"
                                @click="
                                    syncToProvider(integration.provider as ExternalTicketProvider)
                                "
                            >
                                <Icon
                                    :icon="
                                        ExternalProviderIcons[
                                            integration.provider as ExternalTicketProvider
                                        ]
                                    "
                                    class="w-4 h-4 mr-2"
                                />
                                Sync to
                                {{
                                    ExternalProviderLabels[
                                        integration.provider as ExternalTicketProvider
                                    ]
                                }}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        v-if="ticket.status === TicketStatus.OPEN"
                        variant="outline"
                        class="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                    >
                        <Icon icon="solar:play-bold" class="w-4 h-4 mr-2" />
                        Start Progress
                    </Button>
                    <Button
                        v-if="ticket.status === TicketStatus.IN_PROGRESS"
                        class="bg-green-600 hover:bg-green-700"
                    >
                        <Icon icon="solar:check-circle-bold" class="w-4 h-4 mr-2" />
                        Mark Resolved
                    </Button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

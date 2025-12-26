<script setup lang="ts">
import { Button } from '@/shadcn/ui/button';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { Icon } from '@iconify/vue';
import { storeToRefs } from 'pinia';
import { ref, onMounted } from 'vue';
import {
    ExternalTicketProvider,
    ExternalProviderLabels,
    ExternalProviderIcons,
    type IntegrationConfigSummary,
    type ConnectionTestResult
} from '../tickets.entity';
import { TicketsRepository } from '../tickets.repository';
import ClickUpConfigModal from './ClickUpConfigModal.vue';

const { defaultOrg } = storeToRefs(useUserStore());
const auth = useAuthStore();

const ticketsRepository = new TicketsRepository();

const integrations = ref<IntegrationConfigSummary[]>([]);
const isLoading = ref(false);
const testingProvider = ref<ExternalTicketProvider | null>(null);
const testResults = ref<Map<ExternalTicketProvider, ConnectionTestResult>>(new Map());
const showClickUpModal = ref(false);
const deletingProvider = ref<ExternalTicketProvider | null>(null);

// Available providers that can be configured
const availableProviders = [
    {
        provider: ExternalTicketProvider.CLICKUP,
        name: ExternalProviderLabels[ExternalTicketProvider.CLICKUP],
        icon: ExternalProviderIcons[ExternalTicketProvider.CLICKUP],
        description: 'Sync tickets to ClickUp tasks',
        available: true
    },
    {
        provider: ExternalTicketProvider.JIRA,
        name: ExternalProviderLabels[ExternalTicketProvider.JIRA],
        icon: ExternalProviderIcons[ExternalTicketProvider.JIRA],
        description: 'Sync tickets to Jira issues',
        available: false
    },
    {
        provider: ExternalTicketProvider.LINEAR,
        name: ExternalProviderLabels[ExternalTicketProvider.LINEAR],
        icon: ExternalProviderIcons[ExternalTicketProvider.LINEAR],
        description: 'Sync tickets to Linear issues',
        available: false
    }
];

async function loadIntegrations(): Promise<void> {
    const orgId = defaultOrg?.value?.id;
    if (!orgId || !auth.getToken) return;

    isLoading.value = true;
    try {
        const response = await ticketsRepository.getIntegrations({
            orgId,
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });
        integrations.value = response.data;
    } catch (error) {
        console.error('Failed to load integrations:', error);
    } finally {
        isLoading.value = false;
    }
}

async function testConnection(provider: ExternalTicketProvider): Promise<void> {
    const orgId = defaultOrg?.value?.id;
    if (!orgId || !auth.getToken) return;

    testingProvider.value = provider;
    try {
        const response = await ticketsRepository.testIntegration({
            orgId,
            provider,
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });
        testResults.value.set(provider, response.data);
    } catch {
        testResults.value.set(provider, {
            success: false,
            error: 'Failed to test connection'
        });
    } finally {
        testingProvider.value = null;
    }
}

async function deleteIntegration(provider: ExternalTicketProvider): Promise<void> {
    const orgId = defaultOrg?.value?.id;
    if (!orgId || !auth.getToken) return;

    deletingProvider.value = provider;
    try {
        await ticketsRepository.deleteIntegration({
            orgId,
            provider,
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });
        testResults.value.delete(provider);
        await loadIntegrations();
    } catch (error) {
        console.error('Failed to delete integration:', error);
    } finally {
        deletingProvider.value = null;
    }
}

function openConfigModal(provider: ExternalTicketProvider): void {
    if (provider === ExternalTicketProvider.CLICKUP) {
        showClickUpModal.value = true;
    }
}

function getIntegration(provider: ExternalTicketProvider): IntegrationConfigSummary | undefined {
    return integrations.value.find((i) => i.provider === provider);
}

function getTestResult(provider: ExternalTicketProvider): ConnectionTestResult | undefined {
    return testResults.value.get(provider);
}

function handleClickUpConfigured(): void {
    showClickUpModal.value = false;
    void loadIntegrations();
}

onMounted(() => {
    void loadIntegrations();
});
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h3 class="text-lg font-semibold text-gray-900">External Integrations</h3>
                <p class="text-sm text-gray-500 mt-1">
                    Connect your ticket management tools to sync tickets automatically
                </p>
            </div>
            <Button variant="outline" size="sm" :disabled="isLoading" @click="loadIntegrations">
                <Icon
                    icon="solar:refresh-linear"
                    class="w-4 h-4 mr-2"
                    :class="{ 'animate-spin': isLoading }"
                />
                Refresh
            </Button>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading && integrations.length === 0" class="py-8 text-center">
            <Icon icon="solar:spinner-outline" class="w-8 h-8 animate-spin text-gray-400 mx-auto" />
            <p class="text-sm text-gray-500 mt-2">Loading integrations...</p>
        </div>

        <!-- Integrations Grid -->
        <div v-else class="grid gap-4">
            <div
                v-for="providerInfo in availableProviders"
                :key="providerInfo.provider"
                class="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
                <div class="flex items-start justify-between">
                    <div class="flex items-center gap-4">
                        <!-- Provider Icon -->
                        <div
                            class="w-12 h-12 rounded-lg flex items-center justify-center"
                            :class="{
                                'bg-purple-100':
                                    providerInfo.provider === ExternalTicketProvider.CLICKUP,
                                'bg-blue-100':
                                    providerInfo.provider === ExternalTicketProvider.JIRA,
                                'bg-indigo-100':
                                    providerInfo.provider === ExternalTicketProvider.LINEAR
                            }"
                        >
                            <Icon
                                :icon="providerInfo.icon"
                                class="w-6 h-6"
                                :class="{
                                    'text-purple-600':
                                        providerInfo.provider === ExternalTicketProvider.CLICKUP,
                                    'text-blue-600':
                                        providerInfo.provider === ExternalTicketProvider.JIRA,
                                    'text-indigo-600':
                                        providerInfo.provider === ExternalTicketProvider.LINEAR
                                }"
                            />
                        </div>

                        <!-- Provider Info -->
                        <div>
                            <div class="flex items-center gap-2">
                                <h4 class="font-medium text-gray-900">{{ providerInfo.name }}</h4>
                                <span
                                    v-if="!providerInfo.available"
                                    class="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full"
                                >
                                    Coming Soon
                                </span>
                                <span
                                    v-else-if="getIntegration(providerInfo.provider)?.enabled"
                                    class="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full"
                                >
                                    Connected
                                </span>
                            </div>
                            <p class="text-sm text-gray-500 mt-0.5">
                                {{ providerInfo.description }}
                            </p>

                            <!-- Configuration Details -->
                            <div
                                v-if="getIntegration(providerInfo.provider)"
                                class="mt-2 text-xs text-gray-500"
                            >
                                <p v-if="getIntegration(providerInfo.provider)?.workspace_name">
                                    Workspace:
                                    {{ getIntegration(providerInfo.provider)?.workspace_name }}
                                </p>
                                <p v-if="getIntegration(providerInfo.provider)?.list_name">
                                    List: {{ getIntegration(providerInfo.provider)?.list_name }}
                                </p>
                            </div>

                            <!-- Test Result -->
                            <div
                                v-if="getTestResult(providerInfo.provider)"
                                class="mt-2 text-sm"
                                :class="{
                                    'text-green-600': getTestResult(providerInfo.provider)?.success,
                                    'text-red-600': !getTestResult(providerInfo.provider)?.success
                                }"
                            >
                                <div class="flex items-center gap-1">
                                    <Icon
                                        v-if="getTestResult(providerInfo.provider)?.success"
                                        icon="solar:check-circle-bold"
                                        class="w-4 h-4"
                                    />
                                    <Icon v-else icon="solar:close-circle-bold" class="w-4 h-4" />
                                    <span v-if="getTestResult(providerInfo.provider)?.success">
                                        Connected as
                                        {{
                                            getTestResult(providerInfo.provider)?.user_info?.name ||
                                            'Unknown'
                                        }}
                                    </span>
                                    <span v-else>
                                        {{ getTestResult(providerInfo.provider)?.error }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-2">
                        <template v-if="getIntegration(providerInfo.provider)">
                            <!-- Test Connection -->
                            <Button
                                variant="outline"
                                size="sm"
                                :disabled="testingProvider === providerInfo.provider"
                                @click="testConnection(providerInfo.provider)"
                            >
                                <Icon
                                    v-if="testingProvider === providerInfo.provider"
                                    icon="solar:spinner-outline"
                                    class="w-4 h-4 mr-1 animate-spin"
                                />
                                <Icon v-else icon="solar:plug-circle-linear" class="w-4 h-4 mr-1" />
                                Test
                            </Button>

                            <!-- Configure / Reconfigure -->
                            <Button
                                variant="outline"
                                size="sm"
                                @click="openConfigModal(providerInfo.provider)"
                            >
                                <Icon icon="solar:settings-linear" class="w-4 h-4 mr-1" />
                                Configure
                            </Button>

                            <!-- Disconnect -->
                            <Button
                                variant="outline"
                                size="sm"
                                class="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                :disabled="deletingProvider === providerInfo.provider"
                                @click="deleteIntegration(providerInfo.provider)"
                            >
                                <Icon
                                    v-if="deletingProvider === providerInfo.provider"
                                    icon="solar:spinner-outline"
                                    class="w-4 h-4 mr-1 animate-spin"
                                />
                                <Icon
                                    v-else
                                    icon="solar:trash-bin-trash-linear"
                                    class="w-4 h-4 mr-1"
                                />
                                Disconnect
                            </Button>
                        </template>
                        <template v-else>
                            <!-- Connect Button -->
                            <Button
                                v-if="providerInfo.available"
                                @click="openConfigModal(providerInfo.provider)"
                            >
                                <Icon icon="solar:link-linear" class="w-4 h-4 mr-2" />
                                Connect
                            </Button>
                            <Button v-else variant="outline" disabled>
                                <Icon icon="solar:lock-linear" class="w-4 h-4 mr-2" />
                                Coming Soon
                            </Button>
                        </template>
                    </div>
                </div>
            </div>
        </div>

        <!-- ClickUp Config Modal -->
        <ClickUpConfigModal
            v-if="showClickUpModal"
            :existing-config="getIntegration(ExternalTicketProvider.CLICKUP)"
            @close="showClickUpModal = false"
            @configured="handleClickUpConfigured"
        />
    </div>
</template>

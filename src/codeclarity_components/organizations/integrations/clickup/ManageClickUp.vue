<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import router from '@/router';
import { useAuthStore } from '@/stores/auth';
import InfoCard from '@/base_components/ui/cards/InfoCard.vue';
import StatCard from '@/base_components/ui/cards/StatCard.vue';
import Button from '@/shadcn/ui/button/Button.vue';
import BoxLoader from '@/base_components/ui/loaders/BoxLoader.vue';
import ClickUpConfigModal from '@/codeclarity_components/tickets/integrations/ClickUpConfigModal.vue';
import { TicketsRepository } from '@/codeclarity_components/tickets/tickets.repository';
import {
    ExternalTicketProvider,
    type IntegrationConfigSummary
} from '@/codeclarity_components/tickets/tickets.entity';
import { successToast, errorToast } from '@/utils/toasts';

const props = defineProps<{
    orgId: string;
}>();

const authStore = useAuthStore();
const ticketsRepository = new TicketsRepository();

// State
const loading = ref(true);
const error = ref(false);
const clickUpConfig = ref<IntegrationConfigSummary | null>(null);
const showConfigModal = ref(false);
const isDeleting = ref(false);
const isTesting = ref(false);
const testResult = ref<{ success: boolean; message: string } | null>(null);

async function fetchClickUpConfig() {
    if (!authStore.getToken) return;

    loading.value = true;
    error.value = false;

    try {
        const response = await ticketsRepository.getIntegrations({
            orgId: props.orgId,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });

        // Find ClickUp integration
        const clickUp = response.data.find(
            (i) => i.provider === ExternalTicketProvider.CLICKUP && i.has_config
        );
        clickUpConfig.value = clickUp || null;
    } catch {
        error.value = true;
    } finally {
        loading.value = false;
    }
}

async function testConnection() {
    if (!authStore.getToken) return;

    isTesting.value = true;
    testResult.value = null;

    try {
        const response = await ticketsRepository.testIntegration({
            orgId: props.orgId,
            provider: ExternalTicketProvider.CLICKUP,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });

        if (response.data.success) {
            testResult.value = {
                success: true,
                message: `Connected as ${response.data.user_info?.name || 'Unknown'}`
            };
        } else {
            testResult.value = {
                success: false,
                message: response.data.error || 'Connection test failed'
            };
        }
    } catch {
        testResult.value = {
            success: false,
            message: 'Connection test failed'
        };
    } finally {
        isTesting.value = false;
    }
}

async function deleteIntegration() {
    if (!authStore.getToken) return;

    if (!confirm('Are you sure you want to delete the ClickUp integration?')) {
        return;
    }

    isDeleting.value = true;

    try {
        await ticketsRepository.deleteIntegration({
            orgId: props.orgId,
            provider: ExternalTicketProvider.CLICKUP,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });

        successToast('ClickUp integration deleted successfully');
        router.push({
            name: 'orgs',
            params: { orgId: props.orgId, page: 'integrations', action: 'manage' }
        });
    } catch {
        errorToast('Failed to delete ClickUp integration');
    } finally {
        isDeleting.value = false;
    }
}

function onConfigured() {
    showConfigModal.value = false;
    fetchClickUpConfig();
    successToast('ClickUp integration updated successfully');
}

function onClose() {
    showConfigModal.value = false;
}

onMounted(() => {
    fetchClickUpConfig();
});
</script>

<template>
    <div class="min-h-screen bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Page Header -->
            <InfoCard
                title="ClickUp Integration"
                description="Manage your ClickUp workspace connection and sync settings"
                icon="simple-icons:clickup"
                variant="primary"
                class="mb-8 shadow-lg"
            />

            <!-- Loading State -->
            <div v-if="loading" class="grid lg:grid-cols-2 gap-8">
                <BoxLoader :dimensions="{ width: '100%', height: '400px' }" />
                <BoxLoader :dimensions="{ width: '100%', height: '400px' }" />
            </div>

            <!-- Error State -->
            <div
                v-else-if="error"
                class="flex flex-row gap-4 items-center p-8 bg-red-50 border border-red-200 rounded-xl"
            >
                <Icon
                    class="text-red-500"
                    icon="solar:confounded-square-outline"
                    style="font-size: 3rem"
                />
                <div class="flex-1">
                    <div class="text-lg font-semibold text-red-700 mb-2">
                        Failed to load ClickUp integration
                    </div>
                    <div class="text-red-600 mb-4">
                        We encountered an error while fetching the integration configuration.
                    </div>
                    <div class="flex flex-row gap-3">
                        <Button variant="destructive" @click="fetchClickUpConfig">Try again</Button>
                        <Button variant="outline" @click="router.back()">Go back</Button>
                    </div>
                </div>
            </div>

            <!-- No Config State -->
            <div
                v-else-if="!clickUpConfig"
                class="flex flex-col items-center justify-center p-12 bg-white border border-gray-200 rounded-xl"
            >
                <Icon icon="simple-icons:clickup" class="w-16 h-16 text-gray-300 mb-4" />
                <h3 class="text-lg font-semibold text-gray-900 mb-2">No ClickUp Integration</h3>
                <p class="text-gray-600 mb-6 text-center max-w-md">
                    You haven't configured a ClickUp integration yet. Click below to set it up.
                </p>
                <Button class="bg-purple-600 hover:bg-purple-700" @click="showConfigModal = true">
                    <Icon icon="simple-icons:clickup" class="mr-2" />
                    Configure ClickUp
                </Button>
            </div>

            <!-- Config Display -->
            <div v-else class="grid lg:grid-cols-2 gap-8">
                <!-- Left Column - Status & Actions -->
                <div class="space-y-6">
                    <InfoCard
                        title="Integration Status"
                        description="Current ClickUp connection status"
                        icon="solar:settings-bold"
                        variant="default"
                        class="shadow-md"
                    >
                        <!-- Status Badge -->
                        <div class="mb-6">
                            <div
                                class="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full"
                            >
                                <Icon icon="solar:check-circle-bold" class="text-sm" />
                                <span class="font-medium">Connected</span>
                            </div>
                        </div>

                        <!-- Test Result -->
                        <div
                            v-if="testResult"
                            class="p-3 rounded-lg text-sm mb-6"
                            :class="{
                                'bg-green-50 text-green-700': testResult.success,
                                'bg-red-50 text-red-700': !testResult.success
                            }"
                        >
                            <div class="flex items-center gap-2">
                                <Icon
                                    v-if="testResult.success"
                                    icon="solar:check-circle-bold"
                                    class="w-4 h-4"
                                />
                                <Icon v-else icon="solar:close-circle-bold" class="w-4 h-4" />
                                {{ testResult.message }}
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="space-y-3">
                            <Button
                                class="w-full bg-purple-600 hover:bg-purple-700"
                                @click="showConfigModal = true"
                            >
                                <Icon icon="solar:settings-bold" class="mr-2" />
                                Reconfigure Integration
                            </Button>

                            <Button
                                variant="outline"
                                class="w-full"
                                :disabled="isTesting"
                                @click="testConnection"
                            >
                                <Icon
                                    v-if="isTesting"
                                    icon="solar:spinner-outline"
                                    class="mr-2 animate-spin"
                                />
                                <Icon v-else icon="solar:check-circle-bold" class="mr-2" />
                                Test Connection
                            </Button>

                            <Button
                                variant="outline"
                                class="w-full border-red-300 text-red-600 hover:bg-red-50"
                                :disabled="isDeleting"
                                @click="deleteIntegration"
                            >
                                <Icon
                                    v-if="isDeleting"
                                    icon="solar:spinner-outline"
                                    class="mr-2 animate-spin"
                                />
                                <Icon v-else icon="solar:trash-bin-trash-bold" class="mr-2" />
                                Delete Integration
                            </Button>
                        </div>
                    </InfoCard>
                </div>

                <!-- Right Column - Stats & Info -->
                <div class="space-y-6">
                    <InfoCard
                        title="Sync Options"
                        description="Current sync settings"
                        icon="solar:refresh-circle-bold"
                        variant="primary"
                        class="shadow-md"
                    >
                        <div class="grid grid-cols-2 gap-4">
                            <StatCard
                                label="Auto-sync"
                                :value="clickUpConfig?.auto_sync_on_create ? 'Enabled' : 'Disabled'"
                                :icon="
                                    clickUpConfig?.auto_sync_on_create
                                        ? 'solar:check-circle-bold'
                                        : 'solar:close-circle-bold'
                                "
                                :variant="
                                    clickUpConfig?.auto_sync_on_create ? 'success' : 'default'
                                "
                                subtitle="New tickets"
                            />

                            <StatCard
                                label="Status Sync"
                                :value="clickUpConfig?.sync_status_changes ? 'Enabled' : 'Disabled'"
                                :icon="
                                    clickUpConfig?.sync_status_changes
                                        ? 'solar:check-circle-bold'
                                        : 'solar:close-circle-bold'
                                "
                                :variant="
                                    clickUpConfig?.sync_status_changes ? 'success' : 'default'
                                "
                                subtitle="Changes sync"
                            />
                        </div>
                    </InfoCard>

                    <InfoCard
                        title="What's Next?"
                        description="Use the ClickUp integration"
                        icon="solar:arrow-right-bold"
                        variant="default"
                        class="shadow-md"
                    >
                        <div class="space-y-4">
                            <div class="flex items-start gap-3">
                                <div
                                    class="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center"
                                >
                                    <Icon
                                        icon="solar:ticket-bold"
                                        class="text-purple-600 text-sm"
                                    />
                                </div>
                                <div>
                                    <h4 class="font-semibold text-gray-900">Go to Tickets</h4>
                                    <p class="text-sm text-gray-600">
                                        View your tickets and sync them to ClickUp
                                    </p>
                                </div>
                            </div>

                            <RouterLink
                                :to="{
                                    name: 'tickets',
                                    params: { orgId: orgId, action: 'manage' }
                                }"
                            >
                                <Button variant="outline" class="w-full">
                                    <Icon icon="solar:ticket-bold" class="mr-2" />
                                    View Tickets
                                </Button>
                            </RouterLink>
                        </div>
                    </InfoCard>
                </div>
            </div>
        </div>

        <!-- ClickUp Config Modal -->
        <ClickUpConfigModal
            v-if="showConfigModal"
            :existing-config="clickUpConfig || undefined"
            @close="onClose"
            @configured="onConfigured"
        />
    </div>
</template>

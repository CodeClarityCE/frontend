<script lang="ts" setup>
import InfoCard from '@/base_components/ui/cards/InfoCard.vue';
import ClickUpConfigModal from '@/codeclarity_components/tickets/integrations/ClickUpConfigModal.vue';
import router from '@/router';
import Button from '@/shadcn/ui/button/Button.vue';
import { Icon } from '@iconify/vue';
import { ref } from 'vue';
import { useRoute } from 'vue-router';

// State
const orgId = ref('');
const showConfigModal = ref(false);

function onConfigured(): void {
    showConfigModal.value = false;
    void router.push({
        name: 'orgs',
        params: { orgId: orgId.value, page: 'integrations', action: 'manage' }
    });
}

function onClose(): void {
    showConfigModal.value = false;
}

async function init(): Promise<void> {
    const route = useRoute();
    const _orgId = route.params['orgId'];

    if (!_orgId) {
        router.back();
        return;
    }

    if (typeof _orgId === 'string') {
        orgId.value = _orgId;
    } else {
        router.back();
    }
}

void init();
</script>

<template>
    <div class="min-h-screen bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Page Header -->
            <InfoCard
                title="ClickUp Integration"
                description="Connect your ClickUp workspace to sync tickets and track vulnerability remediation"
                icon="simple-icons:clickup"
                variant="primary"
                class="mb-8 shadow-lg"
            />

            <div class="grid lg:grid-cols-2 gap-8">
                <!-- Left Column - Configuration -->
                <InfoCard
                    title="Connect ClickUp"
                    description="Link your ClickUp workspace to automatically sync tickets as tasks"
                    icon="solar:settings-bold"
                    variant="default"
                    class="shadow-md"
                >
                    <div class="space-y-6">
                        <div
                            class="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200"
                        >
                            <div
                                class="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"
                            >
                                <Icon icon="simple-icons:clickup" class="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h4 class="font-semibold text-gray-900 mb-1">
                                    Sync Tickets to ClickUp
                                </h4>
                                <p class="text-sm text-gray-600">
                                    Create tasks in ClickUp automatically when new security
                                    vulnerabilities are detected. Keep your team organized and track
                                    remediation progress.
                                </p>
                            </div>
                        </div>

                        <Button
                            class="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                            @click="showConfigModal = true"
                        >
                            <Icon icon="simple-icons:clickup" class="mr-2 text-lg" />
                            Configure ClickUp Integration
                        </Button>

                        <div
                            class="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                            <Icon
                                icon="solar:shield-check-bold"
                                class="text-blue-600 mt-0.5 flex-shrink-0"
                            />
                            <div class="text-xs text-blue-700">
                                <strong>Security Note:</strong> Your ClickUp credentials are
                                encrypted and stored securely. We use OAuth or API keys to access
                                your workspace.
                            </div>
                        </div>
                    </div>
                </InfoCard>

                <!-- Right Column - Features -->
                <div class="space-y-6">
                    <InfoCard
                        title="Features"
                        description="What you can do with the ClickUp integration"
                        icon="solar:magic-stick-bold"
                        variant="primary"
                        class="shadow-md"
                    >
                        <div class="space-y-4">
                            <div class="flex items-start gap-3">
                                <div
                                    class="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"
                                >
                                    <Icon
                                        icon="solar:check-circle-bold"
                                        class="text-green-600 text-sm"
                                    />
                                </div>
                                <div>
                                    <h4 class="font-semibold text-gray-900">Auto-sync Tickets</h4>
                                    <p class="text-sm text-gray-600">
                                        Automatically create ClickUp tasks when new tickets are
                                        generated
                                    </p>
                                </div>
                            </div>

                            <div class="flex items-start gap-3">
                                <div
                                    class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"
                                >
                                    <Icon
                                        icon="solar:refresh-circle-bold"
                                        class="text-blue-600 text-sm"
                                    />
                                </div>
                                <div>
                                    <h4 class="font-semibold text-gray-900">Status Sync</h4>
                                    <p class="text-sm text-gray-600">
                                        Keep ticket status synchronized between CodeClarity and
                                        ClickUp
                                    </p>
                                </div>
                            </div>

                            <div class="flex items-start gap-3">
                                <div
                                    class="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center"
                                >
                                    <Icon
                                        icon="solar:folder-bold"
                                        class="text-purple-600 text-sm"
                                    />
                                </div>
                                <div>
                                    <h4 class="font-semibold text-gray-900">
                                        Flexible Organization
                                    </h4>
                                    <p class="text-sm text-gray-600">
                                        Choose your workspace, space, folder, and list for ticket
                                        creation
                                    </p>
                                </div>
                            </div>

                            <div class="flex items-start gap-3">
                                <div
                                    class="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center"
                                >
                                    <Icon icon="solar:link-bold" class="text-orange-600 text-sm" />
                                </div>
                                <div>
                                    <h4 class="font-semibold text-gray-900">Direct Links</h4>
                                    <p class="text-sm text-gray-600">
                                        Quick access to ClickUp tasks directly from CodeClarity
                                        tickets
                                    </p>
                                </div>
                            </div>
                        </div>
                    </InfoCard>

                    <InfoCard
                        title="Authentication Options"
                        description="Choose how to connect to ClickUp"
                        icon="solar:key-bold"
                        variant="default"
                        class="shadow-md"
                    >
                        <div class="space-y-4">
                            <div
                                class="p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                            >
                                <div class="flex items-center gap-3 mb-2">
                                    <Icon icon="solar:link-bold" class="text-purple-600 text-lg" />
                                    <h4 class="font-semibold text-gray-900">OAuth (Recommended)</h4>
                                </div>
                                <p class="text-sm text-gray-600">
                                    Securely connect using your ClickUp account. No need to manage
                                    API keys manually.
                                </p>
                            </div>

                            <div
                                class="p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                            >
                                <div class="flex items-center gap-3 mb-2">
                                    <Icon icon="solar:key-bold" class="text-gray-600 text-lg" />
                                    <h4 class="font-semibold text-gray-900">API Key</h4>
                                </div>
                                <p class="text-sm text-gray-600">
                                    Use a personal API key from your ClickUp settings for direct
                                    access.
                                </p>
                            </div>
                        </div>
                    </InfoCard>
                </div>
            </div>
        </div>

        <!-- ClickUp Config Modal -->
        <ClickUpConfigModal v-if="showConfigModal" @close="onClose" @configured="onConfigured" />
    </div>
</template>

<script lang="ts" setup>
import { ref, onBeforeMount, computed } from 'vue';
import type { Ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { LicensePolicyRepository } from '../license_policy.repository';
import type { LicensePolicy } from '../license_policy.entity';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
// Organization imports removed since we're in a tab view context
import LicensePolicyDataTable from '../license/LicensePolicyDataTable.vue';
import Button from '@/shadcn/ui/button/Button.vue';
import StatCard from '@/base_components/ui/cards/StatCard.vue';
import { Alert, AlertDescription } from '@/shadcn/ui/alert';
import { Icon } from '@iconify/vue';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/shadcn/ui/dialog';
const props = defineProps<{
    page: string;
    orgId: string;
}>();

// Repository
const licensePolicyRepository = new LicensePolicyRepository();
const router = useRouter();

// Store setup
const authStore = useAuthStore();

// Component state
const policies: Ref<LicensePolicy[]> = ref([]);
const loading: Ref<boolean> = ref(false);
const error: Ref<string> = ref('');

// Dialog states (for future delete functionality)
const deleteDialog: Ref<boolean> = ref(false);
const policyToDelete: Ref<LicensePolicy | null> = ref(null);
const deleting: Ref<boolean> = ref(false);

// For simplicity, assume user has admin rights in tab view
const canManagePolicies = computed(() => true);

// Methods

async function loadPolicies() {
    if (!authStore.getToken) return;

    loading.value = true;
    error.value = '';

    try {
        const response = await licensePolicyRepository.getLicensePolicies({
            orgId: props.orgId,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true,
            page: 0,
            entries_per_page: 100,
            search_key: ''
        });

        policies.value = response.data || [];
    } catch (err) {
        console.error('Error loading license policies:', err);
        if (err instanceof BusinessLogicError) {
            error.value = err.error_message || 'Business logic error occurred';
        } else {
            error.value = 'Failed to load license policies. Please try again.';
        }
    } finally {
        loading.value = false;
    }
}

function navigateToCreate() {
    router.push({
        name: 'orgs',
        params: {
            action: 'add',
            page: 'policy',
            orgId: props.orgId
        }
    });
}

function handleEdit(policy: LicensePolicy) {
    router.push({
        name: 'orgs',
        params: {
            action: 'edit',
            page: 'policy',
            orgId: props.orgId
        },
        query: { policyId: policy.id }
    });
}

function handleDelete(policy: LicensePolicy) {
    policyToDelete.value = policy;
    deleteDialog.value = true;
}

async function confirmDelete() {
    if (!policyToDelete.value || !authStore.getToken) return;

    deleting.value = true;
    try {
        // TODO: Implement delete API call when endpoint is available
        // await licensePolicyRepository.deleteLicensePolicy({
        //     orgId: props.orgId,
        //     policyId: policyToDelete.value.id,
        //     bearerToken: authStore.getToken
        // });
        console.log('Delete policy:', policyToDelete.value);
        await loadPolicies();
    } catch (err) {
        console.error('Error deleting policy:', err);
        if (err instanceof BusinessLogicError) {
            error.value = err.error_message || 'Failed to delete policy';
        } else {
            error.value = 'Failed to delete policy. Please try again.';
        }
    } finally {
        deleting.value = false;
        deleteDialog.value = false;
        policyToDelete.value = null;
    }
}

// Initialize component
onBeforeMount(() => {
    loadPolicies();
});
</script>
<template>
    <!-- Don't show header item here since we're now inside tabs -->
    <div class="space-y-6">
        <!-- Header with Create Button -->
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-gray-900">License Policies</h2>
                <p class="text-gray-600">
                    Manage license compliance policies for your organization
                </p>
            </div>
            <div class="flex items-center gap-4">
                <Button
                    v-if="canManagePolicies"
                    class="bg-theme-black hover:bg-theme-gray text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                    @click="navigateToCreate"
                >
                    <Icon icon="solar:add-circle-bold" class="w-5 h-5" />
                    Create Policy
                </Button>
            </div>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
                label="Total Policies"
                :value="policies.length"
                icon="solar:shield-bold"
                variant="default"
                subtitle="All policies"
            />

            <StatCard
                label="Active Policies"
                :value="policies.length"
                icon="solar:check-circle-bold"
                variant="success"
                subtitle="Currently enforced"
            />

            <StatCard
                label="License Types"
                :value="new Set(policies.flatMap((p: any) => p.content || [])).size"
                icon="solar:document-text-bold"
                variant="primary"
                subtitle="Unique licenses"
            />
        </div>

        <!-- Error Alert -->
        <Alert v-if="error && !loading" variant="destructive">
            <Icon icon="solar:danger-triangle-bold" class="h-4 w-4" />
            <AlertDescription>
                {{ error }}
            </AlertDescription>
        </Alert>

        <!-- Main Content -->
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div v-if="!loading && policies.length === 0 && !error" class="p-12 text-center">
                <Icon icon="solar:shield-check-bold" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 class="text-lg font-medium text-gray-900 mb-2">No License Policies</h3>
                <p class="text-gray-600 mb-6 max-w-sm mx-auto">
                    Get started by creating your first license policy to control which licenses are
                    allowed in your projects.
                </p>
                <Button
                    v-if="canManagePolicies"
                    class="bg-theme-black hover:bg-theme-gray text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                    @click="navigateToCreate"
                >
                    <Icon icon="solar:add-circle-bold" class="w-5 h-5" />
                    Create First Policy
                </Button>
            </div>

            <LicensePolicyDataTable
                v-else
                :data="policies"
                :loading="loading"
                @edit="handleEdit"
                @delete="handleDelete"
            />
        </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="deleteDialog">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Delete License Policy</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete "{{ policyToDelete?.name }}"? This action cannot
                    be undone.
                </DialogDescription>
            </DialogHeader>

            <DialogFooter>
                <Button variant="outline" :disabled="deleting" @click="deleteDialog = false">
                    Cancel
                </Button>
                <Button variant="destructive" :disabled="deleting" @click="confirmDelete">
                    <Icon
                        v-if="deleting"
                        icon="eos-icons:loading"
                        class="w-4 h-4 mr-2 animate-spin"
                    />
                    Delete Policy
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

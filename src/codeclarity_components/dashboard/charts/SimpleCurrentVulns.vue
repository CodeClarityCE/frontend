<template>
    <!-- Simple vulnerability summary -->
    <div v-if="isLoading" class="space-y-4">
        <Skeleton class="h-8 w-3/4" />
        <Skeleton class="h-6 w-1/2" />
        <Skeleton class="h-24 w-full" />
    </div>

    <div v-else-if="hasError" class="text-center py-8">
        <Icon icon="solar:danger-triangle-bold" class="h-12 w-12 text-red-500 mx-auto mb-2" />
        <p class="text-gray-600">Failed to load vulnerability data</p>
    </div>

    <div v-else class="space-y-4">
        <!-- Summary stats -->
        <div class="grid grid-cols-3 gap-4">
            <div class="text-center p-3 bg-red-50 rounded-lg">
                <div class="text-2xl font-bold text-red-600">{{ stats.critical }}</div>
                <div class="text-xs text-red-500">Critical</div>
            </div>
            <div class="text-center p-3 bg-orange-50 rounded-lg">
                <div class="text-2xl font-bold text-orange-600">{{ stats.high }}</div>
                <div class="text-xs text-orange-500">High</div>
            </div>
            <div class="text-center p-3 bg-yellow-50 rounded-lg">
                <div class="text-2xl font-bold text-yellow-600">{{ stats.medium }}</div>
                <div class="text-xs text-yellow-500">Medium</div>
            </div>
        </div>

        <!-- Recent vulnerabilities list -->
        <ScrollArea class="h-32">
            <div class="space-y-2">
                <div
                    v-for="vuln in recentVulns"
                    :key="vuln.id"
                    class="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                >
                    <span class="font-medium">{{ vuln.cve }}</span>
                    <span
                        class="px-2 py-1 rounded text-xs font-medium"
                        :class="getSeverityClass(vuln.severity)"
                    >
                        {{ vuln.severity }}
                    </span>
                </div>
            </div>
        </ScrollArea>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Icon } from '@iconify/vue';
import { Skeleton } from '@/shadcn/ui/skeleton';
import { ScrollArea } from '@/shadcn/ui/scroll-area';
import { DashboardRepository } from '../dashboard.repository';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';

/**
 * SimpleCurrentVulns - Simplified vulnerability display
 *
 * Shows:
 * - Critical/High/Medium counts
 * - Recent vulnerabilities list
 * - Simple loading and error states
 */

interface Props {
    integrationIds: string[];
}

const props = defineProps<Props>();

// Simple state
const isLoading = ref(true);
const hasError = ref(false);
const stats = ref({ critical: 0, high: 0, medium: 0 });
const recentVulns = ref<Array<{ id: string; cve: string; severity: string }>>([]);

// Store access
const { defaultOrg } = storeToRefs(useUserStore());
const auth = useAuthStore();

// Simple severity styling
function getSeverityClass(severity: string): string {
    const classes = {
        CRITICAL: 'bg-red-100 text-red-800',
        HIGH: 'bg-orange-100 text-orange-800',
        MEDIUM: 'bg-yellow-100 text-yellow-800',
        LOW: 'bg-green-100 text-green-800'
    };
    return classes[severity as keyof typeof classes] || classes.LOW;
}

// Simple data fetching
async function loadVulnerabilityData() {
    if (!defaultOrg?.value || !auth.getToken) return;

    isLoading.value = true;
    hasError.value = false;

    try {
        const repository = new DashboardRepository();
        const response = await repository.getRecentVulns({
            orgId: defaultOrg.value.id,
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            integrationIds: props.integrationIds
        });

        // Process response data
        if (response?.data) {
            // Update stats
            const severityCounts = response.data.severity_count || [];
            stats.value = {
                critical: severityCounts.find((s) => s.severity_class === 'CRITICAL')?.count || 0,
                high: severityCounts.find((s) => s.severity_class === 'HIGH')?.count || 0,
                medium: severityCounts.find((s) => s.severity_class === 'MEDIUM')?.count || 0
            };

            // Update recent vulns
            const vulns = response.data.vulns || {};
            recentVulns.value = Object.entries(vulns)
                .map(([id, vuln]: [string, any]) => ({
                    id,
                    cve: vuln.cwe_name || `CVE-${id}`,
                    severity: vuln.severity_class || 'LOW'
                }))
                .sort((a, b) => {
                    const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
                    return (
                        (severityOrder[b.severity as keyof typeof severityOrder] || 0) -
                        (severityOrder[a.severity as keyof typeof severityOrder] || 0)
                    );
                })
                .slice(0, 5); // Show only top 5
        }
    } catch (error) {
        console.error('Failed to load vulnerability data:', error);
        hasError.value = true;
    } finally {
        isLoading.value = false;
    }
}

// Auto-load and watch for changes
onMounted(loadVulnerabilityData);
watch(() => props.integrationIds, loadVulnerabilityData, { deep: true });
</script>

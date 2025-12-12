<script setup lang="ts">
import { useVulnerabilityPolicyActions } from '@/codeclarity_components/organizations/policy/vulnerability/useVulnerabilityPolicyActions';
import Button from '@/shadcn/ui/button/Button.vue';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/shadcn/ui/dropdown-menu';
import { Icon } from '@iconify/vue';
import { ref } from 'vue';

interface Props {
    vulnerabilityId: string;
    size?: 'sm' | 'default' | 'lg';
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

const props = withDefaults(defineProps<Props>(), {
    size: 'sm',
    variant: 'outline'
});

const { isLoading, availablePolicies, loadPolicies, addToPolicy, addToDefaultPolicy } =
    useVulnerabilityPolicyActions();

const dropdownOpen = ref(false);

const handleDropdownOpen = async (open: boolean) => {
    dropdownOpen.value = open;
    if (open) {
        await loadPolicies();
    }
};

const handleAddToDefaultPolicy = async () => {
    await addToDefaultPolicy(props.vulnerabilityId);
    dropdownOpen.value = false;
};

const handleAddToSpecificPolicy = async (policyId: string) => {
    await addToPolicy(policyId, props.vulnerabilityId);
    dropdownOpen.value = false;
};
</script>

<template>
    <DropdownMenu v-model:open="dropdownOpen" @update:open="handleDropdownOpen">
        <DropdownMenuTrigger as-child>
            <Button :size="size" :variant="variant" class="gap-1" :disabled="isLoading">
                <Icon v-if="isLoading" icon="eos-icons:loading" class="w-3 h-3 animate-spin" />
                <Icon v-else icon="solar:shield-plus-linear" class="w-3 h-3" />
                <span class="hidden sm:inline">Add to Policy</span>
                <span class="sm:hidden">Policy</span>
            </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" class="w-56">
            <!-- Quick add to default policy -->
            <DropdownMenuItem class="cursor-pointer" @click="handleAddToDefaultPolicy">
                <Icon icon="solar:shield-check-linear" class="w-4 h-4 mr-2" />
                <span>Add to Default Policy</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator v-if="availablePolicies.length > 0" />

            <!-- List of available policies -->
            <DropdownMenuItem
                v-for="policy in availablePolicies"
                :key="policy.id"
                class="cursor-pointer"
                @click="handleAddToSpecificPolicy(policy.id)"
            >
                <Icon icon="solar:shield-linear" class="w-4 h-4 mr-2" />
                <div class="flex-1 min-w-0">
                    <div class="font-medium truncate">{{ policy.name }}</div>
                    <div v-if="policy.default" class="text-xs text-gray-500">Default</div>
                </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator v-if="availablePolicies.length === 0" />

            <!-- No policies message -->
            <div v-if="availablePolicies.length === 0" class="px-2 py-2 text-sm text-gray-500">
                No policies available
            </div>
        </DropdownMenuContent>
    </DropdownMenu>
</template>

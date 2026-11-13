<script setup lang="ts">
import { LoaderCircle, Shield, ShieldCheck, ShieldPlus } from "@lucide/vue";
import { ref } from "vue";

import { useVulnerabilityPolicyActions } from "@/codeclarity_components/organizations/policy/vulnerability/useVulnerabilityPolicyActions";
import Button from "@/shadcn/ui/button/Button.vue";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";

interface Props {
  vulnerabilityId: string;
  size?: "sm" | "default" | "lg";
  variant?:
    "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

const props = withDefaults(defineProps<Props>(), {
  size: "sm",
  variant: "outline",
});

const {
  isLoading,
  availablePolicies,
  loadPolicies,
  addToPolicy,
  addToDefaultPolicy,
} = useVulnerabilityPolicyActions();

const dropdownOpen = ref(false);

const handleDropdownOpen = async (open: boolean): Promise<void> => {
  dropdownOpen.value = open;
  if (open) {
    await loadPolicies();
  }
};

const handleAddToDefaultPolicy = async (): Promise<void> => {
  await addToDefaultPolicy(props.vulnerabilityId);
  dropdownOpen.value = false;
};

const handleAddToSpecificPolicy = async (policyId: string): Promise<void> => {
  await addToPolicy(policyId, props.vulnerabilityId);
  dropdownOpen.value = false;
};
</script>

<template>
  <DropdownMenu v-model:open="dropdownOpen" @update:open="handleDropdownOpen">
    <DropdownMenuTrigger as-child>
      <Button
        :size="size"
        :variant="variant"
        class="gap-1"
        :disabled="isLoading"
      >
        <LoaderCircle
          v-if="isLoading"
          aria-hidden="true"
          class="size-3.5 animate-spin motion-reduce:animate-none"
        />
        <ShieldPlus v-else aria-hidden="true" class="size-3.5" />
        Add to Policy
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end" class="w-56">
      <!-- Quick add to default policy -->
      <DropdownMenuItem
        class="cursor-pointer"
        @click="handleAddToDefaultPolicy"
      >
        <ShieldCheck aria-hidden="true" class="mr-2 size-4" />
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
        <Shield aria-hidden="true" class="mr-2 size-4" />
        <div class="flex-1 min-w-0">
          <div class="font-medium truncate">{{ policy.name }}</div>
          <div v-if="policy.default" class="text-xs text-muted-foreground">
            Default
          </div>
        </div>
      </DropdownMenuItem>

      <DropdownMenuSeparator v-if="availablePolicies.length === 0" />

      <!-- No policies message -->
      <div
        v-if="availablePolicies.length === 0"
        class="px-2 py-2 text-sm text-muted-foreground"
      >
        No policies available
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<template>
  <!-- Dashboard sidebar with activity, actions, and navigation -->
  <div class="grid gap-8 lg:grid-cols-3">
    <!-- Recent Activity -->
    <InfoCard
      title="Recent Activity"
      icon="solar:history-bold"
      variant="default"
    >
      <div class="space-y-4 max-h-80 overflow-y-auto">
        <div
          v-for="activity in activities"
          :key="activity.id"
          class="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <div
            class="flex-shrink-0 p-2 rounded-lg"
            :class="getVariantClass(activity.variant)"
          >
            <Icon :icon="activity.icon" class="h-4 w-4 text-white" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-900">
              {{ activity.title }}
            </p>
            <p class="text-xs text-gray-500 mt-1">{{ activity.description }}</p>
            <p class="text-xs text-gray-400 mt-2">{{ activity.time }}</p>
          </div>
        </div>
      </div>
    </InfoCard>

    <!-- Recommended Actions -->
    <InfoCard
      title="Recommended Actions"
      icon="solar:lightbulb-bold"
      variant="primary"
    >
      <div class="space-y-4 max-h-80 overflow-y-auto">
        <div
          v-for="action in recommendations"
          :key="action.id"
          class="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <div
            class="flex-shrink-0 p-2 rounded-lg"
            :class="getVariantClass(action.variant)"
          >
            <Icon :icon="action.icon" class="h-4 w-4 text-white" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-900">
              {{ action.title }}
            </p>
            <p class="text-xs text-gray-500 mt-1">{{ action.description }}</p>
          </div>
        </div>
      </div>
    </InfoCard>

    <!-- Quick Navigation -->
    <InfoCard
      title="Quick Navigation"
      icon="solar:compass-bold"
      variant="primary"
    >
      <div class="space-y-4 max-h-80 overflow-y-auto">
        <div
          v-for="nav in navigation"
          :key="nav.id"
          class="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <div
            class="flex-shrink-0 p-2 rounded-lg"
            :class="getVariantClass(nav.variant)"
          >
            <Icon :icon="nav.icon" class="h-4 w-4 text-white" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-900">{{ nav.title }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ nav.description }}</p>
          </div>
        </div>
      </div>
    </InfoCard>
  </div>
</template>

<script setup lang="ts">
import InfoCard from "@/base_components/ui/cards/InfoCard.vue";
import { Icon } from "@iconify/vue";
import { useMockData } from "../composables/useMockData";

/**
 * DashboardSidebar - Activity feed and quick actions
 *
 * Three simple sections:
 * - Recent activity
 * - Recommended actions
 * - Quick navigation
 */

const { activities, recommendations } = useMockData();

// CSS classes for different variants
function getVariantClass(variant: string): string {
  const variants = {
    danger: "bg-red-500",
    success: "bg-theme-primary",
    primary: "bg-theme-primary",
    warning: "bg-yellow-500",
    default: "bg-theme-black",
  };
  return variants[variant as keyof typeof variants] || variants.default;
}

// Static navigation items
const navigation = [
  {
    id: 1,
    title: "Projects",
    description: "Manage your repositories",
    icon: "solar:folder-bold",
    variant: "primary",
  },
  {
    id: 2,
    title: "Settings",
    description: "Configure your preferences",
    icon: "solar:settings-bold",
    variant: "default",
  },
  {
    id: 3,
    title: "Reports",
    description: "View detailed analytics",
    icon: "solar:chart-2-bold",
    variant: "success",
  },
  {
    id: 4,
    title: "Security",
    description: "Security configurations",
    icon: "solar:shield-bold",
    variant: "warning",
  },
];
</script>

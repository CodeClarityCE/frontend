<template>
  <!-- Main card with left border color based on variant -->
  <Card
    class="border-l-4 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col"
    :class="borderColor"
  >
    <CardHeader>
      <!-- Icon, title, description, and actions in a single row -->
      <div class="flex items-center gap-3">
        <!-- Icon (required) -->
        <Icon :icon="icon" class="h-5 w-5 text-gray-600" />

        <!-- Title and optional description -->
        <div>
          <CardTitle class="text-lg font-semibold text-theme-black">{{
            title
          }}</CardTitle>
          <CardDescription v-if="description" class="text-sm text-theme-gray">{{
            description
          }}</CardDescription>
        </div>

        <!-- Optional actions slot (buttons, badges, etc.) -->
        <slot name="actions" class="ml-auto"></slot>
      </div>
    </CardHeader>

    <!-- Optional card content -->
    <CardContent v-if="$slots['default']" class="flex-1 flex flex-col">
      <slot></slot>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/ui/card";

/**
 * InfoCard - A simple card component with icon, title, description and actions
 *
 * Usage:
 * <InfoCard title="Card Title" icon="mdi:home" variant="primary">
 *   <template #actions>
 *     <Button>Action</Button>
 *   </template>
 *   Card content goes here
 * </InfoCard>
 */
interface Props {
  title: string; // Required: Main card title
  description?: string; // Optional: Subtitle/description text
  icon: string; // Required: Iconify icon name (e.g., "mdi:home")
  variant?: "primary" | "danger" | "success" | "warning" | "default"; // Optional: Color theme
}

const props = withDefaults(defineProps<Props>(), {
  variant: "default",
  description: undefined,
});

// Map variant to border color class - easy to modify for new variants
const borderColor = {
  primary: "border-l-theme-primary", // Theme primary for primary actions
  danger: "border-l-red-500", // Red for warnings/errors
  success: "border-l-theme-primary", // Theme primary for success states
  warning: "border-l-yellow-500", // Yellow for warnings
  default: "border-l-theme-black", // Black for neutral content
}[props.variant];
</script>

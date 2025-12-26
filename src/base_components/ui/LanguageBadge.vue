<script lang="ts" setup>
import type { DetectedLanguage } from "@/utils/languageDetection";
import { Icon } from "@iconify/vue";

defineProps<{
  language: DetectedLanguage;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "minimal";
}>();
</script>

<template>
  <div
    class="inline-flex items-center gap-1.5 rounded-full border transition-all duration-200"
    :class="{
      // Size variants
      'px-2 py-1 text-xs': size === 'sm' || !size,
      'px-3 py-1.5 text-sm': size === 'md',
      'px-4 py-2 text-base': size === 'lg',

      // Style variants
      'bg-white border-gray-200 text-gray-700 hover:border-gray-300':
        variant === 'default' || !variant,
      'bg-gray-50 border-gray-100 text-gray-600': variant === 'minimal',
    }"
  >
    <Icon
      :icon="language.icon"
      :class="{
        'h-3 w-3': size === 'sm' || !size,
        'h-4 w-4': size === 'md',
        'h-5 w-5': size === 'lg',
      }"
    />
    <span class="font-medium">{{ language.name }}</span>
  </div>
</template>

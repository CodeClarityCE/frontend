<script lang="ts" setup>
import { Icon } from "@iconify/vue";

import type { EcosystemInfoExtended } from "@/utils/packageEcosystem";

withDefaults(
  defineProps<{
    ecosystem: Pick<EcosystemInfoExtended, "name" | "language" | "icon">;
    size?: "xs" | "sm" | "md" | "lg";
    variant?: "default" | "minimal" | "outline";
    showName?: boolean;
  }>(),
  { size: "sm", variant: "default", showName: true },
);
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full border text-foreground"
    :class="{
      'px-1.5 py-0.5 text-xs': size === 'xs',
      'px-2 py-1 text-xs': size === 'sm',
      'px-3 py-1.5 text-sm': size === 'md',
      'px-4 py-2 text-base': size === 'lg',
      'border-border bg-background': variant === 'default',
      'border-transparent bg-muted': variant === 'minimal',
      'border-border bg-transparent': variant === 'outline',
    }"
    :title="`${ecosystem.name} (${ecosystem.language})`"
    :aria-label="showName ? undefined : ecosystem.name"
    :role="showName ? undefined : 'img'"
  >
    <Icon
      v-if="ecosystem.icon"
      :icon="ecosystem.icon"
      aria-hidden="true"
      :class="{
        'size-2.5': size === 'xs',
        'size-3': size === 'sm',
        'size-4': size === 'md',
        'size-5': size === 'lg',
      }"
    />
    <span v-if="showName" class="font-medium">{{ ecosystem.name }}</span>
  </span>
</template>

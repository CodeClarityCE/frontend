<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/shadcn/lib/utils";

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"];
    // The heading element, so a title can sit at the right level on its page.
    as?: "h2" | "h3" | "h4" | "h5";
  }>(),
  { class: undefined, as: "h5" },
);
</script>

<template>
  <component
    :is="props.as"
    data-slot="alert-title"
    :class="cn('mb-1 font-medium leading-none tracking-tight', props.class)"
  >
    <slot />
  </component>
</template>

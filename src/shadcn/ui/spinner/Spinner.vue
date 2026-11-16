<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { LoaderCircle } from "@lucide/vue";
import { cn } from "@/shadcn/lib/utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
  // Names the spinner for screen readers; without it they skip it.
  label?: string;
}>();
</script>

<template>
  <LoaderCircle
    data-slot="spinner"
    :role="label ? 'status' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    :class="cn('size-4 animate-spin motion-reduce:animate-none', props.class)"
  />
</template>

<script setup lang="ts">
import { Check, Copy } from "@lucide/vue";
import { onBeforeUnmount, ref } from "vue";

import { Button } from "@/shadcn/ui/button";

// A shell command in monospace with a button that copies it.
const props = defineProps<{
  command: string;
  /** What the command does, for the button's name: "Copy <label> command" */
  label?: string;
}>();

const status = ref<"" | "Copied" | "Could not copy">("");
let timer: ReturnType<typeof setTimeout> | undefined;

async function copy(): Promise<void> {
  clearTimeout(timer);
  try {
    await navigator.clipboard.writeText(props.command);
    status.value = "Copied";
  } catch {
    status.value = "Could not copy";
  }
  timer = setTimeout(() => (status.value = ""), 2000);
}

onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <div class="flex items-start gap-2">
    <code
      class="min-w-0 flex-1 rounded-control bg-muted px-2 py-1 font-mono text-xs break-all"
      >{{ command }}</code
    >
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      class="shrink-0"
      :aria-label="label ? `Copy ${label} command` : 'Copy command'"
      @click="copy"
    >
      <Check v-if="status === 'Copied'" class="size-4" aria-hidden="true" />
      <Copy v-else class="size-4" aria-hidden="true" />
    </Button>
    <span role="status" class="shrink-0 py-1 text-xs text-muted-foreground">{{
      status
    }}</span>
  </div>
</template>

<script setup lang="ts">
import { Check, Copy } from "@lucide/vue";
import { onBeforeUnmount, ref } from "vue";

import { Button } from "@/shadcn/ui/button";
import { copyToClipboard } from "@/utils/clipboard";

// A shell command in monospace with a button that copies it.
const props = defineProps<{
  command: string;
  /** What the command does, for the button's name: "Copy <label> command" */
  label?: string;
}>();

const status = ref<"" | "Copied">("");
let timer: ReturnType<typeof setTimeout> | undefined;

async function copy(): Promise<void> {
  clearTimeout(timer);
  status.value = (await copyToClipboard(props.command)) ? "Copied" : "";
  timer = setTimeout(() => (status.value = ""), 2000);
}

onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <div class="flex items-start gap-2">
    <code
      class="flex min-h-8 min-w-0 flex-1 items-center rounded-control bg-muted px-2 py-1 font-mono text-xs break-all"
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
    <span
      role="status"
      class="shrink-0 text-xs leading-8 text-muted-foreground"
      >{{ status }}</span
    >
  </div>
</template>

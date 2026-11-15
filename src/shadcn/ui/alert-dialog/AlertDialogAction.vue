<script setup lang="ts">
import type { AlertDialogActionProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { reactiveOmit } from "@vueuse/core";
import { cn } from "@/shadcn/lib/utils";
import { AlertDialogAction } from "reka-ui";
import { buttonVariants } from "@/shadcn/ui/button";

const props = defineProps<
  AlertDialogActionProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = reactiveOmit(props, "class");
</script>

<template>
  <AlertDialogAction
    data-slot="alert-dialog-action"
    v-bind="delegatedProps"
    :class="cn(buttonVariants(), props.class)"
  >
    <slot />
  </AlertDialogAction>
</template>

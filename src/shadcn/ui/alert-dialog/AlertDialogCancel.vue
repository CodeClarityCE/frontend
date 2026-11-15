<script setup lang="ts">
import type { AlertDialogCancelProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { reactiveOmit } from "@vueuse/core";
import { cn } from "@/shadcn/lib/utils";
import { AlertDialogCancel } from "reka-ui";
import { buttonVariants } from "@/shadcn/ui/button";

const props = defineProps<
  AlertDialogCancelProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = reactiveOmit(props, "class");
</script>

<template>
  <AlertDialogCancel
    data-slot="alert-dialog-cancel"
    v-bind="delegatedProps"
    :class="cn(buttonVariants({ variant: 'outline' }), props.class)"
  >
    <slot />
  </AlertDialogCancel>
</template>

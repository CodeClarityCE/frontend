<script setup lang="ts">
import type { PrimitiveProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import type { ButtonVariants } from ".";
import { ArrowRight } from "@lucide/vue";
import { Primitive } from "reka-ui";
import { cn } from "@/shadcn/lib/utils";
import { buttonVariants } from ".";

interface Props extends PrimitiveProps {
  variant?: ButtonVariants["variant"];
  size?: ButtonVariants["size"];
  class?: HTMLAttributes["class"];
  // Sliding arrow, reserved for primary calls to action. Not with asChild.
  arrow?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  as: "button",
});
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot />
    <ArrowRight
      v-if="arrow && !asChild"
      aria-hidden="true"
      class="transition-transform group-hover/button:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover/button:translate-x-0"
    />
  </Primitive>
</template>

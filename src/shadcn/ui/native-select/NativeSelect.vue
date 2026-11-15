<script setup lang="ts">
import type { AcceptableValue } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { ChevronDown } from "@lucide/vue";
import { reactiveOmit } from "@vueuse/core";
import { cn } from "@/shadcn/lib/utils";

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<{
  class?: HTMLAttributes["class"];
  // Classes for the wrapper, which holds the width.
  wrapperClass?: HTMLAttributes["class"];
}>();

// Updates the parent in the same tick, unlike a passive useVModel.
const modelValue = defineModel<AcceptableValue | AcceptableValue[]>({
  default: "",
});

const delegatedProps = reactiveOmit(props, "class", "wrapperClass");
</script>

<template>
  <div
    :class="
      cn(
        'group/native-select relative w-fit has-[select:disabled]:opacity-50',
        props.wrapperClass,
      )
    "
    data-slot="native-select-wrapper"
  >
    <select
      v-bind="{ ...$attrs, ...delegatedProps }"
      v-model="modelValue"
      data-slot="native-select"
      :class="
        cn(
          'border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 dark:hover:bg-input/50 h-9 w-full min-w-0 appearance-none rounded-control border bg-transparent px-3 py-2 pr-9 text-sm shadow-card transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed',
          'focus-visible:ring-ring focus-visible:ring-2',
          props.class,
        )
      "
    >
      <slot />
    </select>
    <ChevronDown
      class="text-muted-foreground pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 opacity-50 select-none"
      aria-hidden="true"
      data-slot="native-select-icon"
    />
  </div>
</template>

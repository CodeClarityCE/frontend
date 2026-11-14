<script setup lang="ts">
import type { SelectContentEmits, SelectContentProps } from "reka-ui";
import { type HTMLAttributes, nextTick, onBeforeUnmount, watch } from "vue";
import { reactiveOmit } from "@vueuse/core";
import {
  injectSelectRootContext,
  SelectContent,
  SelectPortal,
  SelectViewport,
  useForwardPropsEmits,
} from "reka-ui";
import { cn } from "@/shadcn/lib/utils";
import { SelectScrollDownButton, SelectScrollUpButton } from ".";

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<SelectContentProps & { class?: HTMLAttributes["class"] }>(),
  {
    position: "popper",
  },
);
const emits = defineEmits<SelectContentEmits>();

const delegatedProps = reactiveOmit(props, "class");

const forwarded = useForwardPropsEmits(delegatedProps, emits);

// Reka hides the rest of the page with aria-hidden while the list is open but
// leaves it focusable; making it inert too keeps assistive tech and focus in step.
const root = injectSelectRootContext();
let madeInert: Element[] = [];

function releaseInert(): void {
  madeInert.forEach((el) => el.removeAttribute("inert"));
  madeInert = [];
}

watch(root.open, async (open) => {
  releaseInert();
  if (!open) return;
  await nextTick();
  if (!root.open.value) return;
  madeInert = [...document.querySelectorAll("[data-aria-hidden]")].filter(
    (el) => !el.hasAttribute("inert"),
  );
  madeInert.forEach((el) => el.setAttribute("inert", ""));
});

onBeforeUnmount(releaseInert);
</script>

<template>
  <SelectPortal>
    <SelectContent
      v-bind="{ ...forwarded, ...$attrs }"
      :class="
        cn(
          'relative z-50 max-h-96 min-w-32 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-raised data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          props.class,
        )
      "
    >
      <SelectScrollUpButton />
      <SelectViewport
        :class="
          cn(
            'p-1',
            position === 'popper' &&
              'h-(--reka-select-trigger-height) w-full min-w-(--reka-select-trigger-width)',
          )
        "
      >
        <slot />
      </SelectViewport>
      <SelectScrollDownButton />
    </SelectContent>
  </SelectPortal>
</template>

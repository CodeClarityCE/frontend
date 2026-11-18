<script setup lang="ts">
import type { Component } from "vue";
import type { SidebarMenuButtonProps } from "./SidebarMenuButtonChild.vue";
import { reactiveOmit } from "@vueuse/core";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import SidebarMenuButtonChild from "./SidebarMenuButtonChild.vue";
import { useSidebar } from "./utils";

defineOptions({
  inheritAttrs: false,
});

// Typed lint cannot resolve props imported from a .vue file; vue-tsc can.
/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-redundant-type-constituents */
const props = withDefaults(
  defineProps<
    SidebarMenuButtonProps & {
      tooltip?: string | Component;
    }
  >(),
  {
    as: "button",
    variant: "default",
    size: "default",
  },
);
/* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-redundant-type-constituents */

const { isMobile, state } = useSidebar();

const delegatedProps = reactiveOmit(props, "tooltip");
</script>

<template>
  <SidebarMenuButtonChild
    v-if="!tooltip"
    v-bind="{ ...delegatedProps, ...$attrs }"
  >
    <slot />
  </SidebarMenuButtonChild>

  <Tooltip v-else>
    <TooltipTrigger as-child>
      <SidebarMenuButtonChild v-bind="{ ...delegatedProps, ...$attrs }">
        <slot />
      </SidebarMenuButtonChild>
    </TooltipTrigger>
    <TooltipContent
      side="right"
      align="center"
      :hidden="state !== 'collapsed' || isMobile"
    >
      <template v-if="typeof tooltip === 'string'">
        {{ tooltip }}
      </template>
      <component :is="tooltip" v-else />
    </TooltipContent>
  </Tooltip>
</template>

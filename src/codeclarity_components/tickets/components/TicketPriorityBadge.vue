<script setup lang="ts">
import {
  type TicketPriority,
  TicketPriorityColors,
  TicketPriorityLabels,
} from "../tickets.entity";

// A ticket priority in words, on its severity colour.
defineProps<{ priority: TicketPriority }>();
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
    :class="TicketPriorityColors[priority]"
  >
    {{ TicketPriorityLabels[priority] }}
  </span>
</template>

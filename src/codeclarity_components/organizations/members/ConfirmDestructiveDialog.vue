<script setup lang="ts">
import type { Component } from "vue";

import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { Spinner } from "@/shadcn/ui/spinner";

// Asks before a destructive action; the parent acts on confirm.
defineProps<{
  title: string;
  description: string;
  confirmLabel: string;
  icon: Component;
  busy?: boolean;
}>();
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<{ confirm: [] }>();
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>
      <DialogFooter class="gap-2">
        <Button variant="outline" @click="open = false">Cancel</Button>
        <Button variant="destructive" :disabled="busy" @click="emit('confirm')">
          <Spinner v-if="busy" />
          <component :is="icon" v-else aria-hidden="true" />
          {{ confirmLabel }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

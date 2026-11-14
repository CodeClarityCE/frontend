<script setup lang="ts">
import { LoaderCircle, Trash2 } from "@lucide/vue";

import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";

// Asks before an integration is deleted; the parent does the deletion on confirm.
withDefaults(
  defineProps<{
    name: string;
    busy?: boolean;
    description?: string;
    verb?: "Delete" | "Disconnect";
  }>(),
  {
    busy: false,
    description:
      "Projects imported through it can no longer be analysed until you add the integration again. This cannot be undone.",
    verb: "Delete",
  },
);
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<{ confirm: [] }>();
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          <template v-if="verb === 'Disconnect'"
            >Disconnect {{ name }}?</template
          >
          <template v-else>Delete the {{ name }} integration?</template>
        </DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>
      <DialogFooter class="gap-2">
        <Button variant="outline" @click="open = false">Cancel</Button>
        <Button variant="destructive" :disabled="busy" @click="emit('confirm')">
          <LoaderCircle
            v-if="busy"
            aria-hidden="true"
            class="animate-spin motion-reduce:animate-none"
          />
          <Trash2 v-else aria-hidden="true" />
          {{ verb === "Disconnect" ? "Disconnect" : "Delete integration" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

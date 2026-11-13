<script lang="ts" setup>
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import { Textarea } from "@/shadcn/ui/textarea";

defineProps<{
  name: string;
  description: string;
  // Errors to show under each field, once the user tried to submit.
  errors?: { name?: string; description?: string };
}>();

const emit = defineEmits<{
  "update:name": [value: string];
  "update:description": [value: string];
}>();
</script>

<template>
  <div class="grid gap-6 md:grid-cols-2">
    <div class="flex flex-col gap-2">
      <Label for="analyzer-name">Name</Label>
      <Input
        id="analyzer-name"
        :model-value="name"
        placeholder="JavaScript security scan"
        :aria-invalid="errors?.name ? true : undefined"
        :aria-describedby="errors?.name ? 'analyzer-name-error' : undefined"
        @update:model-value="emit('update:name', String($event))"
      />
      <p
        v-if="errors?.name"
        id="analyzer-name-error"
        class="text-sm text-destructive"
      >
        {{ errors.name }}
      </p>
    </div>

    <div class="flex flex-col gap-2">
      <Label for="analyzer-description">Description</Label>
      <Textarea
        id="analyzer-description"
        :model-value="description"
        rows="2"
        placeholder="What this analyzer checks"
        :aria-invalid="errors?.description ? true : undefined"
        :aria-describedby="
          errors?.description ? 'analyzer-description-error' : undefined
        "
        @update:model-value="emit('update:description', String($event))"
      />
      <p
        v-if="errors?.description"
        id="analyzer-description-error"
        class="text-sm text-destructive"
      >
        {{ errors.description }}
      </p>
    </div>
  </div>
</template>

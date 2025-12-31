<script setup lang="ts">
import { ErrorMessage, Field } from "vee-validate";

const props = defineProps<{
  placeholder: string;
  name: string;
  choices: string[];
  disabled?: boolean;
}>();

const data = defineModel<string[]>("data", { default: {} });
</script>
<template>
  <div>
    <label class="text-gray-500 mb-1" :for="props.name">
      <slot name="name"></slot>
    </label>
    <Field
      v-slot="{ value }"
      v-model="data"
      :name="props.name"
      :class="props.disabled ? 'cursor-not-allowed' : ''"
      class="border border-solid border-gray-400 rounded shadow-md w-full py-3 px-5"
      as="select"
      multiple
    >
      <option value="" disabled>{{ placeholder }}</option>
      <option
        v-for="choice in choices"
        :key="choice"
        :value="choice"
        :selected="value && value.includes(choice)"
      >
        {{ choice }}
      </option>
    </Field>
    <ErrorMessage class="text-destructive mt-1 block" :name="props.name" />
  </div>
</template>

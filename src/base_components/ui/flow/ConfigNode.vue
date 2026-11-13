<template>
  <div
    class="relative min-w-[150px] rounded-md border bg-muted p-3 shadow-card"
  >
    <div class="mb-2 flex items-center gap-1">
      <Settings aria-hidden="true" class="size-3 text-muted-foreground" />
      <h4 class="truncate text-xs font-medium text-foreground">
        {{ data.label }}
      </h4>
    </div>

    <div class="flex flex-col gap-1">
      <input
        v-if="data.configType === 'string'"
        v-model="localValue"
        type="text"
        class="w-full rounded-sm border bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :aria-label="data.label"
        :placeholder="`Enter ${data.label}...`"
      />
      <input
        v-else-if="data.configType === 'number'"
        v-model.number="localValue"
        type="number"
        class="w-full rounded-sm border bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :aria-label="data.label"
        :placeholder="`Enter ${data.label}...`"
      />
      <textarea
        v-else-if="
          data.configType === 'array' || data.configType === 'Array<string>'
        "
        v-model="localValue"
        class="w-full rounded-sm border bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :aria-label="data.label"
        rows="2"
        :placeholder="`Enter ${data.label} (one per line)...`"
      />
      <select
        v-else-if="data.configType === 'boolean'"
        v-model="localValue"
        class="w-full rounded-sm border bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :aria-label="data.label"
      >
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
      <input
        v-else
        v-model="localValue"
        type="text"
        class="w-full rounded-sm border bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :aria-label="data.label"
        :placeholder="`Enter ${data.label}...`"
      />
    </div>

    <Handle
      :id="data.configKey"
      type="source"
      :position="Position.Right"
      :style="{
        backgroundColor: 'var(--background)',
        border: '2px solid var(--foreground-strong)',
        width: '16px',
        height: '16px',
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { Settings } from "@lucide/vue";
import { Handle, Position } from "@vue-flow/core";
import { computed } from "vue";

type ConfigValue = string | number | boolean | string[] | null | undefined;

interface Props {
  data: {
    label: string;
    configKey: string;
    configType: string;
    value: ConfigValue;
  };
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:data": [
    value: {
      label: string;
      configKey: string;
      configType: string;
      value: ConfigValue;
    },
  ];
}>();

const localValue = computed({
  get: () => {
    const val = props.data.value;
    // Convert boolean to string for select element compatibility
    if (typeof val === "boolean") return String(val);
    return val;
  },
  set: (value: string | number | readonly string[] | null | undefined) => {
    let finalValue: ConfigValue = value as ConfigValue;
    // Convert string 'true'/'false' back to boolean for boolean configType
    if (props.data.configType === "boolean" && typeof value === "string") {
      finalValue = value === "true";
    }
    emit("update:data", { ...props.data, value: finalValue });
  },
});
</script>

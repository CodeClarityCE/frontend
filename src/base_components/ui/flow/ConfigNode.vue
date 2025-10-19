<template>
    <div class="config-node">
        <div class="config-header">
            <Icon icon="solar:settings-bold" class="text-gray-600" />
            <h4 class="config-title">{{ data.label }}</h4>
        </div>

        <div class="config-content">
            <input
                v-if="data.configType === 'string'"
                v-model="localValue"
                type="text"
                class="config-input"
                :placeholder="`Enter ${data.label}...`"
            />
            <input
                v-else-if="data.configType === 'number'"
                v-model.number="localValue"
                type="number"
                class="config-input"
                :placeholder="`Enter ${data.label}...`"
            />
            <textarea
                v-else-if="data.configType === 'array' || data.configType === 'Array<string>'"
                v-model="localValue"
                class="config-input"
                rows="2"
                :placeholder="`Enter ${data.label} (one per line)...`"
            />
            <select
                v-else-if="data.configType === 'boolean'"
                v-model="localValue"
                class="config-input"
            >
                <option value="true">True</option>
                <option value="false">False</option>
            </select>
            <input
                v-else
                v-model="localValue"
                type="text"
                class="config-input"
                :placeholder="`Enter ${data.label}...`"
            />
        </div>

        <Handle
            :id="data.configKey"
            type="source"
            :position="Position.Right"
            :style="{
                backgroundColor: 'white',
                border: '2px solid black',
                width: '16px',
                height: '16px'
            }"
        />
    </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';
import { Icon } from '@iconify/vue';
import { computed } from 'vue';

interface Props {
    data: {
        label: string;
        configKey: string;
        configType: string;
        value: any;
    };
}

const props = defineProps<Props>();
const emit = defineEmits<{
    'update:data': [value: any];
}>();

const localValue = computed({
    get: () => props.data.value,
    set: (value) => {
        emit('update:data', { ...props.data, value });
    }
});
</script>

<style scoped>
.config-node {
    position: relative;
    background-color: #f9fafb;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    padding: 0.75rem;
    min-width: 150px;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

.config-header {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-bottom: 0.5rem;
}

.config-title {
    font-size: 0.75rem;
    line-height: 1rem;
    font-weight: 500;
    color: #374151;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.config-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.config-input {
    width: 100%;
    font-size: 0.75rem;
    line-height: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.25rem;
    padding: 0.25rem 0.5rem;
    background-color: white;
}

.config-input:focus {
    outline: none;
    box-shadow: 0 0 0 1px #000000;
    border-color: #000000;
}
</style>

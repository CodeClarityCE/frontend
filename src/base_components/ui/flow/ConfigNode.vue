<template>
    <div class="config-node">
        <div class="config-header">
            <Icon icon="solar:settings-bold" class="text-gray-600" />
            <h4 class="config-title">{{ data.label }}</h4>
        </div>
        
        <div class="config-content">
            <input 
                v-if="data.configType === 'string'"
                v-model="data.value"
                type="text"
                class="config-input"
                :placeholder="`Enter ${data.label}...`"
            />
            <input 
                v-else-if="data.configType === 'number'"
                v-model.number="data.value"
                type="number"
                class="config-input"
                :placeholder="`Enter ${data.label}...`"
            />
            <textarea 
                v-else-if="data.configType === 'array' || data.configType === 'Array<string>'"
                v-model="data.value"
                class="config-input"
                rows="2"
                :placeholder="`Enter ${data.label} (one per line)...`"
            />
            <select 
                v-else-if="data.configType === 'boolean'"
                v-model="data.value"
                class="config-input"
            >
                <option value="true">True</option>
                <option value="false">False</option>
            </select>
            <input 
                v-else
                v-model="data.value"
                type="text"
                class="config-input"
                :placeholder="`Enter ${data.label}...`"
            />
        </div>
        
        <Handle 
            :id="data.configKey"
            type="source" 
            :position="Position.Right"
            :style="{ backgroundColor: '#9ca3af' }"
        />
    </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { Icon } from '@iconify/vue'

interface Props {
    data: {
        label: string
        configKey: string
        configType: string
        value: any
    }
}

defineProps<Props>()
</script>

<style scoped>
.config-node {
    @apply relative bg-gray-50 border border-gray-300 rounded-md p-3 min-w-[150px] shadow-sm;
}

.config-header {
    @apply flex items-center gap-1 mb-2;
}

.config-title {
    @apply text-xs font-medium text-gray-700 truncate;
}

.config-content {
    @apply space-y-1;
}

.config-input {
    @apply w-full text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-black;
}

.config-input:focus {
    @apply border-black ring-1 ring-black;
}
</style>
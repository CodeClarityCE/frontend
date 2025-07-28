<template>
    <div class="analyzer-node">
        <Handle 
            v-for="(dependency, index) in data.plugin.depends_on" 
            :key="`input-${dependency}-${index}`"
            :id="dependency"
            type="target" 
            :position="Position.Left"
            :style="{ top: `${20 + index * 20}px`, backgroundColor: getColor(dependency) }"
        />
        
        
        <div class="node-header">
            <Icon icon="solar:cpu-bolt-bold" class="text-white" />
            <h3 class="node-title">{{ data.label }}</h3>
        </div>
        
        <div class="node-content">
            <p class="node-description">{{ data.description }}</p>
            <div class="node-version">{{ data.version }}</div>
        </div>
        
        <Handle 
            :id="data.label"
            type="source" 
            :position="Position.Right"
            :style="{ backgroundColor: getColor(data.label) }"
        />
    </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { Icon } from '@iconify/vue'
import { getColor } from '@/utils/vueFlow'
import type { Plugin } from '@/codeclarity_components/organizations/analyzers/Plugin'

interface Props {
    data: {
        label: string
        plugin: Plugin
        version: string
        description: string
    }
}

defineProps<Props>()
</script>

<style scoped>
.analyzer-node {
    @apply relative bg-[#008491] text-white border border-[#006d75] rounded-lg p-4 shadow-lg;
    min-width: 280px;
    max-width: 320px;
}

.node-header {
    @apply flex items-center gap-2 mb-2;
}

.node-title {
    @apply text-sm font-semibold truncate;
}

.node-content {
    @apply space-y-1;
}

.node-description {
    @apply text-xs opacity-90 leading-tight;
    word-wrap: break-word;
    overflow-wrap: break-word;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    max-height: 3.6em;
}

.node-version {
    @apply text-xs bg-white/20 px-2 py-1 rounded text-center;
}

/* Handle styles are applied via inline styles in template */
</style>
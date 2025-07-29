<script lang="ts" setup>
import { Icon } from '@iconify/vue';
import { Button } from '@/shadcn/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/shadcn/ui/dropdown-menu';
import { ref } from 'vue';
import type { Ref } from 'vue';

const emit = defineEmits<{
    export: [format: 'csv' | 'json' | 'cyclonedx' | 'html'];
}>();

const isExporting: Ref<boolean> = ref(false);
const exportProgress: Ref<string> = ref('');

const exportFormats = [
    {
        id: 'csv',
        name: 'CSV',
        description: 'Comma-separated values',
        icon: 'solar:document-text-bold',
        iconColor: 'text-green-600'
    },
    {
        id: 'html',
        name: 'HTML Report',
        description: 'Interactive table with highlighting',
        icon: 'solar:palette-bold',
        iconColor: 'text-orange-600'
    },
    {
        id: 'json',
        name: 'JSON',
        description: 'JavaScript Object Notation',
        icon: 'solar:code-bold',
        iconColor: 'text-blue-600'
    },
    {
        id: 'cyclonedx',
        name: 'CycloneDX',
        description: 'Industry standard SBOM format',
        icon: 'solar:shield-check-bold',
        iconColor: 'text-purple-600'
    }
] as const;

function handleExport(format: 'csv' | 'json' | 'cyclonedx' | 'html') {
    isExporting.value = true;
    exportProgress.value = 'Preparing export...';
    emit('export', format);
}

function setExportProgress(progress: string) {
    exportProgress.value = progress;
}

function resetExportState() {
    isExporting.value = false;
    exportProgress.value = '';
}

defineExpose({
    setExportProgress,
    resetExportState
});
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button
                variant="outline"
                class="w-full border-2 border-gray-200 hover:border-[#1dce79] hover:bg-[#1dce79]/5 text-gray-700 hover:text-[#1dce79] flex items-center gap-3 justify-start p-4 h-auto text-left transition-all"
                :disabled="isExporting"
            >
                <div class="bg-gray-100 p-2 rounded-lg group-hover:bg-[#1dce79]/10">
                    <Icon
                        :icon="isExporting ? 'solar:hourglass-line-bold' : 'solar:download-bold'"
                        class="h-5 w-5"
                        :class="{ 'animate-spin': isExporting }"
                    />
                </div>
                <div class="flex-1">
                    <div class="font-semibold">
                        {{ isExporting ? 'Exporting...' : 'Export Report' }}
                    </div>
                    <div class="text-sm text-gray-500">
                        {{
                            isExporting
                                ? exportProgress || 'Preparing your download'
                                : 'Download detailed SBOM report'
                        }}
                    </div>
                </div>
                <Icon icon="solar:alt-arrow-down-linear" class="h-4 w-4 text-gray-400" />
            </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" class="w-72 p-2" :side-offset="5">
            <DropdownMenuLabel class="text-sm font-semibold text-gray-700 px-2 py-1.5">
                Choose Export Format
            </DropdownMenuLabel>
            <DropdownMenuSeparator class="my-2" />

            <DropdownMenuItem
                v-for="format in exportFormats"
                :key="format.id"
                class="flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50 rounded-md transition-colors"
                @click="handleExport(format.id)"
            >
                <div :class="[format.iconColor, 'mt-0.5']">
                    <Icon :icon="format.icon" class="h-5 w-5" />
                </div>
                <div class="flex-1">
                    <div class="font-medium text-gray-900">{{ format.name }}</div>
                    <div class="text-xs text-gray-500 mt-0.5">{{ format.description }}</div>
                </div>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>

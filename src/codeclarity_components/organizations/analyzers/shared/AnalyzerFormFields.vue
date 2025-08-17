<script lang="ts" setup>
import FormTextField from '@/base_components/forms/FormTextField.vue';
import { Icon } from '@iconify/vue';

defineProps<{
    name: string;
    description: string;
    supportedLanguages?: string[];
    logo?: string;
}>();

defineEmits<{
    'update:name': [value: string];
    'update:description': [value: string];
    'update:supportedLanguages': [value: string[]];
    'update:logo': [value: string];
}>();

// These options can be used for future language and logo selection features
// const languageOptions = [
//     { value: 'javascript', label: 'JavaScript', icon: '🟨' },
//     { value: 'php', label: 'PHP', icon: '🐘' }
// ];

// const logoOptions = [
//     { value: 'js', label: 'JavaScript', icon: '🟨' },
//     { value: 'php', label: 'PHP', icon: '🐘' },
//     { value: 'multi', label: 'Multi-Language', icon: '🌐' }
// ];
</script>

<template>
    <div class="bg-white border border-slate-200/60 rounded-lg p-6">
        <div class="flex items-center gap-2 mb-4">
            <Icon icon="solar:info-circle-bold" class="w-5 h-5 text-theme-primary" />
            <h3 class="text-lg font-semibold text-theme-black">Basic Information</h3>
        </div>

        <div class="grid md:grid-cols-2 gap-4">
            <!-- Name Field -->
            <FormTextField
                :model-value="name"
                :placeholder="'Enter analyzer name...'"
                :type="'text'"
                :name="'name'"
                @update:model-value="$emit('update:name', $event)"
            >
                <template #name>
                    <span class="block text-sm font-semibold text-theme-black mb-2">
                        Analyzer Name
                        <span class="text-red-500">*</span>
                    </span>
                </template>
            </FormTextField>

            <!-- Description Field -->
            <FormTextField
                :model-value="description"
                :placeholder="'Enter analyzer description...'"
                :type="'text'"
                :name="'description'"
                @update:model-value="$emit('update:description', $event)"
            >
                <template #name>
                    <span class="block text-sm font-semibold text-theme-black mb-2">
                        Description
                        <span class="text-red-500">*</span>
                    </span>
                </template>
            </FormTextField>
        </div>
    </div>
</template>

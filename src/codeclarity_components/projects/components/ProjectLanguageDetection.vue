<script lang="ts" setup>
import LanguageBadge from '@/base_components/ui/LanguageBadge.vue';
import type { Project } from '@/codeclarity_components/projects/project.entity';
import Skeleton from '@/shadcn/ui/skeleton/Skeleton.vue';
import { useAuthStore } from '@/stores/auth';
import { useProjectsMainStore } from '@/stores/StateStore';
import { LanguageDetectionService, type DetectedLanguage } from '@/utils/languageDetection';
import { Icon } from '@iconify/vue';
import { ref, onMounted, type Ref } from 'vue';

const props = defineProps<{
    project: Project;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'minimal';
}>();

// Stores
const authStore = useAuthStore();
const viewState = useProjectsMainStore();

// State
const detectedLanguages: Ref<DetectedLanguage[]> = ref([]);
const loading: Ref<boolean> = ref(false);
const error: Ref<boolean> = ref(false);

// Service
const languageDetectionService = new LanguageDetectionService();

async function detectLanguages(): Promise<void> {
    if (!authStore.getAuthenticated || !authStore.getToken || !viewState.orgId) return;
    if (!props.project.analyses || props.project.analyses.length === 0) return;

    // Get the most recent completed analysis
    const recentAnalysis = languageDetectionService.getMostRecentCompletedAnalysis(
        props.project.analyses
    );
    if (!recentAnalysis) return;

    loading.value = true;
    error.value = false;

    try {
        const languages = await languageDetectionService.detectProjectLanguages(
            viewState.orgId,
            props.project.id,
            recentAnalysis,
            authStore.getToken
        );
        detectedLanguages.value = languages;
    } catch (err) {
        console.error('Failed to detect languages:', err);
        error.value = true;
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    void detectLanguages();
});
</script>

<template>
    <div class="flex items-center gap-2">
        <!-- Loading state -->
        <div v-if="loading" class="flex items-center gap-2">
            <Skeleton
                :class="{
                    'h-5 w-16': size === 'sm' || !size,
                    'h-6 w-20': size === 'md',
                    'h-7 w-24': size === 'lg'
                }"
            />
            <Skeleton
                :class="{
                    'h-5 w-12': size === 'sm' || !size,
                    'h-6 w-16': size === 'md',
                    'h-7 w-20': size === 'lg'
                }"
            />
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="flex items-center gap-1 text-gray-400">
            <Icon
                icon="solar:question-circle-linear"
                :class="{
                    'h-3 w-3': size === 'sm' || !size,
                    'h-4 w-4': size === 'md',
                    'h-5 w-5': size === 'lg'
                }"
            />
            <span
                :class="{
                    'text-xs': size === 'sm' || !size,
                    'text-sm': size === 'md',
                    'text-base': size === 'lg'
                }"
            >
                Unknown
            </span>
        </div>

        <!-- No languages detected -->
        <div
            v-else-if="detectedLanguages.length === 0"
            class="flex items-center gap-1 text-gray-400"
        >
            <Icon
                icon="solar:code-square-linear"
                :class="{
                    'h-3 w-3': size === 'sm' || !size,
                    'h-4 w-4': size === 'md',
                    'h-5 w-5': size === 'lg'
                }"
            />
            <span
                :class="{
                    'text-xs': size === 'sm' || !size,
                    'text-sm': size === 'md',
                    'text-base': size === 'lg'
                }"
            >
                No analysis
            </span>
        </div>

        <!-- Detected languages -->
        <div v-else class="flex items-center gap-1.5">
            <LanguageBadge
                v-for="language in detectedLanguages"
                :key="language.name"
                :language="language"
                :size="size"
                :variant="variant"
            />
        </div>
    </div>
</template>

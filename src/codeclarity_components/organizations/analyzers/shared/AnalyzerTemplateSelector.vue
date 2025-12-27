<script lang="ts" setup>
import { useAuthStore } from "@/stores/auth";
import { Icon } from "@iconify/vue";
import { ref, computed, onMounted, type Ref } from "vue";
import {
  AnalyzerTemplatesRepository,
  type AnalyzerTemplate,
} from "../AnalyzerTemplatesRepository";

const props = defineProps<{
  selectedTemplate?: AnalyzerTemplate | null;
}>();

const emit = defineEmits<{
  "update:selectedTemplate": [template: AnalyzerTemplate | null];
  templateChanged: [template: AnalyzerTemplate];
}>();

// State
const templatesRepo = new AnalyzerTemplatesRepository();
const authStore = useAuthStore();
const templates: Ref<AnalyzerTemplate[]> = ref([]);
const loading = ref(true);
const error = ref(false);

// Computed
const selectedTemplate = computed({
  get: () => props.selectedTemplate ?? null,
  set: (value) => emit("update:selectedTemplate", value ?? null),
});

// Language logos mapping
const languageLogos = {
  js: "🟨", // JavaScript
  php: "🐘", // PHP
  multi: "🌐", // Multi-language
  python: "🐍",
  java: "☕",
  csharp: "🔷",
  go: "🐹",
  rust: "🦀",
};

// Methods
async function loadTemplates(): Promise<void> {
  if (!authStore.getToken) return;

  try {
    loading.value = true;
    error.value = false;
    const response = await templatesRepo.getTemplates({
      bearerToken: authStore.getToken,
    });
    templates.value = response.data;
  } catch (err) {
    console.error("Failed to load analyzer templates:", err);
    error.value = true;
  } finally {
    loading.value = false;
  }
}

function selectTemplate(template: AnalyzerTemplate): void {
  selectedTemplate.value = template;
  void emit("templateChanged", template);
}

function clearSelection(): void {
  selectedTemplate.value = null;
}

function getLanguageDisplayName(language: string): string {
  const displayNames: Record<string, string> = {
    javascript: "JavaScript",
    php: "PHP",
    python: "Python",
    java: "Java",
    csharp: "C#",
    go: "Go",
    rust: "Rust",
  };
  return (
    displayNames[language] ??
    language.charAt(0).toUpperCase() + language.slice(1)
  );
}

function getTemplateLogo(logo: string): string {
  return languageLogos[logo as keyof typeof languageLogos] ?? "📋";
}

// Lifecycle
onMounted(() => {
  void loadTemplates();
});
</script>

<template>
  <div class="bg-white border border-slate-200/60 rounded-lg p-6">
    <div class="flex items-center gap-2 mb-4">
      <Icon icon="solar:programming-bold" class="w-5 h-5 text-theme-primary" />
      <h3 class="text-lg font-semibold text-theme-black">
        Choose Analyzer Template
      </h3>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"
      ></div>
      <span class="ml-3 text-gray-600">Loading templates...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <Icon
        icon="solar:danger-triangle-bold"
        class="w-12 h-12 text-red-500 mx-auto mb-3"
      />
      <p class="text-gray-600 mb-4">Failed to load analyzer templates</p>
      <button
        class="px-4 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary/90 transition-colors"
        @click="loadTemplates"
      >
        Retry
      </button>
    </div>

    <!-- Templates Grid -->
    <div v-else>
      <!-- Custom Option -->
      <div class="mb-4">
        <div
          class="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-theme-primary hover:bg-blue-50/50 transition-all duration-200"
          :class="{
            'border-theme-primary bg-blue-50': selectedTemplate === null,
          }"
          @click="clearSelection"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg"
            >
              🛠️
            </div>
            <div>
              <h4 class="font-medium text-gray-900">Custom Configuration</h4>
              <p class="text-sm text-gray-600">
                Build your own analyzer from scratch
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Template Options -->
      <div class="grid gap-3">
        <div
          v-for="template in templates"
          :key="template.name"
          class="border rounded-lg p-4 cursor-pointer hover:border-theme-primary hover:bg-blue-50/50 transition-all duration-200"
          :class="{
            'border-theme-primary bg-blue-50 ring-1 ring-theme-primary/20':
              selectedTemplate?.name === template.name,
            'border-gray-200': selectedTemplate?.name !== template.name,
          }"
          @click="selectTemplate(template)"
        >
          <div class="flex items-start gap-3">
            <!-- Template Logo -->
            <div
              class="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-lg font-bold"
            >
              {{ getTemplateLogo(template.logo) }}
            </div>

            <!-- Template Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h4 class="font-medium text-gray-900 truncate">
                  {{ template.name }}
                </h4>
                <div
                  v-if="selectedTemplate?.name === template.name"
                  class="shrink-0"
                >
                  <Icon
                    icon="solar:check-circle-bold"
                    class="w-5 h-5 text-green-500"
                  />
                </div>
              </div>

              <p class="text-sm text-gray-600 mb-2 line-clamp-2">
                {{ template.description }}
              </p>

              <!-- Supported Languages -->
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="language in template.supported_languages"
                  :key="language"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {{ getLanguageDisplayName(language) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected Template Info -->
      <div
        v-if="selectedTemplate"
        class="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
      >
        <div class="flex items-start gap-3">
          <Icon
            icon="solar:info-circle-bold"
            class="w-5 h-5 text-blue-600 mt-0.5"
          />
          <div>
            <h5 class="font-medium text-blue-900 mb-1">
              Selected: {{ selectedTemplate.name }}
            </h5>
            <p class="text-sm text-blue-700 mb-2">
              {{ selectedTemplate.description }}
            </p>
            <div class="text-xs text-blue-600">
              <strong>Languages:</strong>
              {{
                selectedTemplate.supported_languages
                  .map(getLanguageDisplayName)
                  .join(", ")
              }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>

<script setup lang="ts">
import { onMounted, ref, computed, type Ref } from "vue";
import EcosystemBadge from "@/base_components/ui/EcosystemBadge.vue";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { ECOSYSTEMS } from "@/utils/packageEcosystem";
import { ResultsRepository } from "./results.repository";
import { WorkspacesOutput } from "./workspace.entity";

export interface Props {
  analysisID?: string;
  projectID?: string;
  /** List of SBOM plugins that were executed (e.g., ['js-sbom', 'php-sbom']). Only checks for these plugins. */
  executedSbomPlugins?: string[];
}
const props = withDefaults(defineProps<Props>(), {
  projectID: "",
  analysisID: "",
  executedSbomPlugins: () => [],
});

const emit = defineEmits<{
  "package-manager-loaded": [packageManager: string];
  "ecosystem-filter-changed": [ecosystem: string | null];
}>();

// Repositories
const sbomRepo: ResultsRepository = new ResultsRepository();

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

// Models
const error = defineModel<boolean>("error", { default: false });
const selected_workspace = defineModel<string>("selected_workspace", {
  default: ".",
});

const workspaces: Ref<WorkspacesOutput> = ref(new WorkspacesOutput());
const selectedEcosystemFilter: Ref<string | null> = ref(null);
const availableEcosystems: Ref<Set<string>> = ref(new Set());

// Computed properties for smart workspace handling
const hasMultipleWorkspaces = computed(() => {
  return workspaces.value.workspaces && workspaces.value.workspaces.length > 1;
});

const ecosystem = computed(() => {
  if (workspaces.value.package_manager) {
    // Map package manager strings to ecosystem types
    const pmLower = workspaces.value.package_manager.toLowerCase();
    if (pmLower === "npm" || pmLower === "yarn" || pmLower === "pnpm") {
      return ECOSYSTEMS.npm;
    } else if (pmLower === "composer") {
      return ECOSYSTEMS.packagist;
    }
  }
  return null;
});

const shouldShowWorkspaceSelector = computed(() => {
  // Show workspace selector only if there are multiple workspaces
  // (Some ecosystems like PHP typically have single workspace, JS can have multiple)
  return hasMultipleWorkspaces.value;
});

const shouldShowEcosystemFilter = computed(() => {
  // Show ecosystem filter when there are multiple ecosystems available
  return availableEcosystems.value.size > 1;
});

const ecosystemFilterOptions = computed(() => {
  const options = [];

  // Add "All" option
  options.push({
    value: null,
    label: "All Languages",
    ecosystem: null,
  });

  // Add options for each available ecosystem
  for (const ecosystemType of availableEcosystems.value) {
    const ecosystem = ECOSYSTEMS[ecosystemType as keyof typeof ECOSYSTEMS];
    if (ecosystem) {
      options.push({
        value: ecosystemType,
        label: ecosystem.name,
        ecosystem: ecosystem,
      });
    }
  }

  return options;
});

// Function to handle ecosystem filter changes
function handleEcosystemFilterChange(
  ecosystemType:
    | string
    | number
    | boolean
    | bigint
    | Record<string, unknown>
    | null,
): void {
  const value = typeof ecosystemType === "string" ? ecosystemType : null;
  selectedEcosystemFilter.value = value;
  void emit("ecosystem-filter-changed", value);
}

// Function to detect available ecosystems from executed SBOM plugins
function detectAvailableEcosystems(): void {
  const ecosystems = new Set<string>();

  // Map plugin names to ecosystems
  const pluginToEcosystem: Record<string, string> = {
    "js-sbom": "npm",
    "php-sbom": "packagist",
  };

  // If executedSbomPlugins is provided, use it directly without API calls
  for (const plugin of props.executedSbomPlugins) {
    const ecosystem = pluginToEcosystem[plugin];
    if (ecosystem) {
      ecosystems.add(ecosystem);
    }
  }

  availableEcosystems.value = ecosystems;
}

async function getSbomWorkspaces(): Promise<void> {
  if (!userStore.getDefaultOrg) return;
  if (!(authStore.getAuthenticated && authStore.getToken)) return;
  try {
    const res = await sbomRepo.getSbomWorkspaces({
      orgId: userStore.getDefaultOrg.id,
      projectId: props.projectID,
      analysisId: props.analysisID,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
    });
    workspaces.value = res.data;

    // Emit package manager information
    if (res.data.package_manager) {
      void emit("package-manager-loaded", res.data.package_manager);
    }
  } catch (_err) {
    console.error(_err);
    error.value = true;
    // if (_err instanceof BusinessLogicError) {
    //     errorCode.value = _err.error_code;
    // }
  }
}

onMounted(() => {
  detectAvailableEcosystems();
  void getSbomWorkspaces();
});
</script>

<template>
  <div class="flex items-center gap-6">
    <!-- Ecosystem filter (only shown when multiple ecosystems are available) -->
    <div v-if="shouldShowEcosystemFilter" class="flex items-center gap-2">
      <span class="text-sm font-medium text-gray-600">Filter by Language:</span>
      <Select
        :model-value="selectedEcosystemFilter"
        @update:model-value="handleEcosystemFilterChange"
      >
        <SelectTrigger class="w-[160px]">
          <SelectValue placeholder="All Languages" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Language Filter</SelectLabel>
            <SelectItem
              v-for="option in ecosystemFilterOptions"
              :key="option.value ?? 'all'"
              :value="option.value"
            >
              <div class="flex items-center gap-2">
                <EcosystemBadge
                  v-if="option.ecosystem"
                  :ecosystem="option.ecosystem"
                  size="xs"
                  variant="minimal"
                  :show-name="false"
                />
                <span v-else class="w-3 h-3 bg-gray-300 rounded-full"></span>
                {{ option.label }}
              </div>
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>

    <!-- Current ecosystem indicator (when single ecosystem or filter applied) -->
    <div
      v-else-if="ecosystem && !shouldShowEcosystemFilter"
      class="flex items-center gap-2"
    >
      <span class="text-sm font-medium text-gray-600">Language:</span>
      <EcosystemBadge :ecosystem="ecosystem" size="sm" variant="default" />
    </div>

    <!-- Workspace selector (only shown when there are multiple workspaces) -->
    <div v-if="shouldShowWorkspaceSelector" class="flex items-center gap-2">
      <span class="text-sm font-medium text-gray-600">Workspace:</span>
      <Select
        @update:model-value="
          (e: string | number | bigint | Record<string, any> | null) => {
            selected_workspace = e?.toString() ?? '';
          }
        "
      >
        <SelectTrigger class="w-[180px]">
          <SelectValue placeholder="Select a workspace" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Available Workspaces</SelectLabel>
            <SelectItem
              v-for="workspace of workspaces.workspaces"
              :key="workspace"
              :value="workspace"
            >
              {{ workspace === "." ? "Root" : workspace }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>

    <!-- Single workspace indicator (when only one workspace exists) -->
    <div
      v-else-if="workspaces.workspaces && workspaces.workspaces.length === 1"
      class="flex items-center gap-2"
    >
      <span class="text-sm font-medium text-gray-600">Workspace:</span>
      <span class="text-sm text-gray-800 bg-gray-100 px-2 py-1 rounded border">
        {{
          workspaces.workspaces[0] === "." ? "Root" : workspaces.workspaces[0]
        }}
      </span>
    </div>
  </div>
</template>

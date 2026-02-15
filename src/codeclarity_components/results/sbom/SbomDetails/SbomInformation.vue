<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { computed, type PropType } from "vue";

import { type DependencyDetails } from "@/codeclarity_components/results/sbom/SbomDetails/SbomDetails";
import { Badge } from "@/shadcn/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shadcn/ui/collapsible";
import { useAuthStore } from "@/stores/auth";
import {
  calculateDateDifference,
  formatRelativeTime,
  isValidDate,
} from "@/utils/dateUtils";
import {
  EcosystemDetector,
  EcosystemMetadataExtractor,
  PackageEcosystem,
} from "@/utils/packageEcosystem";

const authStore = useAuthStore();

const props = defineProps({
  dependency: {
    type: Object as PropType<DependencyDetails>,
    required: true,
  },
});

// Ecosystem detection
const ecosystem = computed(() => {
  return EcosystemDetector.detectFromDependency(props.dependency);
});

const ecosystemMetadata = computed(() => {
  return EcosystemMetadataExtractor.extractMetadata(
    props.dependency,
    ecosystem.value,
  );
});

// Computed properties for version management
const isLatestVersion = computed(() => {
  if (!authStore.getAuthenticated || !props.dependency.version) return true;
  return props.dependency.version === props.dependency.latest_version;
});

const isVersionOutdated = computed(() => {
  if (isLatestVersion.value) return false;
  if (!props.dependency.lastest_release_date) return false;
  const diffDays = calculateDateDifference(
    props.dependency.lastest_release_date,
    props.dependency.release_date,
    "days",
  );
  return diffDays > 182; // 6 months
});

const getVersionLag = (): string => {
  if (!authStore.getAuthenticated || !props.dependency.lastest_release_date)
    return "";
  const diffDays = calculateDateDifference(
    props.dependency.lastest_release_date,
    props.dependency.release_date,
    "days",
  );

  if (diffDays < 30) return `${diffDays} days`;
  if (diffDays < 365) return `${Math.round(diffDays / 30)} months`;
  return `${Math.round(diffDays / 365)} years`;
};

// Engine icon mapping
const getEngineIcon = (engineName: string): string => {
  const iconMap: Record<string, string> = {
    node: "akar-icons:node-fill",
    npm: "akar-icons:npm-fill",
    yarn: "akar-icons:yarn-fill",
    python: "akar-icons:python-fill",
    java: "skill-icons:java-dark",
    go: "skill-icons:golang",
    rust: "skill-icons:rust",
    php: "skill-icons:php-dark",
  };
  return iconMap[engineName.toLowerCase()] ?? "solar:cpu-bolt-bold";
};

// Package age calculations
const getPackageAge = (): string => {
  if (!props.dependency.release_date) return "Unknown";

  const diffDays = calculateDateDifference(
    new Date(),
    props.dependency.release_date,
    "days",
  );

  if (diffDays < 30) return `${diffDays} days old`;
  if (diffDays < 365) return `${Math.round(diffDays / 30)} months old`;
  return `${Math.round(diffDays / 365)} years old`;
};

const getAgeClass = (): string => {
  if (!props.dependency.release_date) return "unknown";

  const diffDays = calculateDateDifference(
    new Date(),
    props.dependency.release_date,
    "days",
  );

  if (diffDays < 90) return "fresh"; // < 3 months
  if (diffDays < 365) return "moderate"; // < 1 year
  if (diffDays < 730) return "old"; // < 2 years
  return "very-old"; // > 2 years
};

const getEcosystemUrl = (): string => {
  if (!ecosystem.value.website) return "";
  if (ecosystem.value.type === PackageEcosystem.PACKAGIST) {
    return `${ecosystem.value.website}/packages/${props.dependency.name}`;
  }
  return `${ecosystem.value.website}/package/${props.dependency.name}`;
};
</script>

<template>
  <div class="information-panel">
    <div class="top-grid">
      <!-- Section 1: Version & Release -->
      <div class="compact-card">
        <div class="compact-card-label">Version & Release</div>
        <div class="version-comparison">
          <div class="version-column">
            <div class="version-column-label">Current</div>
            <Badge variant="outline" class="version-badge current">
              {{ dependency.version }}
            </Badge>
            <div
              v-if="
                dependency.release_date && isValidDate(dependency.release_date)
              "
              class="version-date"
            >
              {{ formatRelativeTime(dependency.release_date) }}
            </div>
          </div>

          <div class="version-arrow">
            <Icon icon="solar:arrow-right-linear" />
          </div>

          <div class="version-column">
            <div class="version-column-label">Latest</div>
            <Badge variant="outline" class="version-badge latest">
              {{ dependency.latest_version }}
            </Badge>
            <div
              v-if="
                dependency.lastest_release_date &&
                isValidDate(dependency.lastest_release_date)
              "
              class="version-date"
            >
              {{ formatRelativeTime(dependency.lastest_release_date) }}
            </div>
          </div>
        </div>

        <div v-if="isLatestVersion" class="version-status-bar current">
          <Icon icon="solar:check-circle-bold" class="status-bar-icon" />
          <span>Using the latest version</span>
        </div>
        <div v-else-if="isVersionOutdated" class="version-status-bar outdated">
          <Icon icon="solar:clock-circle-bold" class="status-bar-icon" />
          <span>{{ getVersionLag() }} behind latest</span>
        </div>
        <div v-else class="version-status-bar minor-update">
          <Icon icon="solar:info-circle-bold" class="status-bar-icon" />
          <span>Update available ({{ dependency.latest_version }})</span>
        </div>
      </div>

      <!-- Section 2: Package Details -->
      <div class="compact-card">
        <div class="compact-card-label">Package Details</div>
        <div class="detail-rows">
          <!-- License -->
          <div class="detail-row">
            <div class="detail-row-left">
              <Icon icon="solar:document-text-bold" class="detail-row-icon" />
              <span class="detail-row-label">License</span>
            </div>
            <div class="detail-row-value">
              <Badge
                v-if="dependency.license && dependency.license !== ''"
                variant="outline"
                class="license-badge valid"
              >
                {{ dependency.license }}
              </Badge>
              <Badge v-else variant="destructive">
                <Icon icon="solar:danger-triangle-bold" class="mr-1" />
                Unlicensed
              </Badge>
            </div>
          </div>

          <!-- Release Age -->
          <div class="detail-row">
            <div class="detail-row-left">
              <Icon icon="solar:calendar-bold" class="detail-row-icon" />
              <span class="detail-row-label">Release Age</span>
            </div>
            <div class="detail-row-value">
              <span class="age-dot" :class="getAgeClass()"></span>
              <span :class="['age-value', getAgeClass()]">
                {{ getPackageAge() }}
              </span>
            </div>
          </div>

          <!-- Ecosystem -->
          <div class="detail-row">
            <div class="detail-row-left">
              <Icon
                :icon="ecosystem.icon"
                class="detail-row-icon"
                :style="{ color: ecosystem.color }"
              />
              <span class="detail-row-label">Ecosystem</span>
            </div>
            <div class="detail-row-value">
              <a
                v-if="ecosystem.website"
                :href="getEcosystemUrl()"
                target="_blank"
                class="ecosystem-link"
              >
                {{ ecosystem.name }}
                <Icon
                  icon="solar:external-link-linear"
                  class="external-link-icon"
                />
              </a>
              <span v-else class="text-sm">{{ ecosystem.name }}</span>
            </div>
          </div>

          <!-- Engine Support -->
          <div
            v-if="
              dependency.engines && Object.keys(dependency.engines).length > 0
            "
            class="detail-row"
          >
            <div class="detail-row-left">
              <Icon icon="solar:cpu-bolt-bold" class="detail-row-icon" />
              <span class="detail-row-label">Engines</span>
            </div>
            <div class="detail-row-value engines-value">
              <Badge
                v-for="(value, key) in dependency.engines"
                :key="key"
                variant="outline"
                class="engine-badge"
              >
                <Icon
                  :icon="getEngineIcon(String(key))"
                  class="engine-badge-icon"
                />
                {{ String(key).charAt(0).toUpperCase() + String(key).slice(1) }}
                {{ value }}
              </Badge>
            </div>
          </div>

          <!-- Compatible Tools -->
          <div v-if="ecosystem.tools.length > 0" class="detail-row">
            <div class="detail-row-left">
              <Icon icon="solar:box-bold" class="detail-row-icon" />
              <span class="detail-row-label">Tools</span>
            </div>
            <div class="detail-row-value">
              <Badge
                v-for="tool in ecosystem.tools"
                :key="tool"
                variant="outline"
                class="tool-badge"
              >
                {{ tool }}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 3: Ecosystem Metadata (collapsible, conditional) -->
    <Collapsible
      v-if="Object.keys(ecosystemMetadata).length > 0"
      v-slot="{ open }"
      class="compact-card metadata-card"
    >
      <CollapsibleTrigger class="metadata-trigger">
        <div class="compact-card-label clickable">
          <Icon
            :icon="ecosystem.icon"
            :style="{ color: ecosystem.color }"
            class="metadata-label-icon"
          />
          {{ ecosystem.language }} Metadata
        </div>
        <Icon
          :icon="
            open ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'
          "
          class="metadata-chevron"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="metadata-content">
          <!-- PHP Composer specific metadata -->
          <template v-if="ecosystem.type === 'packagist'">
            <div v-if="ecosystemMetadata['type']" class="flex flex-col gap-2">
              <span class="text-sm font-semibold text-gray-700">Type:</span>
              <Badge variant="outline" class="w-fit text-xs">
                {{ ecosystemMetadata["type"] }}
              </Badge>
            </div>
            <div
              v-if="ecosystemMetadata['autoload']"
              class="flex flex-col gap-2"
            >
              <span class="text-sm font-semibold text-gray-700">
                Autoload:
              </span>
              <code
                class="font-mono text-xs bg-gray-100 p-2 rounded border border-gray-200 whitespace-pre-wrap max-h-32 overflow-y-auto"
              >
                {{ JSON.stringify(ecosystemMetadata["autoload"], null, 2) }}
              </code>
            </div>
            <div
              v-if="
                ecosystemMetadata['suggest'] &&
                Object.keys(ecosystemMetadata['suggest']).length > 0
              "
              class="flex flex-col gap-2"
            >
              <span class="text-sm font-semibold text-gray-700">
                Suggested packages:
              </span>
              <div class="flex flex-col gap-2 max-h-24 overflow-y-auto">
                <div
                  v-for="(reason, pkg) in ecosystemMetadata['suggest']"
                  :key="pkg"
                  class="flex justify-between items-center p-1.5 bg-gray-50 rounded border border-gray-200"
                >
                  <code class="font-mono text-xs font-semibold text-blue-600">
                    {{ pkg }}
                  </code>
                  <span
                    class="text-xs text-gray-600 text-right max-w-60 wrap-break-word"
                  >
                    {{ reason }}
                  </span>
                </div>
              </div>
            </div>
          </template>

          <!-- NPM specific metadata -->
          <template v-if="ecosystem.type === 'npm'">
            <div
              v-if="
                Array.isArray(ecosystemMetadata['keywords']) &&
                ecosystemMetadata['keywords'].length > 0
              "
              class="flex flex-col gap-2"
            >
              <span class="text-sm font-semibold text-gray-700">
                Keywords:
              </span>
              <div class="flex flex-wrap gap-1">
                <Badge
                  v-for="keyword in ecosystemMetadata['keywords']"
                  :key="keyword"
                  variant="outline"
                  class="text-xs"
                >
                  {{ keyword }}
                </Badge>
              </div>
            </div>
            <div
              v-if="ecosystemMetadata['engines']"
              class="flex flex-col gap-2"
            >
              <span class="text-sm font-semibold text-gray-700">
                Engines:
              </span>
              <code
                class="font-mono text-xs bg-gray-100 p-2 rounded border border-gray-200 whitespace-pre-wrap max-h-32 overflow-y-auto"
              >
                {{ JSON.stringify(ecosystemMetadata["engines"], null, 2) }}
              </code>
            </div>
            <div
              v-if="
                ecosystemMetadata['peerDependencies'] &&
                Object.keys(ecosystemMetadata['peerDependencies']).length > 0
              "
              class="flex flex-col gap-2"
            >
              <span class="text-sm font-semibold text-gray-700">
                Peer Dependencies:
              </span>
              <div class="flex flex-col gap-2 max-h-24 overflow-y-auto">
                <div
                  v-for="(version, pkg) in ecosystemMetadata[
                    'peerDependencies'
                  ]"
                  :key="pkg"
                  class="flex justify-between items-center p-1.5 bg-gray-50 rounded border border-gray-200"
                >
                  <code class="font-mono text-xs font-semibold text-blue-600">
                    {{ pkg }}
                  </code>
                  <span class="text-xs text-gray-600">{{ version }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </CollapsibleContent>
    </Collapsible>
  </div>
</template>

<style scoped lang="scss">
.information-panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.top-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

/* Compact card base */
.compact-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
}

/* Lightweight section label */
.compact-card-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  margin-bottom: 0.75rem;
}

/* ========== VERSION COMPARISON ========== */
.version-comparison {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
}

.version-column {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.version-column-label {
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #9ca3af;
}

.version-badge {
  font-family: "SF Mono", "Monaco", "Consolas", monospace;
  font-weight: 600;
  font-size: 0.85rem;
  align-self: flex-start;

  &.current {
    background: rgba(75, 85, 99, 0.1);
    border-color: #6b7280;
    color: #374151;
  }

  &.latest {
    background: rgba(29, 206, 121, 0.1);
    border-color: rgba(29, 206, 121, 0.3);
    color: var(--color-theme-primary);
  }
}

.version-date {
  font-size: 0.75rem;
  color: var(--color-theme-gray);
}

.version-arrow {
  display: flex;
  align-items: center;
  padding-top: 1.25rem;
  color: #d1d5db;
  font-size: 1.25rem;
}

/* Version status bar */
.version-status-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  margin-top: 0.75rem;
  font-size: 0.8rem;
  font-weight: 500;

  .status-bar-icon {
    font-size: 0.875rem;
  }

  &.current {
    background: rgba(29, 206, 121, 0.08);
    color: var(--color-theme-primary);
  }

  &.outdated {
    background: rgba(245, 158, 11, 0.08);
    color: #d97706;
  }

  &.minor-update {
    background: rgba(59, 130, 246, 0.06);
    color: #3b82f6;
  }
}

/* ========== DETAIL KEY-VALUE ROWS ========== */
.detail-rows {
  display: flex;
  flex-direction: column;
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0;
  border-bottom: 1px solid #f3f4f6;
  gap: 1rem;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-child {
    padding-top: 0;
  }
}

.detail-row-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.detail-row-icon {
  font-size: 0.875rem;
  color: #6b7280;
}

.detail-row-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
}

.detail-row-value {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

/* License badge */
.license-badge {
  font-weight: 600;
  font-size: 0.8rem;

  &.valid {
    background: rgba(29, 206, 121, 0.1);
    border-color: rgba(29, 206, 121, 0.3);
    color: var(--color-theme-primary);
  }
}

/* Age dot indicator */
.age-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &.fresh {
    background: var(--color-theme-primary);
  }

  &.moderate {
    background: #f59e0b;
  }

  &.old {
    background: #ef4444;
  }

  &.very-old {
    background: #dc2626;
  }

  &.unknown {
    background: #9ca3af;
  }
}

.age-value {
  font-weight: 600;
  font-size: 0.85rem;

  &.fresh {
    color: var(--color-theme-primary);
  }

  &.moderate {
    color: #f59e0b;
  }

  &.old {
    color: #ef4444;
  }

  &.very-old {
    color: #dc2626;
  }

  &.unknown {
    color: #9ca3af;
  }
}

/* Ecosystem link */
.ecosystem-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-theme-primary);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.85rem;

  &:hover {
    text-decoration: underline;
  }

  .external-link-icon {
    font-size: 0.75rem;
    opacity: 0.7;
  }
}

/* Engine badges */
.engine-badge {
  font-family: "SF Mono", "Monaco", "Consolas", monospace;
  font-size: 0.75rem;
  gap: 0.25rem;
}

.engine-badge-icon {
  font-size: 0.75rem;
}

.tool-badge {
  font-size: 0.7rem;
}

/* ========== COLLAPSIBLE METADATA ========== */
.metadata-card {
  padding: 0;
}

.metadata-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 8px;

  &:hover {
    background: rgba(0, 0, 0, 0.02);
  }
}

.compact-card-label.clickable {
  margin-bottom: 0;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
}

.metadata-label-icon {
  font-size: 0.875rem;
}

.metadata-chevron {
  font-size: 0.875rem;
  color: #9ca3af;
  transition: transform 0.2s ease;
}

.metadata-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 1rem 1rem 1rem;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 640px) {
  .version-comparison {
    flex-direction: column;
    gap: 0.75rem;
  }

  .version-arrow {
    transform: rotate(90deg);
    padding-top: 0;
    align-self: center;
  }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.375rem;
  }

  .detail-row-value {
    justify-content: flex-start;
  }
}
</style>

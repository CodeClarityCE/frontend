<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import type { PropType } from "vue";

import { type DependencyDetails } from "@/codeclarity_components/results/sbom/SbomDetails/SbomDetails";
import { Badge } from "@/shadcn/ui/badge";

defineProps({
  dependency: {
    type: Object as PropType<DependencyDetails>,
    required: true,
  },
});
</script>

<template>
  <div class="sbom-header">
    <div class="package-title-section">
      <div class="package-name-version">
        <h1 class="package-name">{{ dependency.name }}</h1>
        <span class="package-version">@{{ dependency.version }}</span>
      </div>
    </div>

    <div class="external-links">
      <Badge variant="secondary" class="link-badge">
        <a
          :href="`https://www.npmjs.com/package/${dependency.name}/v/${dependency.version}`"
          target="_blank"
          class="link-content"
          title="View on NPM (opens in new tab)"
        >
          <Icon :icon="'akar-icons:npm-fill'" class="link-icon"></Icon>
          <span>NPM</span>
        </a>
      </Badge>

      <Badge variant="secondary" class="link-badge">
        <a
          :href="`https://yarnpkg.com/package?name=${dependency.name}&version=${dependency.version}`"
          target="_blank"
          class="link-content"
          title="View on Yarn (opens in new tab)"
        >
          <Icon :icon="'akar-icons:yarn-fill'" class="link-icon"></Icon>
          <span>Yarn</span>
        </a>
      </Badge>

      <Badge v-if="dependency.source" variant="secondary" class="link-badge">
        <a
          v-if="dependency.source.Type === 'git'"
          :href="`${dependency.source.Url.replace('git+', '')}`"
          target="_blank"
          class="link-content"
          title="View repository (opens in new tab)"
        >
          <div
            v-if="dependency.source.Url.includes('github')"
            class="link-content"
          >
            <Icon :icon="'akar-icons:github-fill'" class="link-icon"></Icon>
            <span>GitHub</span>
          </div>
          <div
            v-else-if="dependency.source.Url.includes('gitlab')"
            class="link-content"
          >
            <Icon :icon="'akar-icons:gitlab-fill'" class="link-icon"></Icon>
            <span>GitLab</span>
          </div>
        </a>
      </Badge>
    </div>
  </div>
</template>

<style scoped lang="scss">
.sbom-header {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.package-title-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.package-name-version {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.package-name {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-theme-black);
  margin: 0;
  word-break: break-word;
  line-height: 1.1;

  @media (max-width: 768px) {
    font-size: 1.75rem;
  }
}

.package-version {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-theme-primary);

  @media (max-width: 768px) {
    font-size: 1.125rem;
  }
}

.external-links {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.link-badge {
  border-radius: 6px;
  transition: all 0.15s ease-in-out;

  &:hover {
    background: var(--color-theme-primary);
    color: white;
    transform: translateY(-1px);
  }
}

.link-content {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  text-decoration: none;
  color: inherit;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.15s ease-in-out;

  &:hover {
    color: inherit;
  }
}

.link-icon {
  font-size: 1rem;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .package-name-version {
    flex-direction: column;
    gap: 0.25rem;
    align-items: flex-start;
  }

  .external-links {
    gap: 0.5rem;
  }
}
</style>

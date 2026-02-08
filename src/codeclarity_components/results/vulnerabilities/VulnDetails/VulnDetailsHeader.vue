<script setup lang="ts">
import { Icon } from "@iconify/vue";

import type PositionedModalVue from "@/base_components/ui/modals/PositionedModal.vue";
import type { VulnerabilityDetails } from "@/codeclarity_components/results/vulnerabilities/VulnDetails/VulnDetails";
defineProps<{
  finding: VulnerabilityDetails;
  versionsModalRef: typeof PositionedModalVue;
}>();
</script>

<template>
  <div class="header flex flex-col gap-5 bg-white shadow-md rounded-lg p-6">
    <!--------------------------------------------------------------------------->
    <!--                           Vulnerability id                            -->
    <!--------------------------------------------------------------------------->
    <div class="text-3xl font-black text-gray-800">
      <div>{{ finding.vulnerability_info.vulnerability_id }}</div>
    </div>

    <!--------------------------------------------------------------------------->
    <!--                      Vulnerability type in library                    -->
    <!--------------------------------------------------------------------------->
    <div class="text-3xl my-1 text-gray-700">
      <span v-if="finding.weaknesses.length > 0">{{
        finding.weaknesses[0]?.name
      }}</span>
      in
      <span class="font-black text-theme-primary">
        {{
          finding.dependency_info?.name + "@" + finding.dependency_info?.version
        }}
      </span>
    </div>

    <!--------------------------------------------------------------------------->
    <!--                      Affected and patched versions                    -->
    <!--------------------------------------------------------------------------->
    <div class="text-gray-600">
      <!--------------------------------------------------------------------------->
      <!--                              Affected versions                        -->
      <!--------------------------------------------------------------------------->
      <!-- Show simple version when sources agree -->
      <div
        v-if="
          !finding.vulnerability_info.version_info.source_comparison ||
          finding.vulnerability_info.version_info.source_comparison.agree
        "
      >
        <span class="font-black">
          Affected versions of {{ finding.dependency_info?.name }}:
        </span>
        {{ finding.vulnerability_info.version_info.affected_versions_string }}
        <span
          v-if="
            finding.vulnerability_info.version_info.affected_versions_source
          "
          class="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
        >
          source:
          {{ finding.vulnerability_info.version_info.affected_versions_source }}
        </span>
      </div>
      <!-- Show detailed breakdown when sources disagree -->
      <div v-else class="space-y-3">
        <div
          class="flex gap-2 items-center text-orange-600 bg-orange-50 p-3 rounded-lg border-l-4 border-orange-400"
        >
          <Icon icon="tabler:alert-triangle-filled" class="text-lg"></Icon>
          <span class="font-black"
            >Vulnerability sources disagree on your version</span
          >
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4 ml-2">
          <!-- NVD Source -->
          <div
            v-if="
              finding.vulnerability_info.version_info.source_comparison
                .nvdReason
            "
            class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400"
          >
            <div class="flex items-center gap-2 mb-3">
              <Icon icon="tabler:database" class="text-blue-600"></Icon>
              <span class="font-bold text-blue-800">NVD says:</span>
            </div>
            <div class="text-sm text-blue-700 leading-relaxed mb-3">
              {{
                finding.vulnerability_info.version_info.source_comparison
                  .nvdReason
              }}
            </div>

            <!-- Expandable technical details -->
            <details class="mt-2">
              <summary
                class="cursor-pointer text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                View all affected versions
              </summary>
              <div
                class="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-800 font-mono whitespace-pre-line"
              >
                {{
                  finding.vulnerability_info.version_info.source_comparison.nvdAllVersions?.replace(
                    /, /g,
                    ",\n",
                  ) ?? ""
                }}
              </div>
            </details>
          </div>

          <!-- OSV Source -->
          <div
            v-if="
              finding.vulnerability_info.version_info.source_comparison
                .osvReason
            "
            class="bg-green-50 p-4 rounded-lg border-l-4 border-green-400"
          >
            <div class="flex items-center gap-2 mb-3">
              <Icon icon="tabler:shield-check" class="text-green-600"></Icon>
              <span class="font-bold text-green-800">OSV says:</span>
            </div>
            <div class="text-sm text-green-700 leading-relaxed mb-3">
              {{
                finding.vulnerability_info.version_info.source_comparison
                  .osvReason
              }}
            </div>

            <!-- Expandable technical details -->
            <details class="mt-2">
              <summary
                class="cursor-pointer text-xs text-green-600 hover:text-green-800 font-medium"
              >
                View all affected versions
              </summary>
              <div
                class="mt-2 p-2 bg-green-100 rounded text-xs text-green-800 font-mono whitespace-pre-line"
              >
                {{
                  finding.vulnerability_info.version_info.source_comparison.osvAllVersions?.replace(
                    /, /g,
                    ",\n",
                  ) ?? ""
                }}
              </div>
            </details>
          </div>

          <!-- GCVE Source -->
          <div
            v-if="
              finding.vulnerability_info.version_info.source_comparison
                .gcveReason
            "
            class="bg-violet-50 p-4 rounded-lg border-l-4 border-violet-400"
          >
            <div class="flex items-center gap-2 mb-3">
              <Icon icon="tabler:certificate" class="text-violet-600"></Icon>
              <span class="font-bold text-violet-800">GCVE says:</span>
            </div>
            <div class="text-sm text-violet-700 leading-relaxed mb-3">
              {{
                finding.vulnerability_info.version_info.source_comparison
                  .gcveReason
              }}
            </div>

            <!-- Expandable technical details -->
            <details class="mt-2">
              <summary
                class="cursor-pointer text-xs text-violet-600 hover:text-violet-800 font-medium"
              >
                View all affected versions
              </summary>
              <div
                class="mt-2 p-2 bg-violet-100 rounded text-xs text-violet-800 font-mono whitespace-pre-line"
              >
                {{
                  finding.vulnerability_info.version_info.source_comparison.gcveAllVersions?.replace(
                    /, /g,
                    ",\n",
                  ) ?? ""
                }}
              </div>
            </details>
          </div>
        </div>

        <div class="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
          <div class="flex items-center gap-2 mb-1">
            <Icon icon="tabler:info-circle" class="text-yellow-600"></Icon>
            <span class="font-semibold text-yellow-800">Recommendation</span>
          </div>
          <div class="text-sm text-yellow-700">
            Since sources disagree on your version
            <strong>{{ finding.dependency_info?.version }}</strong
            >, review the explanations above and check the official advisory
            links to determine your actual risk.
          </div>
        </div>
      </div>
      <div
        v-if="
          finding.vulnerability_info.version_info.affected_versions_string ===
            '*' ||
          finding.vulnerability_info.version_info.affected_versions_string
            ?.toLowerCase()
            .trim() === 'all versions'
        "
        class="flex gap-1 items-center text-orange-600 bg-orange-50 p-2 rounded-lg mt-2"
      >
        <Icon icon="tabler:alert-triangle-filled" class="shrink-0"></Icon>
        <span>
          The affected version information is imprecise ("all versions"). This
          may be a false positive — check the official advisory links for
          accurate version ranges.
        </span>
      </div>
    </div>
  </div>
</template>

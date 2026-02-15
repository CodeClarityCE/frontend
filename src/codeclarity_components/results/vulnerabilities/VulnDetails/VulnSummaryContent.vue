<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed } from "vue";

import BubbleComponent from "@/base_components/data-display/bubbles/BubbleComponent.vue";
import InfoMarkdown from "@/base_components/ui/InfoMarkdown.vue";
import type { VulnerabilityDetails } from "@/codeclarity_components/results/vulnerabilities/VulnDetails/VulnDetails";
import { formatDate } from "@/utils/dateUtils";

const props = defineProps<{
  finding: VulnerabilityDetails;
}>();

const SOURCE_ORDER: Record<string, number> = { GCVE: 0, OSV: 1, NVD: 2 };

const sortedSources = computed(() =>
  [...(props.finding.vulnerability_info.sources ?? [])].sort(
    (a, b) => (SOURCE_ORDER[a.name] ?? 99) - (SOURCE_ORDER[b.name] ?? 99),
  ),
);
</script>

<template>
  <div class="flex flex-col gap-8">
    <!--------------------------------------------------------------------------->
    <!--                         Vulnerability description                     -->
    <!--------------------------------------------------------------------------->
    <div>
      <div class="flex flex-col gap-5">
        <h2 class="font-black text-xl text-gray-800">
          <span class="text-primary text-3xl">V</span>ulnerability Information
        </h2>
        <div>
          <div class="w-full">
            <div class="flex flex-col gap-2 mb-5 max-w-96 w-full">
              <div>
                <span class="font-normal text-gray-600">Published:</span>
                {{ formatDate(finding.vulnerability_info.published, "LL") }}
              </div>
              <div>
                <span class="font-normal text-gray-600">Last modified:</span>
                {{ formatDate(finding.vulnerability_info.last_modified, "LL") }}
              </div>
              <div class="flex flex-row items-center gap-2">
                <div class="font-normal text-gray-600">Aliases:</div>
                <div class="flex gap-2 text-sm">
                  <div
                    v-for="alias in finding.vulnerability_info.aliases"
                    :key="alias"
                  >
                    <BubbleComponent :slim="true">
                      <template #content>{{ alias }}</template>
                    </BubbleComponent>
                  </div>
                </div>
              </div>
              <div>
                <div class="flex flex-row items-center gap-2">
                  <div class="font-normal text-gray-600">Sources:</div>
                  <div class="flex gap-2 text-sm">
                    <div v-for="source in sortedSources" :key="source.name">
                      <BubbleComponent :slim="true">
                        <template #content>
                          <a :href="source.vuln_url" target="_blank">{{
                            source.name
                          }}</a>
                        </template>
                      </BubbleComponent>
                    </div>
                  </div>
                </div>
                <div
                  v-if="
                    finding.vulnerability_info.version_info.source_comparison &&
                    !finding.vulnerability_info.version_info.source_comparison
                      .agree
                  "
                  class="text-severity-medium flex gap-1 items-center"
                >
                  <Icon icon="tabler:alert-triangle-filled"></Icon>
                  Vulnerability sources do not fully agree on affected versions
                </div>
              </div>
            </div>
            <div class="text-sm font-normal">Description</div>
            <div class="overflow-y-auto">
              <InfoMarkdown
                class="w-full"
                :markdown="finding.vulnerability_info.description"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!--------------------------------------------------------------------------->
    <!--                        Vulnerability weakness info                    -->
    <!--------------------------------------------------------------------------->
    <div>
      <div
        v-if="
          (!finding.weaknesses || finding.weaknesses.length === 0) &&
          !finding.owasp_top_10
        "
      >
        <div class="flex flex-col gap-5">
          <h2 class="text-xl">
            <span class="text-primary text-3xl">W</span>eakness information
          </h2>
          <div>
            No information on weaknesess. If the vulnerability has only recently
            been published, then information on weaknesses may follow soon.
          </div>
        </div>
      </div>

      <div v-else class="flex">
        <div class="flex flex-col gap-5">
          <h2 class="font-black text-xl">
            <span class="text-primary text-3xl">W</span>eakness information
          </h2>
          <div class="relative w-full">
            <div class="mb-4">
              The following aims to provide details on the type of flaw within
              the dependency that enables the exploitation.
            </div>
            <div class="flex flex-col gap-8">
              <div v-if="finding.owasp_top_10">
                <div class="flex flex-col gap-y-2">
                  <div class="flex gap-2 items-center font-black">
                    <Icon :icon="'simple-icons:owasp'"></Icon>
                    <div class="flex items-center gap-1">
                      Owasp Top 10 2021
                      <Icon :icon="'material-symbols:help-outline'"></Icon>
                    </div>
                  </div>
                  <div class="font-normal">
                    {{ finding.owasp_top_10.name }}
                  </div>
                  <div>
                    {{ finding.owasp_top_10.description }}
                  </div>
                  <div class="mt-2">
                    <a
                      class="flex items-center gap-1 text-primary"
                      title="View owasp top 10 details (opens a owasp.org page)"
                      :href="`https://owasp.org/Top10/${finding.owasp_top_10.name
                        .replace(': ', '_2021-')
                        .replace(' ', '_')}`"
                      target="_blank"
                    >
                      <Icon :icon="'ic:outline-open-in-new'"></Icon>
                      Owasp Top 10 Category Details
                    </a>
                  </div>
                </div>
              </div>

              <div v-if="finding.weaknesses.length > 0">
                <div class="flex flex-col gap-4">
                  <div class="flex flex-row items-center gap-2 font-black">
                    Common Weakness Enumeration (CWE)
                    <Icon :icon="'material-symbols:help-outline'"></Icon>
                  </div>
                  <div
                    v-for="weakness in finding.weaknesses"
                    :key="weakness.id"
                    class="flex flex-col gap-2"
                  >
                    <div class="flex flex-col gap-y-2">
                      <div class="font-normal">
                        {{ weakness.id }} -
                        {{ weakness.name }}
                      </div>
                      <div>
                        {{ weakness.description }}
                      </div>
                    </div>

                    <div>
                      <div
                        v-if="
                          weakness.id in finding.common_consequences &&
                          (finding.common_consequences[weakness.id]?.length ??
                            0) > 0
                        "
                        class="mt-4"
                      >
                        <span>Potential Consequences: </span>
                        <span
                          >{{
                            finding.common_consequences[weakness.id]
                              ?.map((conseq: any) => conseq.impact.join(", "))
                              .join("; ")
                          }}.</span
                        >
                      </div>
                    </div>

                    <div class="mt-2">
                      <a
                        class="flex flex-row items-center gap-2 text-primary"
                        title="View cwe details (opens a mitre.org page)"
                        :href="`https://cwe.mitre.org/data/definitions/${weakness.id.replace(
                          'CWE-',
                          '',
                        )}`"
                        target="_blank"
                      >
                        <Icon :icon="'ic:outline-open-in-new'"></Icon>
                        CWE Details
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/common/finding-patch.scss";
</style>

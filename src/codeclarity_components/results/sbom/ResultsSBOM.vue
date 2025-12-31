<script lang="ts" setup>
import { computed, onUpdated, type Ref, ref, watch } from "vue";

import {
  type Analysis,
  AnalysisStatus,
} from "@/codeclarity_components/analyses/analysis.entity";
import { type Project } from "@/codeclarity_components/projects/project.entity";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";

import SbomContent from "./SbomContent.vue";

// Import stores

const props = defineProps<{
  analysis: Analysis;
  project: Project;
  runIndex?: number | null;
}>();

// Compute which SBOM plugins were successfully executed
const executedSbomPlugins = computed(() => {
  const plugins: string[] = [];
  for (const step of props.analysis.steps) {
    for (const result of step) {
      if (result.Status === AnalysisStatus.SUCCESS) {
        if (result.Name === "js-sbom" || result.Name === "php-sbom") {
          plugins.push(result.Name);
        }
      }
    }
  }
  return plugins;
});

const bill_of_materials = ref([]);
const details = ref(false);
let y_position = 0;
const reference_click_element: Ref<string> = ref("");
const is_loading = ref(true);
const only_details = ref(false);

// DATA FOR THE FILTER COMPONENT
const activeTab = ref("SBOM");

onUpdated(() => {
  const mainContainer = document.getElementById("main-container");
  if (mainContainer) {
    mainContainer.scrollTop = 0;
  }
  setTimeout(() => {
    if (y_position !== 0 && details.value === false)
      if (mainContainer) {
        mainContainer.scrollTop = y_position;
      }
  }, 50);
});

watch(activeTab, async (newTab, oldTab) => {
  if (newTab !== oldTab) {
    y_position = 0;
    reference_click_element.value = "";
  }
});
</script>

<template>
  <div
    v-show="!details"
    v-if="!only_details"
    id="main-container"
    class="w-full flex flex-col gap-14"
  >
    <template
      v-if="
        (bill_of_materials === null || bill_of_materials.length === 0) &&
        !is_loading
      "
    >
      <div style="margin-bottom: 100px">
        <Alert>
          <AlertDescription>
            <div class="title">
              <i class="fa-solid fa-circle-info"></i>
              No dependencies in your project
            </div>
            <div class="content">
              <div class="error-box">
                We did not find any dependencies in your project. This could be
                a failure of our analyzer or it could be because the project
                does not have the required files.<br /><br />

                A project needs to contain the following files:
                <ul>
                  <li>
                    a package manifest:
                    <a
                      href="https://docs.npmjs.com/cli/v9/configuring-npm/package-json"
                      target="_blank"
                      style="color: var(--accent)"
                      >package.json
                      <i class="fa-solid fa-arrow-up-right-from-square"></i
                    ></a>
                  </li>
                  <li>
                    <div
                      style="
                        display: flex;
                        flex-direction: row;
                        align-items: center;
                        column-gap: 5px;
                      "
                    >
                      a lockfile:
                      <i
                        class="fa-brands fa-yarn"
                        style="color: lightblue; width: 25px; height: 25px"
                      >
                      </i>
                      <a
                        href="https://classic.yarnpkg.com/lang/en/docs/yarn-lock/"
                        target="_blank"
                        style="color: var(--accent)"
                        >yarn.lock
                        <i
                          class="fa-solid fa-arrow-up-right-from-square"
                          style="font-size: 0.7em"
                        ></i
                      ></a>
                      or
                      <i
                        class="fa-brands fa-npm"
                        style="color: red; width: 25px; height: 25px"
                      ></i>
                      <a
                        href="https://docs.npmjs.com/cli/v9/configuring-npm/package-lock-json"
                        target="_blank"
                        style="color: var(--accent)"
                        >package-lock.json
                        <i
                          class="fa-solid fa-arrow-up-right-from-square"
                          style="font-size: 0.7em"
                        ></i
                      ></a>
                    </div>
                  </li>
                </ul>

                these two files need to be located at the same level in the file
                tree of your project.<br /><br />

                In case your project has the required files, but stills fails to
                be analyzed, then please accept our apologies for the
                inconvenience. Since our product is still in the beta phase, you
                can help us iron out the issues by contacting us under:
                <a
                  href="mailto:help@codeclarity.io"
                  style="color: var(--accent)"
                  >help@codeclarity.io</a
                >
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </template>

    <SbomContent
      :analysis-i-d="analysis.id"
      :project-i-d="project.id"
      :project-name="project.name"
      :executed-sbom-plugins="executedSbomPlugins"
    ></SbomContent>
  </div>
</template>

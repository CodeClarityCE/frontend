<script lang="ts" setup>
import { type Analysis } from "@/codeclarity_components/analyses/analysis.entity";
import { type Project } from "@/codeclarity_components/projects/project.entity";
import { Alert, AlertDescription, AlertTitle } from "@/shadcn/ui/alert";
import { Card, CardContent, CardHeader } from "@/shadcn/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import { onMounted, onUpdated, ref, watch, type Ref } from "vue";
import VulnContent from "./VulnContent.vue";
import List from "./VulnList.vue";
import Table from "./VulnTable.vue";
// Import stores

defineProps<{
  analysis: Analysis;
  project: Project;
  runIndex?: number | null;
}>();

const no_deps = false;

const active_tab = ref("List");

const selected_workspace: Ref<string> = ref(".");
const selectedEcosystemFilter: Ref<string | null> = ref(null);
const showBlacklistedVulns: Ref<boolean> = ref(false);

// VIEW DATA
const details = ref(false);
let y_position = 0;
const reference_click_element = ref("");

onMounted(() => {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.style.display = "none";
  }
});

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

watch(active_tab, async (newTab, oldTab) => {
  if (newTab !== oldTab) {
    y_position = 0;
    reference_click_element.value = "";
  }
});
</script>

<template>
  <div
    v-show="!details"
    id="main-container"
    class="w-full flex flex-col gap-14"
  >
    <template v-if="no_deps">
      <div style="margin-bottom: 100px">
        <Alert>
          <AlertTitle>No dependencies in your project</AlertTitle>
          <AlertDescription>
            We did not find any dependencies in your project. This could be a
            failure of our analyzer or it could be because the project does not
            have the required files.<br /><br />

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
                  ></i>
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

            In case your project has the required files, but stills fails to be
            analyzed, then please accept our apologies for the inconvenience.
            Since our product is still in the beta phase, you can help us iron
            out the issues by contacting us under:
            <a href="mailto:help@codeclarity.io" style="color: var(--accent)"
              >help@codeclarity.io</a
            >
          </AlertDescription>
        </Alert>
      </div>
    </template>

    <VulnContent
      v-model:selected_workspace="selected_workspace"
      :analysis-i-d="analysis.id"
      :project-i-d="project.id"
      @ecosystem-filter-changed="
        (filter: string | null) => (selectedEcosystemFilter = filter)
      "
    ></VulnContent>
    <Card>
      <CardHeader class="pb-2">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold">Vulnerabilities</h3>
            <p class="text-sm text-gray-600">
              Security vulnerabilities found in your project dependencies
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs default-value="list" class="space-y-4">
          <TabsList>
            <TabsTrigger value="list"> List </TabsTrigger>
            <TabsTrigger value="table"> Table </TabsTrigger>
          </TabsList>
          <TabsContent value="list" class="space-y-4">
            <List
              ref="list_ref"
              v-model:selected_workspace="selected_workspace"
              :highlight-elem="reference_click_element"
              :page-limit="20"
              :force-open-new-tab="false"
              :analysis-i-d="analysis.id"
              :project-i-d="project.id"
              :ecosystem-filter="selectedEcosystemFilter"
              :show-blacklisted="showBlacklistedVulns"
              @update:show-blacklisted="showBlacklistedVulns = $event"
            />
          </TabsContent>
          <TabsContent value="table" class="space-y-4">
            <Table
              ref="table_ref"
              v-model:selected_workspace="selected_workspace"
              :highlight-elem="reference_click_element"
              :force-open-new-tab="false"
              :analysis-i-d="analysis.id"
              :project-i-d="project.id"
              :ecosystem-filter="selectedEcosystemFilter"
              :show-blacklisted="showBlacklistedVulns"
              @update:show-blacklisted="showBlacklistedVulns = $event"
            ></Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </div>
</template>

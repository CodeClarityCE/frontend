<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import type { PatchInfo } from "@/codeclarity_components/results/patching/Patching";
import Badge from "@/shadcn/ui/badge/Badge.vue";
import Card from "@/shadcn/ui/card/Card.vue";
import CardContent from "@/shadcn/ui/card/CardContent.vue";
import Tabs from "@/shadcn/ui/tabs/Tabs.vue";
import TabsContent from "@/shadcn/ui/tabs/TabsContent.vue";
import TabsList from "@/shadcn/ui/tabs/TabsList.vue";
import TabsTrigger from "@/shadcn/ui/tabs/TabsTrigger.vue";
import PatchInformation from "./PatchInformation.vue";

export interface Props {
  patch: PatchInfo;
  name: string | number;
  type: string;
}

withDefaults(defineProps<Props>(), {});

// function computeTree() {
//     if (props.patch && props.patch.patches) {
//         let paths = [];
//         let patched_paths = [];
//         let unpatched_paths = [];
//         let introduced_paths = [];
//         for (let [, directDepPatchInfo] of Object.entries(props.patch.patches)) {
//             if ('patched_occurences' in directDepPatchInfo) {
//                 paths.push(...directDepPatchInfo['patched_occurences'].Paths);
//                 patched_paths.push(...directDepPatchInfo['patched_occurences'].Paths);
//             }
//             if ('unpatched_occurences' in directDepPatchInfo) {
//                 paths.push(...directDepPatchInfo['unpatched_occurences'].Paths);
//                 unpatched_paths.push(...directDepPatchInfo['unpatched_occurences'].Paths);
//             }
//             if ('introduced_occurences' in directDepPatchInfo) {
//                 paths.push(...directDepPatchInfo['introduced_occurences'].Paths);
//                 introduced_paths.push(...directDepPatchInfo['introduced_occurences'].Paths);
//             }
//         }
//         let data: PatchOccurenceInfo[] = [
//             {
//                 vulnerability_id: props.patch.vulnerability_id,
//                 affected_deps: props.patch.affected_deps,
//                 all_occurences: paths,
//                 patched_occurences: patched_paths,
//                 unpatched_occurences: unpatched_paths,
//                 introduced_occurences: introduced_paths
//             }
//         ];
//         node_array.value = new TreeGenerator().generateTree(data);
//     }
// }
// computeTree();

// watch(
//     () => props.patch,
//     () => {
//         computeTree();
//     }
// );
</script>

<template>
  <Card>
    <CardContent class="pt-4">
      <div class="flex flex-col gap-4">
        <div class="flex flex-row items-center gap-8 font-bold">
          <Badge>{{ type }}</Badge>
          <div class="text-2xl">
            {{ name }}
          </div>
          <div>
            <span
              v-if="patch.IsPatchable === 'FULL'"
              class="flex gap-1 items-center text-severity-low"
            >
              <Icon icon="bi:shield-fill-check" />
              Full patch available
            </span>
            <span
              v-else-if="patch.IsPatchable === 'PARTIAL'"
              class="flex gap-1 items-center text-severity-medium"
            >
              <Icon icon="bi:shield-fill-minus" />
              Partial patch available
            </span>
            <span v-else class="flex gap-1 items-center text-severity-high">
              <Icon icon="bi:shield-fill-exclamation" />
              No patch available
            </span>
          </div>
        </div>

        <Tabs default-value="patches" class="w-full">
          <TabsList class="grid w-full grid-cols-2">
            <TabsTrigger value="patches">
              <Icon icon="bi:list" /> Patches
            </TabsTrigger>
            <TabsTrigger value="tree">
              <Icon icon="ri:node-tree" /> Tree
            </TabsTrigger>
          </TabsList>
          <TabsContent value="patches">
            <div v-for="(unpatchable, index) in patch.Unpatchable" :key="index">
              <PatchInformation :patch="unpatchable" :patch-info="patch" />
            </div>
            <div v-for="(patchable, index) in patch.Patchable" :key="index">
              <PatchInformation :patch="patchable" :patch-info="patch" />
            </div>
          </TabsContent>
          <TabsContent value="tree"> </TabsContent>
        </Tabs>
      </div>
    </CardContent>
  </Card>
</template>

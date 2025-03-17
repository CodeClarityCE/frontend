<script setup lang="ts">
import type { TreeNode } from '@/utils/tree/patching/TreeNode';
import { Icon } from '@iconify/vue';

export interface Props {
    node: TreeNode;
    showVulnIDs?: boolean;
}

withDefaults(defineProps<Props>(), {
    showVulnIDs: false
});
</script>

<template>
    <div v-if="node">
        <div class="h-14 flex">
            <div v-for="index in node.level" :key="index">
                <div
                    v-if="node.fencesToDraw.includes(index)"
                    class="h-14 -mt-7 ml-7 border-l border-gray-400 w-6"
                    :fence-of="node.key"
                    :level="index"
                ></div>
                <div v-else class="h-14 ml-7 w-6" :fence-of="node.key" :level="index"></div>
            </div>

            <div
                class="node bg-white relative"
                :class="{
                    'vulnerable-dep': node.vulnerable
                }"
            >
                <div
                    v-if="node.root == false"
                    class="absolute border-t border-gray-400 h-px w-6"
                    :class="{
                        '-left-[26px]': node.vulnerable,
                        '-left-6': !node.vulnerable
                    }"
                ></div>
                <div>{{ node.key }}</div>
                <div>
                    <div v-if="node.patch_type == 'NONE'" class="flex gap-2 items-center">
                        <span class="text-severityHigh">
                            <Icon class="text-xl" :icon="'jam:shield-close'"></Icon>
                        </span>
                        <div class="text-severityHigh">Not Patchable</div>
                    </div>
                    <div v-if="node.patch_type == 'FULL'" class="flex gap-2 items-center">
                        <span class="text-severityLow">
                            <Icon class="text-xl" :icon="'jam:shield-check'"></Icon>
                        </span>
                        <div class="text-severityLow">Patchable</div>
                    </div>
                </div>
                <div v-if="node.vulnerable && showVulnIDs" style="font-weight: 400">
                    {{ node.vulnerability_ids.join(', ') }}
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use '@/assets/colors.scss';
@use '@/assets/common/dependency-tree.scss';
</style>

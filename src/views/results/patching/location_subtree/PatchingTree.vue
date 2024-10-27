<template>
    <div class="dependency-tree">
        <div v-for="tree_node in nodes" :key="tree_node.key">
            <Node :node="tree_node" :show-vuln-i-ds="showVulnIDs" />
        </div>
    </div>
</template>
<script setup lang="ts">
import type { TreeNode } from '@/utils/tree/patching/TreeNode';
import Node from './PatchingNode.vue';

export interface Props {
    nodes: TreeNode[];
    showVulnIDs: boolean;
}

withDefaults(defineProps<Props>(), {
    nodes: () => [],
    showVulnIDs: false
});
</script>

<style lang="scss" scoped>
@import '@/assets/colors.scss';
@import '@/assets/common/dependency-tree.scss';
</style>

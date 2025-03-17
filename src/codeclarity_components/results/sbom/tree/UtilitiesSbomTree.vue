<script setup lang="ts">
import type { FlatTreeNode } from '@/utils/tree/sbom/TreeGenerator';
import Node from './UtilitiesSbomNode.vue';

type Props = {
    nodes?: FlatTreeNode[];
    rootName?: string;
};

withDefaults(defineProps<Props>(), {
    nodes: () => [],
    rootName: ''
});
</script>

<template>
    <div v-for="node in nodes" :key="node.data?.key" class="dependency-tree">
        <Node :key="node.parentPath" :node="node" :root-name="rootName" />
    </div>
</template>

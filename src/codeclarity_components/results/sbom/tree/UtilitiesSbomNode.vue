<script setup lang="ts">
import BubbleComponent from '@/base_components/bubbles/BubbleComponent.vue';
import SeverityBubble from '@/base_components/bubbles/SeverityBubble.vue';
import type { FlatTreeNode } from '@/utils/tree/sbom/TreeGenerator';

type Props = {
    node: FlatTreeNode;
    rootName: string;
};

withDefaults(defineProps<Props>(), {
    rootName: 'root'
});
</script>

<template>
    <div v-if="node" :class="'flex h-[3.2em]'">
        <div v-for="index in node.level" :key="index">
            <div class="w-6 h-[3.45em] ml-[1.8em]" :class="{
                'border-l border-gray-400 -mt-[1.8em]': node.fencesToDraw.includes(index)
            }" :fence-of="node.key" :level="index"></div>
        </div>

        <div class="node" :class="{
            'bg-gray-100': node.isDev,
            'bg-white': !node.isDev
        }" style="position: relative">
            <div v-if="node.root == false" class="absolute border-t border-gray-400 w-6 h-px -left-[24px]"></div>
            <div v-if="node.root == false">
                {{ node.data ? node.data.key : 'N/A' }}
            </div>
            <div v-if="node.root == true">
                {{ rootName }}
            </div>
            <BubbleComponent
                title="dependencies appearing multiple times in the tree are pruned for easier visualization"
                v-if="node.pruned" :blue="true" :slim="true">
                <template #content> pruned </template>
            </BubbleComponent>
            <SeverityBubble v-if="!node.root && node.data?.severity_dist"
                :critical="node.data.severity_dist.critical != 0" :high="node.data.severity_dist.high != 0"
                :medium="node.data.severity_dist.medium != 0" :low="node.data.severity_dist.low != 0"
                :none="node.data.severity_dist.none != 0">
                <template #critical>{{ node.data.severity_dist.critical }}</template>
                <template #high>{{ node.data.severity_dist.high }}</template>
                <template #medium>{{ node.data.severity_dist.medium }}</template>
                <template #low>{{ node.data.severity_dist.low }}</template>
                <template #none>{{ node.data.severity_dist.none }}</template>
            </SeverityBubble>
            <div class="flex flex-row gap-2 font-extrabold cursor-pointer text-[#7301018c]">
                <BubbleComponent v-if="node.data && node.data.outdated" :slim="true" :title="node.data.outdatedMessage">
                    <template #content> Outdated </template>
                </BubbleComponent>
                <BubbleComponent v-if="node.data && node.data.deprecated" :slim="true"
                    :title="'Author message: ' + node.data.deprecatedMessage">
                    <template #content> Deprecated </template>
                </BubbleComponent>
                <BubbleComponent v-if="node.data && node.data.unlicensed" :slim="true"
                    :title="'Author message: ' + node.data.deprecatedMessage">
                    <template #content> Unlicensed </template>
                </BubbleComponent>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use '@/assets/colors.scss';
@use '@/assets/common/dependency-tree.scss';
</style>

<script lang="ts" setup>
import { Icon } from '@iconify/vue/dist/iconify.js';
import { ref } from 'vue';

export interface Props {
    expand?: boolean;
    expandCallBack?: Function;
    closeCallBack?: Function;
}

const props = withDefaults(defineProps<Props>(), {
    expand: false,
    expandCallBack: undefined,
    closeCallBack: undefined
});

const expand = ref(props.expand);

function expandBox() {
    if (expand.value == true) {
        if (props.closeCallBack) props.closeCallBack();
    } else {
        if (props.expandCallBack) props.expandCallBack();
    }
    expand.value = !expand.value;
}
</script>
<template>
    <div class="project-patch-patch-container project-patch-patch-container-none" collapsible-box>
        <div class="project-patch-patch-container-header">
            <div class="title">
                <slot name="title"></slot>
            </div>
        </div>
        <slot name="body"></slot>
        <div :style="{ display: expand == true ? 'none' : 'block' }">
            <slot name="collapsibe_content_inverse"></slot>
        </div>
        <div class="collapsible-content" :style="{ display: expand == true ? 'block' : 'none' }">
            <div class="content-wrapper">
                <slot name="collapsible_content"></slot>
            </div>
        </div>
        <div class="collapsible-show-more collapse-selector" @click="expandBox()">
            <div class="collapsible-show-more-inner">
                <Icon
                    :icon="'ion:chevron-down-outline'"
                    class="collapse-icon"
                    title="Show more details"
                />
                <div v-if="!expand" class="collapse-text">Show more</div>
                <div v-if="expand" class="collapse-text">Show less</div>
            </div>
        </div>
    </div>
</template>

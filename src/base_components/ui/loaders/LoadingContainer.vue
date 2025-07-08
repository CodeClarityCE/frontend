<script lang="ts" setup>
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import Alert from '@/shadcn/ui/alert/Alert.vue';
import AlertDescription from '@/shadcn/ui/alert/AlertDescription.vue';

const loading = ref(true);
const content = ref(false);
const error = ref(false);

function showContent() {
    content.value = true;
    loading.value = false;
}

function showError() {
    error.value = true;
    loading.value = false;
}

function showLoading() {
    error.value = false;
    content.value = false;
    loading.value = true;
}

defineExpose({
    showContent,
    showError,
    showLoading
});
</script>
<template>
    <div v-if="loading">
        <div class="loading-wrapper-local">
            <div class="loader">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
        </div>
    </div>

    <slot v-if="content" name="content"></slot>

    <Alert v-if="error" variant="destructive">
        <AlertDescription>
            <div>
                <Icon class="text-xl" icon="ic:twotone-warning" />
            </div>
            <div>
                <slot name="error"></slot>
            </div>
        </AlertDescription>
    </Alert>
</template>

<style scoped lang="scss">
@use '@/assets/colors.scss';

.loading-wrapper-local {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: #fff;
}

.loader {
    display: inline-block;
    position: relative;
    width: 80px;
    height: 80px;
}

.loader div {
    position: absolute;
    top: 33px;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: colors.$accent;
    animation-timing-function: cubic-bezier(0, 1, 1, 0);
}

.loader div:nth-child(1) {
    left: 8px;
    animation: lds-ellipsis1 0.6s infinite;
}

.loader div:nth-child(2) {
    left: 8px;
    animation: lds-ellipsis2 0.6s infinite;
}

.loader div:nth-child(3) {
    left: 32px;
    animation: lds-ellipsis2 0.6s infinite;
}

.loader div:nth-child(4) {
    left: 56px;
    animation: lds-ellipsis3 0.6s infinite;
}
</style>

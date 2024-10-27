<script setup lang="ts">
import BlueButton from '@/common_components/buttons/BlueButton.vue';
import { RouterLink } from 'vue-router';
</script>
<template>
    <div class="flex flex-col gap-8">
        <div
            class="flex flex-col gap-5 items-center justify-center"
            style="padding-top: 3rem; padding-bottom: 3rem"
        >
            <div style="font-weight: 900; color: gray; font-size: 1.3rem">No Projects yet</div>
            <div>
                <RouterLink :to="{ name: 'projects', params: { page: 'add' } }">
                    <BlueButton>
                        <template #text>Add a project</template>
                    </BlueButton>
                </RouterLink>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import '@/assets/colors.scss';
</style>

<template>
    <Button class="flex justify-center gap-2 items-center">
        <slot name="icon"></slot>
        <slot name="text"></slot>
    </Button>
</template>

<script lang="ts" setup>
import { Button } from '@/shadcn/ui/button';
</script>

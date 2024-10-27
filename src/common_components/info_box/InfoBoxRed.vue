<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next';
import { Alert, AlertDescription, AlertTitle } from '@/shadcn/ui/alert';
</script>
<template>
    <Alert variant="destructive">
        <AlertCircle class="w-4 h-4" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
            <slot name="content"></slot>
        </AlertDescription>
    </Alert>
</template>

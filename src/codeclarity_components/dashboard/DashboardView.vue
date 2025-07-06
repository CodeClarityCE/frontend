<script setup lang="ts">
import { useStateStore } from '@/stores/state';
import DashboardStats from './layout/DashboardStats.vue';

/**
 * DashboardView - Main dashboard entry point
 *
 * Simple wrapper that sets page state and renders the main dashboard.
 * No async loading complexity - keeps it simple for collaboration.
 */

// Set page state
const state = useStateStore();
state.$reset();
state.page = 'dashboard';
</script>

<template>
    <div class="flex-1 space-y-4 p-8 pt-6">
        <DashboardStats />
    </div>
</template>

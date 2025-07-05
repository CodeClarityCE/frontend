<template>
    <!-- Ultra-simple stats display -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
            label="Critical Issues"
            :value="stats.critical"
            icon="solar:danger-triangle-bold"
            variant="danger"
            subtitle="+2 this week"
        />

        <StatCard
            label="High Severity"
            :value="stats.high"
            icon="solar:shield-warning-bold"
            variant="primary"
            subtitle="-3 this week"
        />

        <StatCard
            label="Projects Scanned"
            :value="stats.projects"
            icon="solar:folder-check-bold"
            variant="success"
            subtitle="All systems"
        />

        <StatCard
            label="Security Score"
            :value="stats.score"
            icon="solar:shield-check-bold"
            variant="primary"
            subtitle="Good standing"
        />
    </div>
</template>

<script setup lang="ts">
import StatCard from '@/base_components/ui/cards/StatCard.vue';
import { useMockData } from '../composables/useMockData';

/**
 * Ultra-Simple Dashboard Stats
 *
 * Just displays 4 key metrics. Easy to understand and modify.
 */

// Get simple stats data
const { stats } = useMockData();
</script>

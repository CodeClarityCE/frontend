<script setup lang="ts">
import { cn } from '@/shadcn/lib/utils';
import { useStateStore } from '@/stores/state';
const state = useStateStore();
</script>

<template>
    <nav :class="cn('flex items-center space-x-4 lg:space-x-6', $attrs.class ?? '')">
        <RouterLink
            :to="{ name: 'home', params: {}, query: {} }"
            class="text-sm font-medium transition-colors hover:text-primary"
            :class="{ 'text-muted-foreground': state.page != 'dashboard' && state.page != 'home' }"
        >
            Dashboard
        </RouterLink>
        <RouterLink
            :to="{ name: 'projects', params: {}, query: {} }"
            class="text-sm font-medium transition-colors hover:text-primary"
            :class="{ 'text-muted-foreground': state.page != 'projects' }"
        >
            Projects
        </RouterLink>
        <RouterLink
            v-if="state.page == 'results'"
            :to="{ name: 'results', params: {}, query: {} }"
            class="text-sm font-medium transition-colors hover:text-primary"
            :class="{ 'text-muted-foreground': state.page != 'results' }"
        >
            Results
        </RouterLink>
        <RouterLink
            v-if="state.page == 'settings'"
            :to="{ name: 'settings', params: {}, query: {} }"
            class="text-sm font-medium transition-colors hover:text-primary"
            :class="{ 'text-muted-foreground': state.page != 'settings' }"
        >
            Settings
        </RouterLink>
    </nav>
</template>

<script setup lang="ts">
import { cn } from '@/shadcn/lib/utils';
import { useStateStore } from '@/stores/state';
const state = useStateStore();
</script>

<template>
    <nav :class="cn('flex items-center gap-8', $attrs.class ?? '')">
        <RouterLink
            :to="{ name: 'home', params: {}, query: {} }"
            class="text-sm font-medium transition-all duration-200 hover:text-gray-900 relative py-2"
            :class="{
                'text-gray-900 font-semibold': state.page == 'dashboard' || state.page == 'home',
                'text-gray-600': state.page != 'dashboard' && state.page != 'home'
            }"
        >
            Dashboard
            <div
                v-if="state.page == 'dashboard' || state.page == 'home'"
                class="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full"
            ></div>
        </RouterLink>
        <RouterLink
            :to="{ name: 'projects', params: {}, query: {} }"
            class="text-sm font-medium transition-all duration-200 hover:text-gray-900 relative py-2"
            :class="{
                'text-gray-900 font-semibold': state.page == 'projects',
                'text-gray-600': state.page != 'projects'
            }"
        >
            Projects
            <div
                v-if="state.page == 'projects'"
                class="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full"
            ></div>
        </RouterLink>
        <RouterLink
            :to="{ name: 'tickets', params: {}, query: {} }"
            class="text-sm font-medium transition-all duration-200 hover:text-gray-900 relative py-2"
            :class="{
                'text-gray-900 font-semibold': state.page == 'tickets',
                'text-gray-600': state.page != 'tickets'
            }"
        >
            Tickets
            <div
                v-if="state.page == 'tickets'"
                class="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full"
            ></div>
        </RouterLink>
        <RouterLink
            v-if="state.page == 'results'"
            :to="{ name: 'results', params: {}, query: {} }"
            class="text-sm font-medium transition-all duration-200 hover:text-gray-900 relative py-2"
            :class="{
                'text-gray-900 font-semibold': state.page == 'results',
                'text-gray-600': state.page != 'results'
            }"
        >
            Results
            <div
                v-if="state.page == 'results'"
                class="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full"
            ></div>
        </RouterLink>
        <RouterLink
            v-if="state.page == 'settings'"
            :to="{ name: 'settings', params: {}, query: {} }"
            class="text-sm font-medium transition-all duration-200 hover:text-gray-900 relative py-2"
            :class="{
                'text-gray-900 font-semibold': state.page == 'settings',
                'text-gray-600': state.page != 'settings'
            }"
        >
            Settings
            <div
                v-if="state.page == 'settings'"
                class="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full"
            ></div>
        </RouterLink>
    </nav>
</template>

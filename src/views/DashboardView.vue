<script lang="ts" setup>
import DateRangePicker from './dashboard/DateRangePicker.vue';
import { Button } from '@/shadcn/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shadcn/ui/tabs';

import { useStateStore } from '@/stores/state';

import ErrorComponent from '@/common_components/ErrorComponent.vue';
import LoadingComponent from '@/common_components/LoadingComponent.vue';
import { defineAsyncComponent } from 'vue';

const DashboardStats = defineAsyncComponent({
    loader: () => import('./dashboard/DashboardStats.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const MainPage = defineAsyncComponent({
    loader: () => import('@/views/projects/MainProjectsComponent.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const state = useStateStore();
state.$reset();
state.page = 'dashboard';
</script>

<template>
    <div class="flex-1 space-y-4 p-8 pt-6">
        <!-- <div class="flex items-center justify-between space-y-2">
            <h2 class="text-3xl font-bold tracking-tight">Dashboard</h2>
            <div class="flex items-center space-x-2">
                <DateRangePicker />
                <Button>Download</Button>
            </div>
        </div> -->
        <DashboardStats />
        <!-- <Tabs default-value="statistic" class="space-y-4">
            <TabsList>
                <TabsTrigger value="statistic"> Statistics </TabsTrigger>
                <TabsTrigger value="projects"> Projects </TabsTrigger>
                <TabsTrigger value="licenses" disabled> Licenses </TabsTrigger>
            </TabsList>
            <TabsContent value="statistic">
                <DashboardStats />
            </TabsContent>
            <TabsContent value="projects" class="space-y-4">
                <MainPage />
            </TabsContent>
        </Tabs> -->
    </div>
</template>

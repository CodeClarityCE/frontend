<script setup lang="ts">
import { RouterLink } from 'vue-router';
import MainNav from './components/MainNav.vue';
import SearchHeader from './components/SearchHeader.vue';
import TeamSwitcher from './components/TeamSwitcher.vue';
import UserNav from './components/UserNav.vue';
</script>

<template>
    <div class="hidden flex-col md:flex">
        <div class="border-b">
            <div class="flex h-14 items-center px-4 gap-2">
                <RouterLink :to="{ name: 'home' }" class="flex gap-1 items-center">
                    <img src="@/imgs/logos/logo.svg" class="h-8 self-center" />
                </RouterLink>

                <TeamSwitcher />
                <MainNav class="mx-6" />
                <div class="ml-auto flex items-center space-x-4">
                    <SearchHeader />
                    <UserNav />
                </div>
            </div>
        </div>
    </div>
</template>

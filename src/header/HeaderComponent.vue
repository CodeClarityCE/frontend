<script setup lang="ts">
import { RouterLink } from 'vue-router';
import MainNav from './components/MainNav.vue';
import SearchHeader from './components/SearchHeader.vue';
import TeamSwitcher from './components/TeamSwitcher.vue';
import UserNav from './components/UserNav.vue';
</script>

<template>
    <!-- <div class="md:hidden">
        <VPImage
            alt="Dashboard"
            width="1280"
            height="1214"
            class="block"
            :image="{
                dark: '/examples/dashboard-dark.png',
                light: '/examples/dashboard-light.png'
            }"
        />
    </div> -->

    <div class="hidden flex-col md:flex">
        <div class="border-b">
            <div class="flex h-16 items-center px-4">
                <RouterLink :to="{ name: 'home' }" class="flex gap-1 items-center">
                    <img src="@/imgs/logos/logo.svg" class="w-8 self-center" />
                    <div class="font-semibold text-lg text-muted-foreground">CodeClarity</div>
                </RouterLink>

                <TeamSwitcher class="ml-6" />
                <MainNav class="mx-6" />
                <div class="ml-auto flex items-center space-x-4">
                    <SearchHeader />
                    <UserNav />
                </div>
            </div>
        </div>
    </div>
</template>

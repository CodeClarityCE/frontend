<script setup lang="ts">
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/shadcn/ui/button';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious
} from '@/shadcn/ui/carousel';
import type { CarouselApi } from '@/shadcn/ui/carousel';

import Autoplay from 'embla-carousel-autoplay';

import { useStateStore } from '@/stores/state';
import { Icon } from '@iconify/vue/dist/iconify.js';
import { ref } from 'vue';
import { watchOnce } from '@vueuse/core';
import Button from '@/shadcn/ui/button/Button.vue';

import ErrorComponent from '@/common_components/ErrorComponent.vue';
import LoadingComponent from '@/common_components/LoadingComponent.vue';
import { defineAsyncComponent } from 'vue';

const UserAuthForm = defineAsyncComponent({
    loader: () => import('./authentication/UserAuthForm.vue'),
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

state.page = 'signup';
state.publicPage = true;

const api = ref<CarouselApi>();
const current = ref(0);
const show_buttons = ref(false);
const question = ref('');

var words = [
        'find vulnerabilities in my code?',
        'make sure my code is secure?',
        'make sure my code is compliant?'
    ],
    i = 0,
    offset = 0,
    len = words.length,
    forwards = true,
    skip_count = 0,
    skip_delay = 30,
    speed = 35;
var wordflick = function () {
    setInterval(function () {
        if (forwards) {
            if (offset >= words[i].length) {
                ++skip_count;
                if (skip_count == skip_delay) {
                    forwards = false;
                    skip_count = 0;
                }
            }
        } else {
            if (offset == 0) {
                forwards = true;
                i++;
                offset = 0;
                if (i >= len) {
                    i = 0;
                }
            }
        }
        question.value = words[i].substring(0, offset);
        if (skip_count == 0) {
            if (forwards) {
                offset++;
            } else {
                offset--;
            }
        }
    }, speed);
};
wordflick();

function setApi(val: CarouselApi) {
    api.value = val;
}

watchOnce(api, (api) => {
    if (!api) return;

    current.value = api.selectedScrollSnap() + 1;

    api.on('select', () => {
        current.value = api.selectedScrollSnap() + 1;
    });
});
</script>

<template>
    <div
        class="container relative hidden h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0"
    >
        <RouterLink
            :to="{ name: 'signup' }"
            :class="
                cn(
                    buttonVariants({ variant: 'ghost' }),
                    'absolute right-4 top-4 md:right-8 md:top-8'
                )
            "
        >
            <img src="@/imgs/logos/logo.svg" class="w-8" />
            Signup
        </RouterLink>
        <div
            class="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex"
            @mouseenter="show_buttons = true"
            @mouseleave="show_buttons = false"
        >
            <div class="absolute inset-0 bg-zinc-900"></div>
            <div class="relative z-20 flex items-center text-lg font-medium">
                <img src="@/imgs/logos/logo-white.svg" class="w-8 mr-2" />
                CodeClarity
            </div>
            <div class="relative z-20 mt-auto flex justify-center">
                <Carousel
                    @init-api="setApi"
                    class="mx-4"
                    :opts="{
                        align: 'start',
                        loop: true
                    }"
                    :plugins="[Autoplay({ delay: 10000 })]"
                >
                    <CarouselContent>
                        <CarouselItem class="flex flex-col justify-center">
                            <div class="flex gap-4 items-center">
                                <!-- TODO check icon license -->
                                <Icon icon="logos:javascript" class="text-7xl flex-shrink-0"></Icon>
                                <span class="text-4xl">
                                    Eliminate all safety issues from your JavaScript code
                                    automatically*
                                </span>
                            </div>
                        </CarouselItem>
                        <CarouselItem class="flex flex-col justify-evenly">
                            <span class="text-4xl"
                                >Perfect for software developers, who are asking themselves these
                                questions:</span
                            >
                            <span class="text-4xl">How to {{ question }}</span>
                        </CarouselItem>
                        <CarouselItem class="flex flex-col justify-evenly items-center">
                            <div class="grid gap-20 grid-cols-1">
                                <div class="flex flex-col items-center col-span-1 text-8xl">
                                    1 second
                                    <span class="text-4xl">to fix 500 dependencies</span>
                                </div>
                                <div class="flex flex-col items-center col-span-1 text-8xl">
                                    Real-time
                                    <span class="text-4xl">vulnerability monitoring</span>
                                </div>
                                <div class="flex flex-col items-center col-span-1 text-8xl">
                                    3-steps
                                    <span class="text-4xl">to get your first report</span>
                                </div>
                            </div>
                        </CarouselItem>
                        <CarouselItem class="flex flex-col justify-center items-center">
                            <div class="grid gap-20 grid-cols-2">
                                <Icon icon="pajamas:github" class="text-9xl"></Icon>
                                <Icon icon="logos:gitlab" class="text-9xl"></Icon>
                            </div>
                        </CarouselItem>
                        <CarouselItem class="flex flex-col justify-center">
                            <img src="/src/imgs/others/login-page-demo.png" />
                        </CarouselItem>
                        <CarouselItem class="flex flex-col justify-center">
                            <img src="/src/imgs/others/patch.png" />
                        </CarouselItem>
                    </CarouselContent>
                    <CarouselPrevious v-show="show_buttons" />
                    <CarouselNext v-show="show_buttons" />
                </Carousel>
            </div>
            <div class="relative z-20 mt-auto">
                <blockquote v-if="current == 1" class="space-y-2">
                    <p class="text-lg">*More languages coming soon.</p>
                    <!-- <footer class="text-sm">
                        CodeClarity
                    </footer> -->
                </blockquote>
                <p v-else-if="current == 4" class="text-3xl text-center">
                    Import a project from Gitlab or Github
                </p>
                <p v-else-if="current == 5" class="text-3xl text-center">
                    Start an analysis and find any issue in an instant
                </p>
                <p v-else-if="current == 6" class="text-3xl text-center">
                    We guide you through the fixing process
                </p>
            </div>
        </div>
        <div class="lg:p-8">
            <div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <img src="@/imgs/logos/logo.svg" class="w-20 self-center" />
                <div class="flex flex-col space-y-2 text-center">
                    <h1 class="text-2xl font-semibold tracking-tight">Sign In</h1>
                    <p class="text-sm text-muted-foreground">
                        Welcome back. Please enter your credentials.
                    </p>
                </div>
                <UserAuthForm />
                <p class="px-8 text-center text-sm text-muted-foreground">
                    By clicking continue, you agree to our
                    <Button variant="link" class="h-4 p-0">
                        <RouterLink to="/terms">Terms of Service</RouterLink>
                    </Button>
                    and
                    <Button variant="link" class="h-4 p-0">
                        <RouterLink to="/privacy">Privacy Policy</RouterLink>
                    </Button>
                    .
                </p>
            </div>
        </div>
    </div>
</template>

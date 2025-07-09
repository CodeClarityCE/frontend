<script setup lang="ts">
import { cn } from '@/shadcn/lib/utils';
import { buttonVariants } from '@/shadcn/ui/button';

import { useStateStore } from '@/stores/state';

import ErrorComponent from '@/base_components/utilities/ErrorComponent.vue';
import LoadingComponent from '@/base_components/ui/loaders/LoadingComponent.vue';
import { defineAsyncComponent } from 'vue';

const UserAuthForm = defineAsyncComponent({
    loader: () => import('./UserAuthForm.vue'),
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
</script>

<template>
    <div>
        <RouterLink
            :to="{ name: 'signup' }"
            :class="
                cn(
                    buttonVariants({ variant: 'ghost' }),
                    'absolute right-4 top-4 md:right-8 md:top-8'
                )
            "
        >
            <img src="@/assets/images/logos/logo.svg" class="w-8" />
            Signup
        </RouterLink>
        <div class="h-svh flex justify-center">
            <div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <img src="@/assets/images/logos/logo.svg" class="w-20 self-center" />
                <div class="flex flex-col space-y-2 text-center">
                    <h1 class="text-2xl font-semibold tracking-tight">Sign In</h1>
                    <p class="text-sm text-muted-foreground">
                        Welcome back. Please enter your credentials.
                    </p>
                </div>
                <UserAuthForm />
                <!-- <p class="px-8 text-center text-sm text-muted-foreground">
                    By clicking continue, you agree to our
                    <Button variant="link" class="h-4 p-0">
                        <RouterLink to="/terms">Terms of Service</RouterLink>
                    </Button>
                    and
                    <Button variant="link" class="h-4 p-0">
                        <RouterLink to="/privacy">Privacy Policy</RouterLink>
                    </Button>
                    .
                </p> -->
            </div>
        </div>
    </div>
</template>

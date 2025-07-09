<script setup lang="ts">
import router from '@/router';
import { Button } from '@/shadcn/ui/button';
</script>

<template>
    <main class="p-12">
        <div class="notfound-wrapper">
            <div class="left-side">
                <div class="text-wrapper">
                    <div class="header">404</div>
                    <div class="subheader">Page not found</div>
                    <div class="details">
                        The page you are looking for does not exist or has been removed.
                    </div>
                </div>
                <div class="links">
                    <Button @click="router.back()">Get me back</Button>
                </div>
            </div>

            <img class="error-logo" src="/src/assets/images/others/logo_side_wise_error.png" />
        </div>
    </main>
</template>

<style scoped lang="scss">
@use '@/assets/colors.scss';

.notfound-wrapper {
    display: flex;
    flex-direction: row;
    justify-content: center;
    // align-items: center;
    margin-top: 10vh;
    width: 100%;
    height: 100%;
    row-gap: 2rem;
}

.notfound-wrapper .left-side {
    height: 30rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.notfound-wrapper .error-logo {
    height: 30rem;
    flex-grow: 0;
}

.notfound-wrapper .text-wrapper {
    display: flex;
    flex-direction: column;
    row-gap: 2rem;
    color: #acacac;
    font-weight: 900;
}

.notfound-wrapper .header {
    font-size: 16rem;
    line-height: 13rem;
}

.notfound-wrapper .subheader {
    font-size: 4rem;
}

.notfound-wrapper .details {
    font-size: 1.5rem;
    max-width: 40rem;
    color: acacac;
}

.notfound-wrapper > .text-wrapper > .header {
    margin-bottom: -4.5rem;
}

.notfound-wrapper button {
    font-size: 1.5rem;
    font-weight: 900;
    // border: 3px solid $accent;
    // border-radius: 0px;
}
</style>

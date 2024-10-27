<script setup lang="ts">
import { Terminal } from 'lucide-vue-next';
import { Alert, AlertDescription, AlertTitle } from '@/shadcn/ui/alert';
import { Button } from '@/shadcn/ui/button';

function back() {
    window.history.back();
}
</script>

<template>
    <div class="flex flex-col items-center w-full h-full gap-8 mt-[10vh]">
        <Alert class="w-1/2">
            <Terminal class="h-4 w-4" />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription class="flex flex-col">
                <span>
                    The platform is in trial mode. To get access, please register via email or
                    ticket.
                </span>
                <span>
                    Please provide your <b class="text-primary">company name</b>, and a
                    <b class="text-primary">mail address</b> for each user you want to register. </span
                ><br />
                <span
                    >If you signed up with GitHub or GitLab, please provide your associated email so
                    we can activate your account.</span
                >
            </AlertDescription>
        </Alert>

        <div class="flex flex-row justify-between w-1/3">
            <a href="mailto:contact@codeclarity.io" target="_blank">
                <Button> Send us a mail </Button>
            </a>

            <a href="https://doli.codeclarity.io/public/ticket/index.php?entity=1" target="_blank">
                <Button> Fill a ticket </Button>
            </a>
        </div>

        <Button @click="back" variant="link">Go Back</Button>
    </div>
</template>

<style scoped lang="scss">
@import '@/assets/colors.scss';

.bordered-button {
    padding: 12px 18px;
    border: 3px solid $accent;
    color: $accent;
    border-radius: 10px;
    background-color: #fff;
    font-weight: 800;
    cursor: pointer;
    text-decoration: none;
}

.bordered-button:hover {
    background-color: $accent;
    color: #fff;
}
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
    border: 3px solid $accent;
    border-radius: 0px;
}
</style>

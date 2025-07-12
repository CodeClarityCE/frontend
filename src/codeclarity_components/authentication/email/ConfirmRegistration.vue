<script lang="ts" setup>
import { ref } from 'vue';
import router from '@/router';
import { UserRepository } from '@/codeclarity_components/authentication/user.repository';

const text = ref('Confirming registration...');
const counter = ref(0);

// Repositories
const userRepository: UserRepository = new UserRepository();

async function init() {
    try {
        const url = new URL(window.location.href);
        const searchParams = url.searchParams;

        await userRepository.confirmRegistration({
            userId: searchParams.get('userid') || '',
            bearerToken: '',
            data: {
                token: searchParams.get('token') || '',
                userIdHash: searchParams.get('userid') || ''
            },
            handleBusinessErrors: true
        });

        // success.value = true;
    } catch (_err) {
        console.error(_err);

        text.value = 'Error confirming registration. Redirecting to login page in';
        counter.value = 5;
        const interval = setInterval(() => {
            counter.value -= 1;
            if (counter.value == 0) {
                clearInterval(interval);
                router.push({ name: 'login' });
            }
        }, 1000);
    }

    text.value = 'Registration confirmed. Redirecting to login page in';
    counter.value = 5;
    const interval = setInterval(() => {
        counter.value -= 1;
        if (counter.value == 0) {
            clearInterval(interval);
            router.push({ name: 'login' });
        }
    }, 1000);
}

init();
</script>
<template>
    <div class="flex flex-col justify-center items-center my-20">
        <h1>
            {{ text }} <span v-if="counter > 0">({{ counter }})</span>
        </h1>
    </div>
</template>

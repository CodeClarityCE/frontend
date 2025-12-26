<script lang="ts" setup>
import { UserRepository } from "@/codeclarity_components/authentication/user.repository";
import router from "@/router";
import { ref } from "vue";

const text = ref("Confirming registration...");
const counter = ref(0);

// Repositories
const userRepository: UserRepository = new UserRepository();

async function init(): Promise<void> {
  try {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;

    await userRepository.confirmRegistration({
      userId: searchParams.get("userid") ?? "",
      bearerToken: "",
      data: {
        token: searchParams.get("token") ?? "",
        userIdHash: searchParams.get("userid") ?? "",
      },
      handleBusinessErrors: true,
    });

    // Success case
    text.value = "Registration confirmed. Redirecting to login page in";
    counter.value = 5;
    let successInterval: ReturnType<typeof setInterval> | null = null;
    successInterval = setInterval(() => {
      counter.value -= 1;
      if (counter.value === 0) {
        if (successInterval) {
          clearInterval(successInterval);
        }
        void router.push({ name: "login" });
      }
    }, 1000);
  } catch (_err) {
    console.error(_err);

    text.value = "Error confirming registration. Redirecting to login page in";
    counter.value = 5;
    let errorInterval: ReturnType<typeof setInterval> | null = null;
    errorInterval = setInterval(() => {
      counter.value -= 1;
      if (counter.value === 0) {
        if (errorInterval) {
          clearInterval(errorInterval);
        }
        void router.push({ name: "login" });
      }
    }, 1000);
  }
}

void init();
</script>
<template>
  <div class="flex flex-col justify-center items-center my-20">
    <h1>
      {{ text }} <span v-if="counter > 0">({{ counter }})</span>
    </h1>
  </div>
</template>

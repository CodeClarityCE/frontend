<script lang="ts" setup>
import { LoaderCircle } from "@lucide/vue";
import { onUnmounted, ref } from "vue";

import { UserRepository } from "@/codeclarity_components/authentication/user.repository";
import router from "@/router";
import { cn } from "@/shadcn/lib/utils";
import { buttonVariants } from "@/shadcn/ui/button";

import AuthLayout from "../layout/AuthLayout.vue";

type Status = "pending" | "confirmed" | "failed";

const status = ref<Status>("pending");
const counter = ref(5);
let countdown: ReturnType<typeof setInterval> | undefined;

// Repositories
const userRepository: UserRepository = new UserRepository();

// Counts down, then sends the visitor to sign in.
function redirectToLogin(): void {
  countdown = setInterval(() => {
    counter.value -= 1;
    if (counter.value <= 0) {
      clearInterval(countdown);
      void router.push({ name: "login" });
    }
  }, 1000);
}

async function init(): Promise<void> {
  const searchParams = new URL(window.location.href).searchParams;
  try {
    await userRepository.confirmRegistration({
      userId: searchParams.get("userid") ?? "",
      bearerToken: "",
      data: {
        token: searchParams.get("token") ?? "",
        userIdHash: searchParams.get("userid") ?? "",
      },
      handleBusinessErrors: true,
    });
    status.value = "confirmed";
  } catch {
    status.value = "failed";
  }
  redirectToLogin();
}

onUnmounted(() => clearInterval(countdown));

void init();
</script>
<template>
  <AuthLayout>
    <template #title>
      <template v-if="status === 'confirmed'">Registration confirmed</template>
      <template v-else-if="status === 'failed'">
        We could not confirm your registration
      </template>
      <template v-else>Confirming your registration</template>
    </template>
    <template v-if="status !== 'pending'" #description>
      <template v-if="status === 'confirmed'">
        Your account is ready. You can now sign in.
      </template>
      <template v-else>
        The confirmation link may have expired or already been used.
      </template>
    </template>

    <div
      v-if="status === 'pending'"
      role="status"
      class="flex flex-col items-center gap-2 py-6 text-muted-foreground"
    >
      <LoaderCircle
        aria-hidden="true"
        class="size-6 animate-spin motion-reduce:animate-none"
      />
      Confirming your registration
    </div>

    <div v-else class="flex flex-col gap-6">
      <p role="status" class="text-sm text-muted-foreground">
        Redirecting to sign in in {{ counter }}
        {{ counter === 1 ? "second" : "seconds" }}.
      </p>
      <RouterLink
        :to="{ name: 'login' }"
        :class="cn(buttonVariants(), 'w-full')"
      >
        Go to sign in
      </RouterLink>
    </div>
  </AuthLayout>
</template>

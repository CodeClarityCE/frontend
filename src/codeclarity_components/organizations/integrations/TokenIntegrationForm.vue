<script setup lang="ts">
import { CircleAlert, LoaderCircle, ShieldCheck } from "@lucide/vue";
import { computed, ref } from "vue";

import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/shadcn/ui/card";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";

// The token field and submit button shared by the GitHub and GitLab forms.
const props = defineProps<{
  title: string;
  description: string;
  label: string;
  placeholder: string;
  hint: string;
  submitLabel: string;
  /** Returns the problem with the token, or undefined when it is valid. */
  validate: (token: string) => string | undefined;
  /** True while the parent's own fields have errors. */
  fieldsInvalid?: boolean;
  busy?: boolean;
  apiError?: string;
}>();

const token = defineModel<string>("token", { required: true });
const emit = defineEmits<{ submit: [] }>();

const submitted = ref(false);
const tokenError = computed(() =>
  submitted.value ? props.validate(token.value) : undefined,
);

function onSubmit(): void {
  submitted.value = true;
  if (props.validate(token.value) || props.fieldsInvalid) return;
  emit("submit");
}

defineExpose({ submitted });
</script>

<template>
  <Card class="rounded-card shadow-card">
    <CardHeader>
      <h2 class="text-lg font-semibold leading-none text-foreground-strong">
        {{ title }}
      </h2>
      <CardDescription>{{ description }}</CardDescription>
    </CardHeader>
    <CardContent class="flex flex-col gap-6">
      <Alert v-if="apiError" variant="destructive">
        <CircleAlert aria-hidden="true" class="size-4" />
        <AlertDescription class="whitespace-pre-line">
          {{ apiError }}
        </AlertDescription>
      </Alert>

      <form class="flex flex-col gap-6" novalidate @submit.prevent="onSubmit">
        <div class="flex flex-col gap-2">
          <Label for="integration-token">{{ label }}</Label>
          <Input
            id="integration-token"
            v-model="token"
            type="password"
            autocomplete="off"
            :placeholder="placeholder"
            :aria-invalid="tokenError ? true : undefined"
            :aria-describedby="
              tokenError
                ? 'integration-token-hint integration-token-error'
                : 'integration-token-hint'
            "
          />
          <p id="integration-token-hint" class="text-sm text-muted-foreground">
            {{ hint }}
          </p>
          <p
            v-if="tokenError"
            id="integration-token-error"
            class="text-sm text-destructive"
          >
            {{ tokenError }}
          </p>
        </div>

        <slot name="fields" :submitted="submitted" />

        <Button type="submit" :disabled="busy" class="self-start">
          <LoaderCircle
            v-if="busy"
            aria-hidden="true"
            class="animate-spin motion-reduce:animate-none"
          />
          {{ submitLabel }}
        </Button>

        <p class="flex items-start gap-2 text-sm text-muted-foreground">
          <ShieldCheck aria-hidden="true" class="mt-0.5 size-4 shrink-0" />
          Your token is encrypted and stored securely. It is only used to read
          your repositories for analysis.
        </p>
      </form>
    </CardContent>
  </Card>
</template>

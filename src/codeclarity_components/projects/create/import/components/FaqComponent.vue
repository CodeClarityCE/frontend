<script lang="ts" setup>
import { BookOpen, Mail } from "@lucide/vue";

import { Button } from "@/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/ui/card";

const questions = [
  {
    question: "I cannot find a recently created repository",
    answer:
      "Repositories are cached. Use Refresh from provider above the list to fetch them again.",
  },
  {
    question: "My imports keep failing",
    answer:
      "Refresh from provider first, then import again. If it still fails, contact support.",
  },
  {
    question: "I do not see all my repositories",
    answer:
      "The list holds only repositories the integration's token can read. Check its permissions in the organisation settings.",
  },
];
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Questions about importing</CardTitle>
      <CardDescription>Answers to the usual import problems.</CardDescription>
    </CardHeader>
    <CardContent class="flex flex-col gap-6">
      <dl class="grid grid-cols-3 gap-6">
        <div v-for="item in questions" :key="item.question">
          <dt class="font-semibold text-foreground-strong">
            {{ item.question }}
          </dt>
          <dd class="mt-1 text-sm text-muted-foreground">{{ item.answer }}</dd>
        </div>
      </dl>
      <div class="flex gap-3">
        <Button as="a" href="mailto:support@codeclarity.io" variant="outline">
          <Mail aria-hidden="true" />
          Contact support
        </Button>
        <Button
          as="a"
          href="https://doc.codeclarity.io/"
          target="_blank"
          rel="noopener noreferrer"
          variant="outline"
        >
          <BookOpen aria-hidden="true" />
          Documentation
        </Button>
      </div>
    </CardContent>
  </Card>
</template>

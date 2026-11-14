<script setup lang="ts">
import { ArrowLeft, LoaderCircle } from "@lucide/vue";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { ref } from "vue";
import { RouterLink } from "vue-router";
import * as z from "zod";

import { BrandEmphasis, PageHeading } from "@/base_components/page";
import router from "@/router";
import { Button } from "@/shadcn/ui/button";
import { Card, CardContent } from "@/shadcn/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shadcn/ui/form";
import { Input } from "@/shadcn/ui/input";
import { Textarea } from "@/shadcn/ui/textarea";
import { useAuthStore } from "@/stores/auth";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { filterUndefined } from "@/utils/form/filterUndefined";
import { errorToast, successToast } from "@/utils/toasts";

import { OrgRepository } from "../organization.repository";

const authStore = useAuthStore();
const orgRepo: OrgRepository = new OrgRepository();
const submitting = ref(false);

const formSchema = z.object({
  name: z
    .string({ required_error: "A name is required" })
    .trim()
    .min(2, { message: "At least 2 characters" }),
  description: z
    .string({ required_error: "A description is required" })
    .trim()
    .min(2, { message: "At least 2 characters" }),
});
type FormValues = z.infer<typeof formSchema>;

const form = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
});

const onSubmit = form.handleSubmit(async (values) => {
  if (submitting.value) return;
  submitting.value = true;
  try {
    const created = await orgRepo.create({
      bearerToken: authStore.getToken ?? "",
      data: {
        name: values.name,
        description: values.description,
        color_scheme: "1",
      },
      handleBusinessErrors: true,
    });
    successToast(`Created ${values.name}`);
    void router.push({
      name: "orgs",
      params: { action: "manage", page: "main", orgId: created.id },
    });
  } catch (error) {
    errorToast(
      error instanceof BusinessLogicError
        ? `The organisation could not be created: ${error.error_message}`
        : "The organisation could not be created",
    );
  } finally {
    submitting.value = false;
  }
});
</script>
<template>
  <div class="flex max-w-3xl flex-col gap-8">
    <div class="flex flex-col gap-3">
      <RouterLink
        :to="{ name: 'orgs', params: { action: 'list' } }"
        class="inline-flex w-fit items-center gap-1 rounded-sm text-sm text-muted-foreground hover:text-foreground-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ArrowLeft aria-hidden="true" class="size-4" />
        Organisations
      </RouterLink>
      <PageHeading
        description="An organisation groups projects, members, integrations and policies. You can invite people once it exists."
      >
        New <BrandEmphasis>organisation</BrandEmphasis>
      </PageHeading>
    </div>

    <Card class="rounded-card shadow-card">
      <CardContent class="pt-6">
        <form class="flex flex-col gap-6" novalidate @submit="onSubmit">
          <FormField v-slot="{ componentField }" name="name">
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  v-bind="filterUndefined(componentField)"
                  type="text"
                  autocomplete="organization"
                  placeholder="Research lab"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="description">
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  v-bind="filterUndefined(componentField)"
                  rows="4"
                  placeholder="What this organisation works on"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <div class="flex justify-end">
            <Button type="submit" :disabled="submitting">
              <LoaderCircle
                v-if="submitting"
                aria-hidden="true"
                class="animate-spin motion-reduce:animate-none"
              />
              Create organisation
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

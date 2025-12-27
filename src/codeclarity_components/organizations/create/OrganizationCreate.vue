<script setup lang="ts">
import InfoCard from "@/base_components/ui/cards/InfoCard.vue";
import { Button } from "@/shadcn/ui/button";
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
import { Icon } from "@iconify/vue";
import { useForm } from "vee-validate";
import { toast } from "vue-sonner";
import { ZodError } from "zod";
import * as z from "zod";
import { OrgRepository } from "../organization.repository";

const authStore = useAuthStore();
const orgRepo: OrgRepository = new OrgRepository();

const formSchema = z.object({
  name: z
    .string()
    .min(1, { message: "A name is required." })
    .min(2, { message: "The name must be at least 2 characters." }),
  description: z
    .string()
    .min(1, { message: "A description is required." })
    .min(2, { message: "The description must be at least 2 characters." }),
});
type FormValues = z.infer<typeof formSchema>;

const form = useForm<FormValues>({ validationSchema: formSchema });

const onSubmit = form.handleSubmit(async (values) => {
  try {
    await orgRepo.create({
      bearerToken: authStore.getToken ?? "",
      data: {
        name: values.name,
        description: values.description,
        color_scheme: "1",
      },
      handleBusinessErrors: true,
    });
    toast.success("Organization created!");
  } catch (error) {
    if (error instanceof ZodError) {
      toast.error("Error during creation", {
        description: error.message,
      });
    } else if (error instanceof BusinessLogicError) {
      toast.error("Error during creation", {
        description: error.error_message,
      });
    }
  }
});
</script>
<template>
  <div class="space-y-6">
    <!-- Create Organization Form -->
    <InfoCard
      title="Create an Organization"
      description="Start collaborating with your team by creating a new organization. Manage projects, invite members, and grow together."
      icon="solar:buildings-3-bold-duotone"
      variant="primary"
    >
      <div class="mt-6">
        <form class="space-y-6" @submit="onSubmit">
          <!-- Name Field -->
          <FormField v-slot="{ componentField }" name="name">
            <FormItem>
              <FormLabel
                class="block text-sm font-semibold text-theme-black mb-2"
              >
                Organization Name <span class="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <div class="relative">
                  <Input
                    v-bind="filterUndefined(componentField)"
                    type="text"
                    placeholder="Enter organization name..."
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all duration-200 bg-gray-50 focus:bg-white"
                  />
                  <div
                    class="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <Icon
                      icon="solar:buildings-3-bold-duotone"
                      class="w-5 h-5 text-theme-gray"
                    />
                  </div>
                </div>
              </FormControl>
              <FormMessage class="text-sm text-red-600 mt-1" />
            </FormItem>
          </FormField>

          <!-- Description Field -->
          <FormField v-slot="{ componentField }" name="description">
            <FormItem>
              <FormLabel
                class="block text-sm font-semibold text-theme-black mb-2"
              >
                Description <span class="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <div class="relative">
                  <Textarea
                    v-bind="filterUndefined(componentField)"
                    rows="4"
                    placeholder="Describe your organization's purpose and goals..."
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                  />
                  <div class="absolute top-3 right-3">
                    <Icon
                      icon="solar:document-text-bold-duotone"
                      class="w-5 h-5 text-theme-gray"
                    />
                  </div>
                </div>
              </FormControl>
              <FormMessage class="text-sm text-red-600 mt-1" />
            </FormItem>
          </FormField>

          <!-- Submit Button -->
          <div class="pt-6 border-t border-gray-100">
            <Button
              type="submit"
              class="w-full bg-theme-primary hover:bg-theme-primary-dark text-white font-semibold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Icon icon="solar:add-circle-bold-duotone" class="w-5 h-5" />
              Create Organization
            </Button>
          </div>
        </form>
      </div>
    </InfoCard>

    <!-- Benefits Section -->
    <InfoCard
      title="Organization Benefits"
      description="Discover what you can achieve with your new organization"
      icon="solar:star-bold-duotone"
      variant="default"
    >
      <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="text-center">
          <div
            class="w-12 h-12 bg-theme-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4"
          >
            <Icon
              icon="solar:users-group-rounded-bold-duotone"
              class="w-6 h-6 text-theme-primary"
            />
          </div>
          <h3 class="text-lg font-semibold text-theme-black mb-2">
            Team Collaboration
          </h3>
          <p class="text-theme-gray text-sm">
            Invite team members and collaborate on projects together with shared
            access and permissions.
          </p>
        </div>

        <div class="text-center">
          <div
            class="w-12 h-12 bg-theme-black/10 rounded-lg flex items-center justify-center mx-auto mb-4"
          >
            <Icon
              icon="solar:folder-check-bold-duotone"
              class="w-6 h-6 text-theme-black"
            />
          </div>
          <h3 class="text-lg font-semibold text-theme-black mb-2">
            Project Management
          </h3>
          <p class="text-theme-gray text-sm">
            Organize and manage multiple projects under one organization with
            centralized oversight.
          </p>
        </div>

        <div class="text-center">
          <div
            class="w-12 h-12 bg-theme-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4"
          >
            <Icon
              icon="solar:shield-check-bold-duotone"
              class="w-6 h-6 text-theme-primary"
            />
          </div>
          <h3 class="text-lg font-semibold text-theme-black mb-2">
            Enhanced Security
          </h3>
          <p class="text-theme-gray text-sm">
            Benefit from organization-level security settings and access
            controls for better protection.
          </p>
        </div>
      </div>
    </InfoCard>

    <!-- Getting Started Guide -->
    <InfoCard
      title="Getting Started"
      description="Here's what you can do after creating your organization"
      icon="solar:map-bold-duotone"
      variant="default"
    >
      <div class="mt-6 space-y-4">
        <div class="flex items-start gap-3">
          <div
            class="w-8 h-8 bg-theme-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
          >
            <span class="text-sm font-bold text-theme-primary">1</span>
          </div>
          <div>
            <h4 class="font-semibold text-theme-black mb-1">
              Invite Team Members
            </h4>
            <p class="text-sm text-theme-gray">
              Send invitations to your team members to start collaborating on
              projects.
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div
            class="w-8 h-8 bg-theme-black/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
          >
            <span class="text-sm font-bold text-theme-black">2</span>
          </div>
          <div>
            <h4 class="font-semibold text-theme-black mb-1">
              Set Up Integrations
            </h4>
            <p class="text-sm text-theme-gray">
              Connect your GitHub or GitLab repositories to start analyzing your
              code.
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div
            class="w-8 h-8 bg-theme-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
          >
            <span class="text-sm font-bold text-theme-primary">3</span>
          </div>
          <div>
            <h4 class="font-semibold text-theme-black mb-1">
              Configure Policies
            </h4>
            <p class="text-sm text-theme-gray">
              Define security policies and analysis rules to match your
              organization's needs.
            </p>
          </div>
        </div>
      </div>
    </InfoCard>
  </div>
</template>

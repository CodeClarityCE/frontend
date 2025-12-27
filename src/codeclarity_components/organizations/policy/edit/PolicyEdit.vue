<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { storeToRefs } from "pinia";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { onBeforeMount, ref, type Ref, computed } from "vue";
import { useRoute } from "vue-router";
import { z } from "zod";
import InfoCard from "@/base_components/ui/cards/InfoCard.vue";
import {
  isMemberRoleGreaterOrEqualTo,
  MemberRole,
  type Organization,
} from "@/codeclarity_components/organizations/organization.entity";
import { LicensePolicyType } from "@/codeclarity_components/organizations/policy/license_policy.entity";
import { LicensePolicyRepository } from "@/codeclarity_components/organizations/policy/license_policy.repository";
import HeaderItem from "@/codeclarity_components/organizations/subcomponents/HeaderItem.vue";
import type { License } from "@/codeclarity_components/results/licenses/License";
import { LicenseRepository } from "@/codeclarity_components/results/licenses/LicenseRepository";
import router from "@/router";
import Alert from "@/shadcn/ui/alert/Alert.vue";
import AlertDescription from "@/shadcn/ui/alert/AlertDescription.vue";
import { Badge } from "@/shadcn/ui/badge";
import Button from "@/shadcn/ui/button/Button.vue";
import Checkbox from "@/shadcn/ui/checkbox/Checkbox.vue";
import { FormField } from "@/shadcn/ui/form";
import FormControl from "@/shadcn/ui/form/FormControl.vue";
import FormItem from "@/shadcn/ui/form/FormItem.vue";
import FormLabel from "@/shadcn/ui/form/FormLabel.vue";
import FormMessage from "@/shadcn/ui/form/FormMessage.vue";
import Input from "@/shadcn/ui/input/Input.vue";
import Select from "@/shadcn/ui/select/Select.vue";
import SelectContent from "@/shadcn/ui/select/SelectContent.vue";
import SelectGroup from "@/shadcn/ui/select/SelectGroup.vue";
import SelectItem from "@/shadcn/ui/select/SelectItem.vue";
import SelectTrigger from "@/shadcn/ui/select/SelectTrigger.vue";
import SelectValue from "@/shadcn/ui/select/SelectValue.vue";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { filterUndefined } from "@/utils/form/filterUndefined";

const orgId: Ref<string> = ref("");
const orgInfo: Ref<Organization | undefined> = ref();

// Repositories
const licensePolicyRepository: LicensePolicyRepository =
  new LicensePolicyRepository();
const licenseRepository: LicenseRepository = new LicenseRepository();

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

const { defaultOrg } = storeToRefs(userStore);

// Form Data
const choices: Ref<License[]> = ref([]);
const policy_id: Ref<string> = ref("");

const error: Ref<boolean> = ref(false);
const errorCode: Ref<string> = ref("");

// Form Validation using Zod
const formSchema = z.object({
  name: z
    .string()
    .min(5, "Name must be at least 5 characters")
    .max(200, "Name must be less than 200 characters"),
  description: z
    .string()
    .max(200, "Description must be less than 200 characters")
    .optional()
    .default(""),
  type: z.string().min(1, "Please select a policy type"),
  isDefault: z.boolean().default(false),
  licenses: z.string().array().min(1, "Please select at least one license"),
});

function setOrgInfo(_orgInfo: Organization): void {
  orgInfo.value = _orgInfo;
  if (!isMemberRoleGreaterOrEqualTo(_orgInfo.role, MemberRole.ADMIN)) {
    void router.push({
      name: "orgManage",
      params: { page: "", orgId: _orgInfo.id },
    });
  }
}

// Methods
const { handleSubmit, values } = useForm({
  validationSchema: toTypedSchema(formSchema),
  initialValues: {
    isDefault: false,
    name: "",
    description: "",
    type: "",
    licenses: [],
  },
});

const onSubmit = handleSubmit(async (values): Promise<void> => {
  try {
    await licensePolicyRepository.updatePolicy({
      orgId: defaultOrg!.value!.id,
      policyId: policy_id.value,
      data: {
        name: values.name,
        description: values.description ?? "",
        type: values.type as LicensePolicyType,
        licenses: values.licenses,
        default: values.isDefault,
      },
      bearerToken: authStore.getToken ?? "",
    });
  } catch (_err) {
    error.value = true;
    if (_err instanceof BusinessLogicError) {
      errorCode.value = _err.error_code;
    }
  } finally {
    router.back();
  }
});

async function fetchLicenses(): Promise<void> {
  try {
    const resp = await licenseRepository.getAllLicenses({
      bearerToken: authStore.getToken ?? "",
    });
    choices.value = resp.data;
  } catch (_err) {
    error.value = true;
    if (_err instanceof BusinessLogicError) {
      errorCode.value = _err.error_code;
    }
  }
}

async function init(): Promise<void> {
  const url = new URL(window.location.href);
  const searchParams = url.searchParams;
  policy_id.value = searchParams.get("policyId") ?? "";

  const route = useRoute();
  const _orgId = route.params.orgId;

  if (!_orgId) {
    router.back();
  }

  if (typeof _orgId === "string") {
    orgId.value = _orgId;
  } else {
    router.back();
  }

  // Fetch licenses
  await fetchLicenses();
}

// Form validation computed property
const isFormValid = computed(() => {
  return (
    values.name &&
    values.name.length >= 5 &&
    values.type &&
    values.licenses &&
    values.licenses.length > 0
  );
});

onBeforeMount(async () => {
  await init();
});
</script>
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Page Header -->
    <HeaderItem
      v-if="orgId"
      :org-id="orgId"
      @on-org-info="setOrgInfo($event)"
    />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Page Header -->
      <InfoCard
        title="Edit License Policy"
        description="Update your license compliance rules and policy settings"
        icon="solar:shield-edit-bold"
        variant="primary"
        class="mb-8 shadow-lg"
      />

      <div class="grid lg:grid-cols-2 gap-8">
        <!-- Left Column - Configuration Form -->
        <InfoCard
          title="Policy Configuration"
          description="Update your license policy settings and rules"
          icon="solar:settings-bold"
          variant="default"
          class="shadow-md"
        >
          <Alert v-if="error" variant="destructive" class="mb-6">
            <AlertDescription class="flex flex-row gap-2 items-center">
              <Icon icon="solar:danger-triangle-bold" class="text-red-500" />
              <div v-if="errorCode" class="text-red-700">
                We encountered an error while processing the request.
              </div>
              <div v-else class="text-red-700">
                An error occurred during the processing of the request.
              </div>
            </AlertDescription>
          </Alert>

          <form class="space-y-8" @submit="onSubmit">
            <!-- Basic Information Section -->
            <div class="space-y-6">
              <!-- Name Field -->
              <FormField v-slot="{ componentField }" name="name">
                <FormItem>
                  <FormLabel
                    class="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2"
                  >
                    <Icon icon="solar:tag-bold" class="text-theme-primary" />
                    Policy Name
                    <span class="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter policy name..."
                      v-bind="filterUndefined(componentField)"
                      class="bg-white border-gray-300 focus:border-theme-primary focus:ring-theme-primary/20"
                    />
                  </FormControl>
                  <FormMessage class="text-sm text-red-600 mt-1" />
                </FormItem>
              </FormField>

              <!-- Description Field -->
              <FormField v-slot="{ componentField }" name="description">
                <FormItem>
                  <FormLabel
                    class="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2"
                  >
                    <Icon icon="solar:text-bold" class="text-theme-primary" />
                    Description
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter description..."
                      v-bind="filterUndefined(componentField)"
                      class="bg-white border-gray-300 focus:border-theme-primary focus:ring-theme-primary/20"
                    />
                  </FormControl>
                  <FormMessage class="text-sm text-red-600 mt-1" />
                </FormItem>
              </FormField>

              <!-- Policy Type Section -->
              <FormField v-slot="{ componentField }" name="type">
                <FormItem>
                  <FormLabel
                    class="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2"
                  >
                    <Icon icon="solar:shield-bold" class="text-theme-primary" />
                    Policy Type
                    <span class="text-red-500">*</span>
                  </FormLabel>
                  <Select v-bind="filterUndefined(componentField)">
                    <FormControl>
                      <SelectTrigger
                        class="bg-white border-gray-300 focus:border-theme-primary focus:ring-theme-primary/20"
                      >
                        <SelectValue placeholder="Select a policy type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem
                          :value="LicensePolicyType.WHITELIST"
                          class="hover:bg-green-50"
                        >
                          <div class="flex items-center">
                            <Icon
                              icon="solar:check-circle-bold"
                              class="w-4 h-4 text-green-600 mr-2"
                            />
                            {{ LicensePolicyType.WHITELIST }}
                          </div>
                        </SelectItem>
                        <SelectItem
                          :value="LicensePolicyType.BLACKLIST"
                          class="hover:bg-red-50"
                        >
                          <div class="flex items-center">
                            <Icon
                              icon="solar:close-circle-bold"
                              class="w-4 h-4 text-red-600 mr-2"
                            />
                            {{ LicensePolicyType.BLACKLIST }}
                          </div>
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage class="text-sm text-red-600 mt-1" />
                </FormItem>
              </FormField>

              <!-- Licenses Field -->
              <FormField v-slot="{ componentField }" name="licenses">
                <FormItem>
                  <FormLabel
                    class="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2"
                  >
                    <Icon
                      icon="solar:document-text-bold"
                      class="text-theme-primary"
                    />
                    Licenses
                    <span class="text-red-500">*</span>
                    <Badge
                      v-if="values.licenses && values.licenses.length > 0"
                      variant="outline"
                      class="ml-2"
                    >
                      {{ values.licenses.length }} selected
                    </Badge>
                  </FormLabel>
                  <Select v-bind="filterUndefined(componentField)" multiple>
                    <FormControl>
                      <SelectTrigger
                        class="bg-white border-gray-300 focus:border-theme-primary focus:ring-theme-primary/20"
                      >
                        <SelectValue placeholder="Select licenses" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem
                          v-for="license in choices"
                          :key="license.licenseId"
                          :value="license.licenseId"
                        >
                          <div class="flex items-center">
                            <span class="font-medium">{{ license.name }}</span>
                            <span
                              v-if="license.id"
                              class="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded"
                              >{{ license.id }}</span
                            >
                          </div>
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage class="text-sm text-red-600 mt-1" />
                </FormItem>
              </FormField>

              <!-- Default Policy Section -->
              <FormField
                v-slot="{ value, handleChange }"
                type="checkbox"
                name="isDefault"
              >
                <FormItem
                  class="flex flex-row items-start gap-x-4 space-y-0 rounded-lg border border-gray-200 bg-gray-50 p-4 hover:bg-gray-100 transition-colors duration-200"
                >
                  <FormControl>
                    <Checkbox :checked="value" @update:checked="handleChange" />
                  </FormControl>
                  <div class="space-y-2 leading-none">
                    <FormLabel
                      class="flex items-center gap-2 text-base font-semibold text-gray-900"
                    >
                      <Icon icon="solar:star-bold" class="text-theme-primary" />
                      Make this the default policy
                    </FormLabel>
                    <p class="text-sm text-gray-600">
                      When enabled, this policy will be automatically applied to
                      new projects in your organization.
                    </p>
                  </div>
                </FormItem>
              </FormField>
            </div>

            <!-- Submit Button Section -->
            <div class="border-t border-gray-100 pt-6">
              <div class="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  class="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                  @click="$router.back()"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  :disabled="!isFormValid"
                  class="px-8 py-3 bg-theme-black hover:bg-theme-gray text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon icon="solar:shield-check-bold" class="w-5 h-5" />
                  Update Policy
                </Button>
              </div>
            </div>
          </form>
        </InfoCard>

        <!-- Right Column - Information -->
        <div class="space-y-6">
          <InfoCard
            title="Policy Information"
            description="Current policy details and information"
            icon="solar:info-circle-bold"
            variant="primary"
            class="shadow-md"
          >
            <div class="space-y-4">
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="flex items-center gap-3 mb-3">
                  <div
                    class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"
                  >
                    <Icon
                      icon="solar:info-circle-bold"
                      class="text-white text-sm"
                    />
                  </div>
                  <h4 class="font-semibold text-blue-800">Policy ID</h4>
                </div>
                <p class="text-sm text-blue-700 font-mono">
                  {{ policy_id || "Loading..." }}
                </p>
              </div>
            </div>
          </InfoCard>

          <InfoCard
            title="Policy Types"
            description="Understanding license policy types"
            icon="solar:shield-bold"
            variant="default"
            class="shadow-md"
          >
            <div class="space-y-6">
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex items-center gap-3 mb-3">
                  <div
                    class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                  >
                    <Icon
                      icon="solar:check-circle-bold"
                      class="text-white text-sm"
                    />
                  </div>
                  <h4 class="font-semibold text-green-800">Whitelist Policy</h4>
                </div>
                <p class="text-sm text-green-700">
                  Only allows projects to use the licenses you specify. All
                  other licenses will be flagged as violations.
                </p>
              </div>

              <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="flex items-center gap-3 mb-3">
                  <div
                    class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <Icon
                      icon="solar:close-circle-bold"
                      class="text-white text-sm"
                    />
                  </div>
                  <h4 class="font-semibold text-red-800">Blacklist Policy</h4>
                </div>
                <p class="text-sm text-red-700">
                  Prohibits the use of specific licenses you select. All other
                  licenses will be considered acceptable.
                </p>
              </div>
            </div>
          </InfoCard>

          <InfoCard
            title="Best Practices"
            description="Tips for managing license policies effectively"
            icon="solar:lightbulb-bold"
            variant="default"
            class="shadow-md"
          >
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <div
                  class="shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                >
                  <Icon icon="solar:check-bold" class="text-white text-xs" />
                </div>
                <div>
                  <h5 class="font-medium text-gray-900 mb-1">
                    Keep policies up to date
                  </h5>
                  <p class="text-sm text-gray-600">
                    Regular updates ensure compliance with changing requirements
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <div
                  class="shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                >
                  <Icon icon="solar:check-bold" class="text-white text-xs" />
                </div>
                <div>
                  <h5 class="font-medium text-gray-900 mb-1">
                    Test before applying
                  </h5>
                  <p class="text-sm text-gray-600">
                    Review changes with your team before making them default
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <div
                  class="shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                >
                  <Icon icon="solar:check-bold" class="text-white text-xs" />
                </div>
                <div>
                  <h5 class="font-medium text-gray-900 mb-1">
                    Document changes
                  </h5>
                  <p class="text-sm text-gray-600">
                    Keep track of policy modifications for auditing purposes
                  </p>
                </div>
              </div>
            </div>
          </InfoCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ArrowLeft, LoaderCircle } from "@lucide/vue";
import type { ColumnDef } from "@tanstack/vue-table";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { computed, onBeforeMount, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { z } from "zod";

import { DataTable } from "@/base_components/data-table";
import { BrandEmphasis, PageHeading } from "@/base_components/page";
import type { License } from "@/codeclarity_components/results/licenses/License";
import { LicenseRepository } from "@/codeclarity_components/results/licenses/LicenseRepository";
import router from "@/router";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import { Card, CardContent } from "@/shadcn/ui/card";
import { Checkbox } from "@/shadcn/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shadcn/ui/form";
import { Input } from "@/shadcn/ui/input";
import { Textarea } from "@/shadcn/ui/textarea";
import { useAuthStore } from "@/stores/auth";
import { filterUndefined } from "@/utils/form/filterUndefined";
import { guardFormSubmit } from "@/utils/form/guardSubmit";
import { serverFeatures } from "@/utils/server-features";
import { successToast } from "@/utils/toasts";

import { LicensePolicyType } from "../license_policy.entity";
import { LicensePolicyRepository } from "../license_policy.repository";

const props = defineProps<{ orgId: string; mode?: string }>();

const licensePolicyRepository = new LicensePolicyRepository();
const licenseRepository = new LicenseRepository();
const authStore = useAuthStore();
const route = useRoute();

const isEdit = computed(() => props.mode === "edit");
// The server cannot change a saved policy yet, so an edit link only shows it.
const readOnly = computed(
  () => isEdit.value && !serverFeatures.licensePolicyChanges,
);
const policyId = computed(() =>
  typeof route.query.policyId === "string" ? route.query.policyId : "",
);

const licenses = ref<License[]>([]);
const loadingLicenses = ref(true);
const submitting = ref(false);
const failure = ref("");
// An edit form stays disabled until its policy has loaded
const policyLoaded = ref(false);
const formDisabled = computed(
  () => readOnly.value || (isEdit.value && !policyLoaded.value),
);

const formSchema = z.object({
  name: z
    .string({ required_error: "A name is required" })
    .trim()
    .min(1, "A name is required")
    .min(5, "At least 5 characters")
    .max(200, "At most 200 characters"),
  description: z.string().max(200, "At most 200 characters").default(""),
  isDefault: z.boolean().default(false),
  licenses: z.string().array().min(1, "Pick at least one license"),
});

const { handleSubmit, isSubmitting, values, setValues, setFieldValue } =
  useForm({
    validationSchema: toTypedSchema(formSchema),
    initialValues: {
      name: "",
      description: "",
      isDefault: false,
      licenses: [],
    },
  });

const selected = computed(() => new Set(values.licenses ?? []));

function toggleLicense(id: string, on: boolean): void {
  const next = new Set(selected.value);
  if (on) next.add(id);
  else next.delete(id);
  setFieldValue("licenses", [...next]);
}

const licenseFilter = ref("");

// Exact identifier or name matches come first, then the rest in list order.
const orderedLicenses = computed(() => {
  const term = licenseFilter.value.trim().toLowerCase();
  if (term === "") return licenses.value;
  const exact = (license: License): boolean =>
    license.licenseId?.toLowerCase() === term ||
    license.name?.toLowerCase() === term;
  return [
    ...licenses.value.filter(exact),
    ...licenses.value.filter((license) => !exact(license)),
  ];
});

const columns: ColumnDef<License, unknown>[] = [
  {
    id: "include",
    header: "Include",
    enableSorting: false,
    enableGlobalFilter: false,
  },
  { id: "licenseId", accessorKey: "licenseId", header: "Identifier" },
  { id: "name", accessorKey: "name", header: "Name" },
];

const listRoute = computed(() => ({
  name: "orgs",
  params: { action: "manage", page: "policies", orgId: props.orgId },
}));

const onSubmit = guardFormSubmit(
  { handleSubmit, isSubmitting, values },
  async (form): Promise<void> => {
    if (!authStore.getToken || submitting.value || formDisabled.value) return;
    submitting.value = true;
    failure.value = "";
    const data = {
      name: form.name,
      description: form.description,
      // Analyses flag the picked licenses; the server stores no type.
      type: LicensePolicyType.BLACKLIST,
      licenses: form.licenses,
      default: form.isDefault,
    };
    try {
      if (isEdit.value) {
        await licensePolicyRepository.updatePolicy({
          orgId: props.orgId,
          policyId: policyId.value,
          data,
          bearerToken: authStore.getToken,
          handleBusinessErrors: true,
        });
        successToast("License policy saved");
      } else {
        await licensePolicyRepository.createPolicy({
          orgId: props.orgId,
          data,
          bearerToken: authStore.getToken,
          handleBusinessErrors: true,
        });
        successToast("License policy created");
      }
      void router.push(listRoute.value);
    } catch {
      failure.value = isEdit.value
        ? "The license policy could not be saved."
        : "The license policy could not be created.";
    } finally {
      submitting.value = false;
    }
  },
);

async function loadLicenses(): Promise<void> {
  try {
    const response = await licenseRepository.getAllLicenses({
      bearerToken: authStore.getToken ?? "",
      handleBusinessErrors: true,
    });
    licenses.value = response.data;
  } catch {
    failure.value = "The license list could not be loaded.";
  } finally {
    loadingLicenses.value = false;
  }
}

async function loadPolicy(): Promise<void> {
  if (!isEdit.value || !authStore.getToken) return;
  if (!policyId.value) {
    failure.value = "The license policy could not be loaded.";
    return;
  }
  try {
    const response = await licensePolicyRepository.getLicensePolicy({
      orgId: props.orgId,
      policyId: policyId.value,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
    });
    const policy = response.data;
    setValues(
      {
        name: policy.name,
        description: policy.description ?? "",
        isDefault: policy.default,
        licenses: policy.content ?? [],
      },
      false,
    );
    policyLoaded.value = true;
  } catch {
    failure.value = "The license policy could not be loaded.";
  }
}

onBeforeMount(() => {
  void loadLicenses();
  void loadPolicy();
});
</script>

<template>
  <div class="flex max-w-4xl flex-col gap-8">
    <div class="flex flex-col gap-3">
      <RouterLink
        :to="listRoute"
        class="inline-flex w-fit items-center gap-1 rounded-sm text-sm text-muted-foreground hover:text-foreground-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ArrowLeft aria-hidden="true" class="size-4" />
        Policies
      </RouterLink>
      <PageHeading
        description="Pick the licenses your projects should not use."
      >
        <template v-if="readOnly">
          <BrandEmphasis>License policy</BrandEmphasis>
        </template>
        <template v-else-if="isEdit">
          Edit <BrandEmphasis>license policy</BrandEmphasis>
        </template>
        <template v-else>
          New <BrandEmphasis>license policy</BrandEmphasis>
        </template>
      </PageHeading>
    </div>

    <Alert v-if="failure" variant="destructive">
      <AlertDescription>{{ failure }}</AlertDescription>
    </Alert>

    <Alert v-else-if="readOnly">
      <AlertDescription>
        Changing a license policy is not available yet. You can create a new
        policy instead.
      </AlertDescription>
    </Alert>

    <Card class="rounded-card shadow-card">
      <CardContent class="pt-6">
        <form novalidate @submit="onSubmit">
          <fieldset
            class="flex min-w-0 flex-col gap-6"
            :disabled="formDisabled"
          >
            <FormField v-slot="{ componentField }" name="name">
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="No copyleft licenses"
                    v-bind="filterUndefined(componentField)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="description">
              <FormItem>
                <FormLabel>Description (optional)</FormLabel>
                <FormControl>
                  <Textarea rows="2" v-bind="filterUndefined(componentField)" />
                </FormControl>
                <FormDescription>
                  Tell your team what this policy is for.
                </FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField
              v-slot="{ value, handleChange }"
              type="checkbox"
              name="isDefault"
            >
              <FormItem class="flex flex-row items-start gap-3 space-y-0">
                <FormControl>
                  <Checkbox
                    :model-value="value"
                    @update:model-value="handleChange"
                  />
                </FormControl>
                <div class="flex flex-col gap-1">
                  <FormLabel>Make this the default policy</FormLabel>
                  <FormDescription>
                    New projects in this organisation use it.
                  </FormDescription>
                </div>
              </FormItem>
            </FormField>

            <FormField name="licenses">
              <FormItem>
                <fieldset class="flex flex-col gap-3">
                  <legend class="text-sm font-medium leading-none">
                    Licenses
                  </legend>
                  <p class="text-sm text-muted-foreground">
                    Projects that use a picked license are flagged.
                  </p>
                  <p role="status" class="text-sm text-muted-foreground">
                    {{ selected.size }}
                    {{ selected.size === 1 ? "license" : "licenses" }} picked
                  </p>
                  <DataTable
                    v-model:filter="licenseFilter"
                    :columns="columns"
                    :data="orderedLicenses"
                    :loading="loadingLicenses"
                    :row-key="(license: License) => license.licenseId"
                    :page-size="10"
                    caption="Licenses"
                    filter-label="Filter licenses"
                    empty-text="No licenses match."
                  >
                    <template #cell-include="{ row }">
                      <Checkbox
                        :model-value="selected.has(row.licenseId)"
                        :aria-label="`Include ${row.licenseId}`"
                        @update:model-value="
                          toggleLicense(row.licenseId, $event === true)
                        "
                      />
                    </template>
                  </DataTable>
                </fieldset>
                <FormMessage />
              </FormItem>
            </FormField>

            <div class="flex justify-end gap-3">
              <Button variant="outline" :as="RouterLink" :to="listRoute">
                {{ readOnly ? "Back" : "Cancel" }}
              </Button>
              <Button
                v-if="!readOnly"
                type="submit"
                :disabled="submitting || isSubmitting || formDisabled"
              >
                <LoaderCircle
                  v-if="submitting"
                  aria-hidden="true"
                  class="animate-spin motion-reduce:animate-none"
                />
                {{ isEdit ? "Save policy" : "Create policy" }}
              </Button>
            </div>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

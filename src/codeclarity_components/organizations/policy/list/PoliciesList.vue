<script lang="ts" setup>
import { Plus } from "@lucide/vue";
import { computed, onBeforeMount, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";

import { OwlEmptyState, StatTile } from "@/base_components/page";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import { useAuthStore } from "@/stores/auth";
import { BusinessLogicError } from "@/utils/api/BaseRepository";

import type { LicensePolicy } from "../license_policy.entity";
import { LicensePolicyRepository } from "../license_policy.repository";
import PolicyTable from "../PolicyTable.vue";

const props = defineProps<{
  page: string;
  orgId: string;
}>();

const licensePolicyRepository = new LicensePolicyRepository();
const router = useRouter();
const authStore = useAuthStore();

const policies = ref<LicensePolicy[]>([]);
const loaded = ref(false);
const error = ref("");

const createRoute = computed(() => ({
  name: "orgs",
  params: { action: "add", page: "policy", orgId: props.orgId },
}));

const licenseCount = computed(
  () => new Set(policies.value.flatMap((policy) => policy.content ?? [])).size,
);

async function loadPolicies(): Promise<void> {
  if (!authStore.getToken) return;
  error.value = "";
  try {
    const response = await licensePolicyRepository.getLicensePolicies({
      orgId: props.orgId,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
      page: 0,
      entries_per_page: 100,
      search_key: "",
    });
    policies.value = response.data ?? [];
  } catch (err) {
    error.value =
      err instanceof BusinessLogicError && err.error_message
        ? err.error_message
        : "The license policies could not be loaded.";
  } finally {
    loaded.value = true;
  }
}

function handleEdit(policy: LicensePolicy): void {
  void router.push({
    name: "orgs",
    params: { action: "edit", page: "policy", orgId: props.orgId },
    query: { policyId: policy.id },
  });
}

onBeforeMount(() => void loadPolicies());
</script>
<template>
  <section aria-labelledby="license-policies-title" class="flex flex-col gap-6">
    <div class="flex items-start justify-between gap-6">
      <div class="flex flex-col gap-1">
        <h2
          id="license-policies-title"
          class="text-xl font-semibold text-foreground-strong"
        >
          License policies
        </h2>
        <p class="text-sm text-muted-foreground">
          Allow or block licenses in the projects of this organisation.
        </p>
      </div>
      <Button :as="RouterLink" :to="createRoute">
        <Plus aria-hidden="true" />
        New license policy
      </Button>
    </div>

    <ul
      v-if="loaded && policies.length > 0"
      aria-label="License policy totals"
      class="grid grid-cols-2 gap-4 lg:max-w-xl"
    >
      <StatTile label="Policies" :value="policies.length" />
      <StatTile label="Licenses covered" :value="licenseCount" />
    </ul>

    <Alert v-if="error" variant="destructive">
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <OwlEmptyState
      v-else-if="loaded && policies.length === 0"
      title="No license policies yet"
      description="A license policy flags dependencies whose license your organisation does not accept."
    >
      <Button :as="RouterLink" :to="createRoute" arrow>
        Create a license policy
      </Button>
    </OwlEmptyState>

    <PolicyTable
      v-else
      :policies="policies"
      :loading="!loaded"
      caption="License policies"
      content-label="Licenses"
      @edit="handleEdit"
    />
  </section>
</template>

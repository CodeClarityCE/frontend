<script lang="ts" setup>
import { Plus } from "@lucide/vue";
import { computed, onBeforeMount, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";

import { OwlEmptyState, StatTile } from "@/base_components/page";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { Spinner } from "@/shadcn/ui/spinner";
import { useAuthStore } from "@/stores/auth";
import { errorToast, successToast } from "@/utils/toasts";

import type { LicensePolicy } from "../license_policy.entity";
import { LicensePolicyRepository } from "../license_policy.repository";
import PolicyTable from "../PolicyTable.vue";

const props = defineProps<{
  page: string;
  orgId: string;
  // Only admins get the create, edit and delete actions.
  canManage?: boolean;
}>();

const licensePolicyRepository = new LicensePolicyRepository();
const router = useRouter();
const authStore = useAuthStore();

const policies = ref<LicensePolicy[]>([]);
const loaded = ref(false);
const error = ref("");

const policyToDelete = ref<LicensePolicy | null>(null);
const deleting = ref(false);
const deleteOpen = computed({
  get: () => policyToDelete.value !== null,
  set: (open: boolean) => {
    if (!open && !deleting.value) policyToDelete.value = null;
  },
});

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
  } catch {
    // The server's reason can be a raw request path, so it is not shown
    error.value = "The license policies could not be loaded.";
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

async function confirmDelete(): Promise<void> {
  const policy = policyToDelete.value;
  if (!policy || !authStore.getToken) return;
  deleting.value = true;
  try {
    await licensePolicyRepository.deletePolicy({
      orgId: props.orgId,
      policyId: policy.id,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
    });
    policies.value = policies.value.filter((p) => p.id !== policy.id);
    successToast(`Deleted ${policy.name}`);
  } catch {
    errorToast("The policy could not be deleted");
  } finally {
    deleting.value = false;
    policyToDelete.value = null;
  }
}

onBeforeMount(() => void loadPolicies());
</script>
<template>
  <section aria-labelledby="license-policies-title" class="flex flex-col gap-6">
    <div class="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
      <div class="flex min-w-0 flex-1 basis-80 flex-col gap-1">
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
      <Button v-if="canManage" :as="RouterLink" :to="createRoute">
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
      <Button v-if="canManage" :as="RouterLink" :to="createRoute" arrow>
        Create a license policy
      </Button>
    </OwlEmptyState>

    <PolicyTable
      v-else
      :policies="policies"
      :loading="!loaded"
      caption="License policies"
      content-label="Licenses"
      :can-edit="canManage"
      :can-delete="canManage"
      @edit="handleEdit"
      @delete="policyToDelete = $event"
    />

    <Dialog v-model:open="deleteOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {{ policyToDelete?.name }}?</DialogTitle>
          <DialogDescription>
            New analyses will no longer flag its
            {{ policyToDelete?.content?.length ?? 0 }} licenses. This cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            :disabled="deleting"
            @click="deleteOpen = false"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            :disabled="deleting"
            @click="confirmDelete"
          >
            <Spinner v-if="deleting" />
            Delete policy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
</template>

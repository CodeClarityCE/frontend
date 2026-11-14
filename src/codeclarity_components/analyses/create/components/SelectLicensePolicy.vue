<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

import TextLink from "@/codeclarity_components/authentication/layout/TextLink.vue";
import type { LicensePolicy } from "@/codeclarity_components/organizations/policy/license_policy.entity";
import { LicensePolicyRepository } from "@/codeclarity_components/organizations/policy/license_policy.repository";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";

import PolicyRadioGroup from "./PolicyRadioGroup.vue";

const user = useUserStore();
const auth = useAuthStore();
const repository = new LicensePolicyRepository();

// The disallowed licenses of the chosen policy, empty for no policy.
const selected_license_policy = defineModel<string[]>(
  "selected_license_policy",
  { default: () => [] },
);

const policies = ref<LicensePolicy[]>([]);
const selectedId = ref<string | null>(null);
const loading = ref(true);
const failed = ref(false);

watch(selectedId, (id) => {
  selected_license_policy.value =
    policies.value.find((policy) => policy.id === id)?.content ?? [];
});

async function load(): Promise<void> {
  const orgId = user.defaultOrg?.id;
  if (!orgId || !auth.getToken) return;
  try {
    const response = await repository.getLicensePolicies({
      orgId,
      page: 0,
      entries_per_page: 0,
      search_key: "",
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
    });
    policies.value = response.data;
    selectedId.value =
      policies.value.find((policy) => policy.default)?.id ?? null;
  } catch {
    failed.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(() => void load());
</script>

<template>
  <PolicyRadioGroup
    v-model="selectedId"
    label="License policy"
    description="Licenses a policy disallows are flagged in the results."
    content-label="Disallowed"
    no-policy-hint="Every license is reported without restrictions."
    :policies="policies"
    :loading="loading"
    :failed="failed"
  >
    <template #empty>
      No license policies yet.
      <TextLink
        :to="{
          name: 'orgs',
          params: { action: 'add', page: 'policy', orgId: user.defaultOrg?.id },
        }"
      >
        Create one
      </TextLink>
      to restrict licenses.
    </template>
  </PolicyRadioGroup>
</template>

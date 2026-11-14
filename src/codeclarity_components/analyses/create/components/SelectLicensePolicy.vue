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
// Large enough that one request usually returns every policy.
const FETCH_PAGE_SIZE = 100;
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

async function fetchAll(
  orgId: string,
  token: string,
): Promise<LicensePolicy[]> {
  const all: LicensePolicy[] = [];
  for (let page = 0; ; page++) {
    const response = await repository.getLicensePolicies({
      orgId,
      page,
      entries_per_page: FETCH_PAGE_SIZE,
      search_key: "",
      bearerToken: token,
      handleBusinessErrors: true,
    });
    all.push(...response.data);
    if (page + 1 >= response.total_pages || response.data.length === 0) {
      return all;
    }
  }
}

async function load(): Promise<void> {
  const orgId = user.defaultOrg?.id;
  if (!orgId || !auth.getToken) return;
  try {
    policies.value = await fetchAll(orgId, auth.getToken);
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

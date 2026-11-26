import { type Ref, ref } from "vue";

import { useAuthStore } from "@/stores/auth";

// Loads a list of policies and keeps its loaded flag and a plain error message.
export function usePolicyList<T>(
  fetchPolicies: (bearerToken: string) => Promise<{ data?: T[] | null }>,
  failureMessage: string,
): {
  policies: Ref<T[]>;
  loaded: Ref<boolean>;
  error: Ref<string>;
  loadPolicies: () => Promise<void>;
} {
  const authStore = useAuthStore();
  const policies = ref([]) as Ref<T[]>;
  const loaded = ref(false);
  const error = ref("");

  async function loadPolicies(): Promise<void> {
    if (!authStore.getToken) return;
    error.value = "";
    try {
      const response = await fetchPolicies(authStore.getToken);
      policies.value = response.data ?? [];
    } catch {
      // The server's reason can be a raw request path, so it is not shown
      error.value = failureMessage;
    } finally {
      loaded.value = true;
    }
  }

  return { policies, loaded, error, loadPolicies };
}

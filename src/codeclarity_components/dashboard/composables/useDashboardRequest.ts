import { reactive } from "vue";

/** One dashboard request that several cards can share. */
export interface DashboardRequest<T> {
  data: T | null;
  loading: boolean;
  error: boolean;
  /** Sends the request again; never throws */
  run: () => Promise<void>;
}

export function useDashboardRequest<T>(
  load: () => Promise<T>,
): DashboardRequest<T> {
  const request = reactive({
    data: null as T | null,
    loading: false,
    error: false,
    run: async (): Promise<void> => {
      request.loading = true;
      request.error = false;
      try {
        request.data = await load();
      } catch {
        request.data = null;
        request.error = true;
      } finally {
        request.loading = false;
      }
    },
  }) as DashboardRequest<T>;
  return request;
}

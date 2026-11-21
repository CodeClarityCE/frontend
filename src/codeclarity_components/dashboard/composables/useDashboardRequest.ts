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

/** A shared dashboard request narrowed by filters that its cards can change. */
export interface FilteredDashboardRequest<T, F> extends DashboardRequest<T> {
  filters: F;
  /** Replaces the filters and sends the request again; never throws */
  filter: (filters: F) => Promise<void>;
}

export function useFilteredDashboardRequest<T, F extends object>(
  load: (filters: F) => Promise<T>,
  initial: F,
): FilteredDashboardRequest<T, F> {
  const request = useDashboardRequest(
    async () => await load(request.filters),
  ) as FilteredDashboardRequest<T, F>;
  // Set on the reactive request, so the filters are reactive too.
  request.filters = initial;
  request.filter = async (filters: F): Promise<void> => {
    request.filters = filters;
    await request.run();
  };
  return request;
}

import {
  computed,
  type ComputedRef,
  onMounted,
  onUnmounted,
  type Ref,
  ref,
} from "vue";

import { DatasetsRepository } from "@/codeclarity_components/datasets/datasets.repository";
import {
  type Experiment,
  ExperimentStatus,
  isExperimentActive,
  type PublishedVersion,
} from "@/codeclarity_components/experiments/experiment.entity";
import { ExperimentsRepository } from "@/codeclarity_components/experiments/experiments.repository";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";

/** How many recent items each list shows */
const RECENT_COUNT = 5;
/** Finished Experiments whose Published results are looked up */
const PUBLISHED_LOOKUP_COUNT = 10;
/** The API's largest page; the newest Experiments come first */
const EXPERIMENTS_PAGE_SIZE = 100;
/** How often progress refreshes while an Experiment is in progress */
const POLL_INTERVAL_MS = 10_000;

/** One Published results version, with the Experiment it belongs to. */
export interface RecentPublishedResult {
  experiment: Experiment;
  version: PublishedVersion;
}

function time(date: Date | string | null | undefined): number {
  return date ? new Date(date).getTime() : 0;
}

function newestFirst<T>(items: T[], dateOf: (item: T) => number): T[] {
  return [...items].sort((a, b) => dateOf(b) - dateOf(a));
}

function finishedOn(experiment: Experiment): number {
  return time(experiment.ended_on ?? experiment.created_on);
}

/**
 * The Dashboard's Research data, from the Datasets, Experiments and Published
 * results endpoints (the Dashboard endpoint has none of it).
 */
export function useResearchOverview(): {
  loaded: Ref<boolean>;
  hasError: Ref<boolean>;
  hasDatasets: Ref<boolean>;
  inProgress: ComputedRef<Experiment[]>;
  recentlyFinished: ComputedRef<Experiment[]>;
  recentPublished: Ref<RecentPublishedResult[]>;
  reload: () => Promise<void>;
} {
  const userStore = useUserStore();
  const auth = useAuthStore();
  const datasetsRepository = new DatasetsRepository();
  const experimentsRepository = new ExperimentsRepository();

  const loaded = ref(false);
  const hasError = ref(false);
  const hasDatasets = ref(false);
  const experiments = ref<Experiment[]>([]);
  const recentPublished = ref<RecentPublishedResult[]>([]);
  let pollTimer: ReturnType<typeof setTimeout> | undefined;

  const inProgress = computed(() =>
    newestFirst(experiments.value.filter(isExperimentActive), (e) =>
      time(e.created_on),
    ),
  );

  const recentlyFinished = computed(() =>
    newestFirst(
      experiments.value.filter((e) => !isExperimentActive(e)),
      finishedOn,
    ).slice(0, RECENT_COUNT),
  );

  async function loadPublished(orgId: string, token: string): Promise<void> {
    // Only a COMPLETED Experiment can have Published results.
    const completed = newestFirst(
      experiments.value.filter((e) => e.status === ExperimentStatus.COMPLETED),
      finishedOn,
    ).slice(0, PUBLISHED_LOOKUP_COUNT);
    const lists = await Promise.all(
      completed.map(async (experiment) => {
        const response = await experimentsRepository.getPublishedVersions({
          orgId,
          experimentId: experiment.id,
          bearerToken: token,
          handleBusinessErrors: true,
        });
        return response.data.map((version) => ({ experiment, version }));
      }),
    );
    recentPublished.value = newestFirst(lists.flat(), (item) =>
      time(item.version.published_on),
    ).slice(0, RECENT_COUNT);
  }

  async function loadExperiments(orgId: string, token: string): Promise<void> {
    const response = await experimentsRepository.getExperiments({
      orgId,
      pagination: { page: 0, entries_per_page: EXPERIMENTS_PAGE_SIZE },
      bearerToken: token,
      handleBusinessErrors: true,
    });
    experiments.value = response.data;
  }

  async function reload(): Promise<void> {
    const orgId = userStore.getDefaultOrg?.id;
    const token = auth.getToken;
    if (!orgId || !token) return;

    try {
      const [datasets] = await Promise.all([
        datasetsRepository.getDatasets({
          orgId,
          pagination: { page: 0, entries_per_page: 1 },
          bearerToken: token,
          handleBusinessErrors: true,
        }),
        loadExperiments(orgId, token),
      ]);
      hasDatasets.value = datasets.total_entries > 0;
      await loadPublished(orgId, token);
      hasError.value = false;
    } catch {
      hasError.value = true;
    } finally {
      loaded.value = true;
      schedulePoll(orgId, token);
    }
  }

  // Refreshes progress only; the lists below it change when a run ends.
  function schedulePoll(orgId: string, token: string): void {
    clearTimeout(pollTimer);
    if (inProgress.value.length === 0) return;
    pollTimer = setTimeout(() => {
      const wasActive = inProgress.value.length;
      void loadExperiments(orgId, token)
        .then(async () => {
          if (inProgress.value.length !== wasActive) {
            await loadPublished(orgId, token);
          }
        })
        .catch(() => undefined)
        .finally(() => schedulePoll(orgId, token));
    }, POLL_INTERVAL_MS);
  }

  onMounted(() => void reload());
  onUnmounted(() => clearTimeout(pollTimer));

  return {
    loaded,
    hasError,
    hasDatasets,
    inProgress,
    recentlyFinished,
    recentPublished,
    reload,
  };
}

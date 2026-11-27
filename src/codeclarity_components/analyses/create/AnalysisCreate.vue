<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { ArrowLeft, ExternalLink, FolderArchive, Plus } from "@lucide/vue";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { RouterLink } from "vue-router";
import { toast } from "vue-sonner";

import {
  BrandEmphasis,
  OwlEmptyState,
  PageHeading,
  PreviewBadge,
} from "@/base_components/page";
import { AnalysisRepository } from "@/codeclarity_components/analyses/analysis.repository";
import TextLink from "@/codeclarity_components/authentication/layout/TextLink.vue";
import {
  type Analyzer,
  isUnavailable,
  type Stage,
  unavailableLabel,
} from "@/codeclarity_components/organizations/analyzers/Analyzer";
import { AnalyzerRepository } from "@/codeclarity_components/organizations/analyzers/AnalyzerRepository";
import { IntegrationProvider } from "@/codeclarity_components/organizations/integrations/Integrations";
import { isOrgAdmin } from "@/codeclarity_components/organizations/organization.entity";
import type { Project } from "@/codeclarity_components/projects/project.entity";
import { ProjectRepository } from "@/codeclarity_components/projects/project.repository";
import router from "@/router";
import { Alert, AlertDescription, AlertTitle } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/shadcn/ui/card";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shadcn/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Skeleton } from "@/shadcn/ui/skeleton";
import { useAuthStore } from "@/stores/auth";
import { useStateStore } from "@/stores/state";
import { useUserStore } from "@/stores/user";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";

import type { ScheduleData } from "./components/schedule";
import ScheduleSelector from "./components/ScheduleSelector.vue";
import SelectLicensePolicy from "./components/SelectLicensePolicy.vue";
import SelectVulnerabilityPolicy from "./components/SelectVulnerabilityPolicy.vue";

interface PluginConfig {
  name: string;
  required?: boolean;
  description?: string;
}

interface AnalysisDataPayload {
  analyzer_id: string;
  branch: string;
  commit_hash?: string;
  config: Record<string, Record<string, unknown>>;
  schedule_type?: "once" | "daily" | "weekly";
  is_active?: boolean;
  next_scheduled_run?: string;
}

const VULN_PLUGINS = ["vuln-finder", "js-vuln-finder"];
const LICENSE_PLUGINS = ["license-finder", "js-license"];
// Languages a plugin's `language` option accepts
const LANGUAGES = ["javascript", "php"];
// Large enough that one request usually returns every entry.
const FETCH_PAGE_SIZE = 100;

const user = useUserStore();
const auth = useAuthStore();
const state = useStateStore();
state.$reset();
state.page = "add";

const analysisRepository = new AnalysisRepository();
const analyzerRepository = new AnalyzerRepository();
const projectRepository = new ProjectRepository();

const projectId = new URLSearchParams(window.location.search).get("id") ?? "";

const project = ref<Project>();
const projectMissing = ref(false);
const analyzers = ref<Analyzer[]>([]);
const analyzersLoaded = ref(false);
const analyzersFailed = ref(false);
const analyzerFailed = ref(false);
const analyzerId = ref("");
const analyzer = ref<Analyzer>();
const branch = ref("main");
const commit = ref("");
const vulnerabilityPolicy = ref<string | null>(null);
const licensePolicy = ref<string[]>([]);
const advanced = reactive<Record<string, Record<string, string>>>({});
const schedule = ref<ScheduleData>({
  schedule_type: "once",
  next_scheduled_run: undefined,
  is_active: true,
});

const submitted = ref(false);
const submitting = ref(false);
const failure = ref<{ code: string; message: string }>();

function displayName(item: Analyzer): string {
  return item.name === "JS" ? "JavaScript Analyzer" : item.name;
}

function plugins(item: Analyzer | undefined): Stage[] {
  return item?.steps.flat() ?? [];
}

function configured(plugin: Stage): boolean {
  return Object.keys(plugin.config).length > 0;
}

const isSbom = (plugin: Stage): boolean => plugin.name.endsWith("-sbom");
const isVuln = (plugin: Stage): boolean => VULN_PLUGINS.includes(plugin.name);
const isLicense = (plugin: Stage): boolean =>
  LICENSE_PLUGINS.includes(plugin.name);

const sbomPlugins = computed(() =>
  plugins(analyzer.value).filter(
    (plugin) => isSbom(plugin) && configured(plugin),
  ),
);
const hasVuln = computed(() =>
  plugins(analyzer.value).some(
    (plugin) => isVuln(plugin) && configured(plugin),
  ),
);
const hasLicense = computed(() =>
  plugins(analyzer.value).some(
    (plugin) => isLicense(plugin) && configured(plugin),
  ),
);
const advancedPlugins = computed(() =>
  plugins(analyzer.value).filter(
    (plugin) =>
      configured(plugin) &&
      !isSbom(plugin) &&
      !isVuln(plugin) &&
      !isLicense(plugin),
  ),
);

// Each option of a plugin with the config key its value is sent under.
function optionsOf(plugin: Stage): (PluginConfig & { key: string })[] {
  return Object.entries(plugin.config).map(([key, option]) => ({
    ...(option as PluginConfig),
    key,
  }));
}

function optionId(plugin: Stage, key: string): string {
  return `analysis-${plugin.name}-${key}`;
}

interface FormErrors {
  analyzer?: string;
  branch?: string;
  schedule?: string;
  // Missing required plugin options, by input id.
  options: Record<string, string>;
}

const errors = computed(() => {
  const result: FormErrors = { options: {} };
  if (!analyzerId.value) result.analyzer = "Choose an analyzer";
  if (sbomPlugins.value.length > 0 && branch.value.trim() === "") {
    result.branch = "A branch is required";
  }
  for (const plugin of advancedPlugins.value) {
    for (const option of optionsOf(plugin)) {
      const value = advanced[plugin.name]?.[option.key] ?? "";
      if (option.required && value.trim() === "") {
        result.options[optionId(plugin, option.key)] =
          `${plugin.name} needs a value for ${option.name}`;
      }
    }
  }
  if (schedule.value.schedule_type !== "once") {
    const next = schedule.value.next_scheduled_run;
    if (!next || Number.isNaN(next.getTime())) {
      result.schedule = "Choose the date and time of the first run";
    } else if (next.getTime() <= Date.now()) {
      result.schedule = "The first run must be in the future";
    }
  }
  return result;
});

const hasErrors = computed(() => {
  const { options, ...fields } = errors.value;
  return Object.keys(fields).length > 0 || Object.keys(options).length > 0;
});

/** Shown only once the user tried to submit, so the form starts clean. */
function errorFor(
  field: Exclude<keyof FormErrors, "options">,
): string | undefined {
  return submitted.value ? errors.value[field] : undefined;
}

function optionError(id: string): string | undefined {
  return submitted.value ? errors.value.options[id] : undefined;
}

const repositoryUrl = computed(() =>
  project.value?.url.startsWith("http") ? project.value.url : undefined,
);

async function loadProject(orgId: string): Promise<void> {
  if (!projectId) {
    projectMissing.value = true;
    return;
  }
  try {
    const response = await projectRepository.getProjectById({
      orgId,
      projectId,
      handleBusinessErrors: true,
    });
    project.value = response.data;
  } catch {
    projectMissing.value = true;
  }
}

async function fetchAllAnalyzers(orgId: string): Promise<Analyzer[]> {
  const all: Analyzer[] = [];
  for (let page = 0; ; page++) {
    const response = await analyzerRepository.getAnalyzers({
      orgId,
      page,
      entries_per_page: FETCH_PAGE_SIZE,
      search_key: "",
      handleBusinessErrors: true,
    });
    all.push(...response.data);
    if (page + 1 >= response.total_pages || response.data.length === 0) {
      return all;
    }
  }
}

async function loadAnalyzers(orgId: string): Promise<void> {
  try {
    analyzers.value = await fetchAllAnalyzers(orgId);
  } catch {
    analyzersFailed.value = true;
  } finally {
    analyzersLoaded.value = true;
  }
}

// While a plugin is down, the list is fetched again so it frees up by itself.
const RECHECK_DOWN_MS = 30_000;
let recheckTimer: ReturnType<typeof setTimeout> | undefined;

function scheduleRecheck(): void {
  clearTimeout(recheckTimer);
  recheckTimer = undefined;
  if (!analyzers.value.some((item) => item.availability?.state === "down")) {
    return;
  }
  recheckTimer = setTimeout(() => {
    const orgId = user.defaultOrg?.id;
    if (!orgId || !auth.getAuthenticated) return;
    fetchAllAnalyzers(orgId)
      .then((fresh) => {
        analyzers.value = fresh;
      })
      .catch(() => scheduleRecheck());
  }, RECHECK_DOWN_MS);
}

watch(analyzers, scheduleRecheck);
onBeforeUnmount(() => clearTimeout(recheckTimer));

// The list holds no plugin options, so the chosen analyzer is fetched again.
watch(analyzerId, async (id) => {
  analyzer.value = undefined;
  analyzerFailed.value = false;
  const orgId = user.defaultOrg?.id;
  if (!id || !orgId || !auth.getAuthenticated) return;
  try {
    const response = await analyzerRepository.getAnalyzer({
      analyzer_id: id,
      orgId,
      handleBusinessErrors: true,
    });
    if (analyzerId.value !== id) return;
    analyzer.value = response.data;
    for (const plugin of advancedPlugins.value) {
      advanced[plugin.name] ??= {};
    }
  } catch {
    if (analyzerId.value === id) analyzerFailed.value = true;
  }
});

function buildConfig(orgId: string): Record<string, Record<string, unknown>> {
  const config: Record<string, Record<string, unknown>> = {};
  const branchName = branch.value.trim();
  for (const plugin of sbomPlugins.value) {
    config[plugin.name] = {
      branch: branchName,
      project: `${orgId}/projects/${projectId}/${branchName}`,
    };
  }
  if (hasVuln.value) {
    config["vuln-finder"] = {
      vulnerabilityPolicy: vulnerabilityPolicy.value
        ? [vulnerabilityPolicy.value]
        : [],
    };
  }
  if (hasLicense.value) {
    config["license-finder"] = { licensePolicy: licensePolicy.value };
  }
  for (const plugin of advancedPlugins.value) {
    const values = Object.fromEntries(
      Object.entries(advanced[plugin.name] ?? {}).filter(
        ([, value]) => value.trim() !== "",
      ),
    );
    config[plugin.name] = values;
    if (plugin.name === "codeql") {
      config[plugin.name]!.project =
        `${orgId}/projects/${projectId}/${branchName}`;
    }
  }
  return config;
}

async function submit(): Promise<void> {
  submitted.value = true;
  const orgId = user.defaultOrg?.id;
  if (hasErrors.value || submitting.value) return;
  if (!orgId || !auth.getAuthenticated || !analyzer.value || !project.value)
    return;

  submitting.value = true;
  failure.value = undefined;
  const data: AnalysisDataPayload = {
    analyzer_id: analyzerId.value,
    branch: branch.value.trim(),
    config: buildConfig(orgId),
  };
  // Without a commit the analysis reads the latest one.
  const commitHash = commit.value.trim();
  if (commitHash) data.commit_hash = commitHash;
  if (schedule.value.schedule_type !== "once") {
    data.schedule_type = schedule.value.schedule_type;
    data.is_active = schedule.value.is_active;
    data.next_scheduled_run = schedule.value.next_scheduled_run?.toISOString();
  }

  try {
    await analysisRepository.createAnalysis({
      orgId,
      projectId,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      data,
    });
    toast.success("Analysis started", {
      description: "It runs in the background; results appear when it ends.",
    });
    void router.push({ name: "projects" });
  } catch (err) {
    const code = err instanceof BusinessLogicError ? err.error_code : "";
    failure.value = { code, message: startError(err) };
  } finally {
    submitting.value = false;
  }
}

// Plain words for why the start failed; the server's reason is shown only
// where it is written for users.
function startError(err: unknown): string {
  if (!(err instanceof BusinessLogicError)) {
    return "The analysis could not be started. Please try again.";
  }
  switch (err.error_code) {
    case APIErrors.AnaylzerMissingConfigAttribute:
    case APIErrors.AnalyzerUnavailable:
      return err.error_message;
    case APIErrors.NotAuthorized:
      return "Your role does not allow starting analyses in this organisation.";
    case APIErrors.EntityNotFound:
    case APIErrors.AnalyzerDoesNotExist:
      return "The project or analyzer no longer exists. Reload the page and try again.";
    default:
      return "The analysis could not be started. Please try again.";
  }
}

const alreadyScheduled = computed(
  () =>
    failure.value?.code === (APIErrors.AlreadyExists as string) &&
    schedule.value.schedule_type !== "once",
);

// Only admins can open the analyzer form, so others get no link to it.
const canCreateAnalyzer = computed(() => isOrgAdmin(user.defaultOrg?.role));

const newAnalyzerRoute = computed(() => ({
  name: "orgs",
  params: { action: "add", page: "analyzers", orgId: user.defaultOrg?.id },
}));

onMounted(() => {
  const orgId = user.defaultOrg?.id;
  if (!orgId || !auth.getAuthenticated) return;
  void loadProject(orgId);
  void loadAnalyzers(orgId);
});

const radioClass =
  "mt-0.5 border-muted-foreground focus-visible:ring-2 focus-visible:ring-offset-2 data-[state=checked]:border-foreground-strong";
const choiceClass =
  "flex cursor-pointer items-start gap-3 rounded-card border bg-card p-4 has-[[data-state=checked]]:border-foreground-strong has-[[data-state=checked]]:bg-muted";
</script>

<template>
  <div class="flex max-w-4xl flex-col gap-8">
    <div class="flex flex-col gap-3">
      <RouterLink
        :to="{ name: 'projects' }"
        class="inline-flex w-fit items-center gap-1 rounded-sm text-sm text-muted-foreground hover:text-foreground-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ArrowLeft aria-hidden="true" class="size-4" />
        Projects
      </RouterLink>
      <PageHeading
        description="Choose an analyzer, set its options and how often it runs."
      >
        New <BrandEmphasis>Analysis</BrandEmphasis>
      </PageHeading>
    </div>

    <OwlEmptyState
      v-if="projectMissing"
      title="Project not found"
      description="It may have been deleted, or you may not have access to it."
    >
      <Button :as="RouterLink" :to="{ name: 'projects' }" arrow>
        Back to projects
      </Button>
    </OwlEmptyState>

    <Card v-else class="rounded-card shadow-card">
      <CardContent class="flex flex-wrap items-center gap-4 pt-6">
        <Icon
          v-if="project?.type === IntegrationProvider.GITHUB"
          icon="simple-icons:github"
          aria-hidden="true"
          class="size-6 text-foreground-strong"
        />
        <Icon
          v-else-if="project?.type === IntegrationProvider.GITLAB"
          icon="simple-icons:gitlab"
          aria-hidden="true"
          class="size-6 text-foreground-strong"
        />
        <FolderArchive
          v-else
          aria-hidden="true"
          class="size-6 text-foreground-strong"
        />
        <div class="flex min-w-0 flex-1 basis-48 flex-col">
          <template v-if="project">
            <span class="truncate font-semibold text-foreground-strong">
              {{ project.name }}
            </span>
            <span class="text-sm text-muted-foreground">
              {{
                project.type === IntegrationProvider.FILE
                  ? "Uploaded project"
                  : `${project.type === IntegrationProvider.GITLAB ? "GitLab" : "GitHub"} repository`
              }}
            </span>
          </template>
          <Skeleton v-else class="h-5 w-48" />
        </div>
        <TextLink v-if="repositoryUrl" :href="repositoryUrl">
          <span class="inline-flex items-center gap-1">
            View repository
            <ExternalLink aria-hidden="true" class="size-4" />
          </span>
        </TextLink>
      </CardContent>
    </Card>

    <Alert v-if="failure" variant="destructive">
      <AlertTitle>The analysis was not started</AlertTitle>
      <AlertDescription>
        <template v-if="alreadyScheduled">
          Only one scheduled analysis per project. Cancel the project's
          scheduled analysis first, or run this one once.
        </template>
        <template v-else>
          {{ failure.message }}
        </template>
      </AlertDescription>
    </Alert>

    <form novalidate @submit.prevent="submit">
      <!-- Nothing can be submitted until the project has loaded. -->
      <fieldset :disabled="!project" class="flex min-w-0 flex-col gap-6">
        <Card class="rounded-card shadow-card">
          <CardHeader>
            <h2
              id="analysis-analyzer-label"
              class="text-lg font-semibold leading-none tracking-tight text-foreground-strong"
            >
              Analyzer
            </h2>
            <CardDescription>
              The plugins that run on the project, in order.
            </CardDescription>
          </CardHeader>
          <CardContent class="flex flex-col gap-4">
            <div
              v-if="!analyzersLoaded"
              role="status"
              aria-label="Loading the analyzers"
              class="flex flex-col gap-3"
            >
              <Skeleton v-for="row in 2" :key="row" class="h-20 w-full" />
            </div>

            <p
              v-else-if="analyzersFailed"
              role="alert"
              class="text-sm text-danger"
            >
              The analyzers could not be loaded. Reload the page to try again.
            </p>

            <OwlEmptyState
              v-else-if="analyzers.length === 0"
              title="No analyzers yet"
              :description="
                canCreateAnalyzer
                  ? 'An analyzer lists the plugins an analysis runs. Create one for the organisation first.'
                  : 'An analyzer lists the plugins an analysis runs. Ask an admin of the organisation to create one.'
              "
            >
              <Button
                v-if="canCreateAnalyzer"
                :as="RouterLink"
                :to="newAnalyzerRoute"
                arrow
              >
                Create an analyzer
              </Button>
            </OwlEmptyState>

            <template v-else>
              <RadioGroup
                v-model="analyzerId"
                aria-labelledby="analysis-analyzer-label"
                :aria-describedby="
                  errorFor('analyzer') ? 'analysis-analyzer-error' : undefined
                "
                :aria-invalid="errorFor('analyzer') ? true : undefined"
                class="gap-3"
              >
                <label
                  v-for="item in analyzers"
                  :key="item.id"
                  :data-analyzer="item.id"
                  :class="[
                    choiceClass,
                    isUnavailable(item.availability) &&
                      'cursor-not-allowed opacity-70',
                  ]"
                >
                  <RadioGroupItem
                    :value="item.id"
                    :class="radioClass"
                    :disabled="isUnavailable(item.availability)"
                    :aria-describedby="
                      isUnavailable(item.availability)
                        ? `analysis-analyzer-${item.id}-unavailable`
                        : undefined
                    "
                  />
                  <span class="flex flex-col gap-0.5">
                    <span class="font-semibold text-foreground-strong">
                      {{ displayName(item) }}
                    </span>
                    <span class="text-sm text-muted-foreground">
                      {{ item.description }}
                    </span>
                    <span
                      v-if="isUnavailable(item.availability)"
                      :id="`analysis-analyzer-${item.id}-unavailable`"
                      class="text-sm font-medium text-foreground-strong"
                    >
                      {{ unavailableLabel(item.availability) }}
                    </span>
                  </span>
                </label>
              </RadioGroup>
              <p
                v-if="errorFor('analyzer')"
                id="analysis-analyzer-error"
                class="text-sm text-destructive"
              >
                {{ errorFor("analyzer") }}
              </p>
              <Button
                v-if="canCreateAnalyzer"
                :as="RouterLink"
                :to="newAnalyzerRoute"
                variant="outline"
                size="sm"
                class="w-fit"
              >
                <Plus aria-hidden="true" />
                Create an analyzer
              </Button>
            </template>
          </CardContent>
        </Card>

        <div
          v-if="analyzerId && !analyzer && !analyzerFailed"
          role="status"
          aria-label="Loading the analyzer options"
        >
          <Skeleton class="h-40 w-full rounded-card" />
        </div>
        <p v-else-if="analyzerFailed" role="alert" class="text-sm text-danger">
          The analyzer's options could not be loaded. Reload the page to try
          again.
        </p>

        <Card v-if="sbomPlugins.length > 0" class="rounded-card shadow-card">
          <CardHeader>
            <h2
              class="text-lg font-semibold leading-none tracking-tight text-foreground-strong"
            >
              Repository
            </h2>
            <CardDescription>
              <template v-if="project?.type === IntegrationProvider.FILE">
                For an uploaded project the branch is a version label, such as
                "main" or "v1.0".
              </template>
              <template v-else>The code the analysis reads.</template>
            </CardDescription>
          </CardHeader>
          <CardContent class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="flex flex-col gap-2">
              <Label for="analysis-branch">Branch</Label>
              <Input
                id="analysis-branch"
                v-model="branch"
                :aria-invalid="errorFor('branch') ? true : undefined"
                :aria-describedby="
                  errorFor('branch') ? 'analysis-branch-error' : undefined
                "
              />
              <p
                v-if="errorFor('branch')"
                id="analysis-branch-error"
                class="text-sm text-destructive"
              >
                {{ errorFor("branch") }}
              </p>
            </div>
            <div class="flex flex-col gap-2">
              <Label for="analysis-commit">Commit</Label>
              <Input
                id="analysis-commit"
                v-model="commit"
                aria-describedby="analysis-commit-hint"
              />
              <p
                id="analysis-commit-hint"
                class="text-xs text-muted-foreground"
              >
                Optional. Leave it empty for the latest commit.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card v-if="hasVuln || hasLicense" class="rounded-card shadow-card">
          <CardHeader>
            <h2
              class="text-lg font-semibold leading-none tracking-tight text-foreground-strong"
            >
              Policies
            </h2>
            <CardDescription>
              Optional rules that shape the results.
            </CardDescription>
          </CardHeader>
          <CardContent class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <SelectVulnerabilityPolicy
              v-if="hasVuln"
              v-model:selected_vulnerability_policy="vulnerabilityPolicy"
            />
            <SelectLicensePolicy
              v-if="hasLicense"
              v-model:selected_license_policy="licensePolicy"
            />
          </CardContent>
        </Card>

        <Card
          v-if="advancedPlugins.length > 0"
          class="rounded-card shadow-card"
        >
          <CardHeader>
            <h2
              class="text-lg font-semibold leading-none tracking-tight text-foreground-strong"
            >
              Plugin options
            </h2>
            <CardDescription>Settings specific to a plugin.</CardDescription>
          </CardHeader>
          <CardContent class="flex flex-col gap-6">
            <fieldset
              v-for="plugin in advancedPlugins"
              :key="plugin.name"
              class="flex flex-col gap-4"
            >
              <legend class="mb-2 text-sm font-semibold text-foreground-strong">
                {{ plugin.name }}
                <span class="font-normal text-muted-foreground">
                  {{ plugin.version }}
                </span>
                <PreviewBadge v-if="plugin.name === 'codeql'" class="ml-2" />
              </legend>
              <div
                v-for="option in optionsOf(plugin)"
                :key="option.key"
                class="flex flex-col gap-2"
              >
                <Label :for="optionId(plugin, option.key)">
                  {{ option.name }}
                  <span v-if="!option.required" class="text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Select
                  v-if="option.key === 'language'"
                  v-model="advanced[plugin.name]![option.key]"
                >
                  <SelectTrigger
                    :id="optionId(plugin, option.key)"
                    :aria-invalid="
                      optionError(optionId(plugin, option.key))
                        ? true
                        : undefined
                    "
                    :aria-describedby="
                      optionError(optionId(plugin, option.key))
                        ? `${optionId(plugin, option.key)}-error`
                        : undefined
                    "
                  >
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="language in LANGUAGES"
                      :key="language"
                      :value="language"
                    >
                      {{ language.charAt(0).toUpperCase() + language.slice(1) }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  v-else
                  :id="optionId(plugin, option.key)"
                  v-model="advanced[plugin.name]![option.key]"
                  :aria-invalid="
                    optionError(optionId(plugin, option.key)) ? true : undefined
                  "
                  :aria-describedby="
                    optionError(optionId(plugin, option.key))
                      ? `${optionId(plugin, option.key)}-error`
                      : undefined
                  "
                />
                <p
                  v-if="option.description"
                  class="text-xs text-muted-foreground"
                >
                  {{ option.description }}
                </p>
                <p
                  v-if="optionError(optionId(plugin, option.key))"
                  :id="`${optionId(plugin, option.key)}-error`"
                  class="text-sm text-destructive"
                >
                  {{ optionError(optionId(plugin, option.key)) }}
                </p>
              </div>
            </fieldset>
          </CardContent>
        </Card>

        <template v-if="analyzersLoaded && analyzers.length > 0">
          <Card class="rounded-card shadow-card">
            <CardHeader>
              <h2
                class="text-lg font-semibold leading-none tracking-tight text-foreground-strong"
              >
                Schedule
              </h2>
              <CardDescription>
                A scheduled analysis runs again on the latest commit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScheduleSelector
                v-model="schedule"
                :error="errorFor('schedule')"
              />
            </CardContent>
          </Card>

          <div class="flex justify-end">
            <Button type="submit" :disabled="submitting || !project" arrow>
              {{ submitting ? "Starting the analysis" : "Start Analysis" }}
            </Button>
          </div>
        </template>
      </fieldset>
    </form>
  </div>
</template>

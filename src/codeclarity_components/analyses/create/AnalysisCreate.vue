<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { ArrowLeft, ExternalLink, FolderArchive, Plus } from "@lucide/vue";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { toast } from "vue-sonner";

import {
  BrandEmphasis,
  OwlEmptyState,
  PageHeading,
} from "@/base_components/page";
import { AnalysisRepository } from "@/codeclarity_components/analyses/analysis.repository";
import TextLink from "@/codeclarity_components/authentication/layout/TextLink.vue";
import type {
  Analyzer,
  Stage,
} from "@/codeclarity_components/organizations/analyzers/Analyzer";
import { AnalyzerRepository } from "@/codeclarity_components/organizations/analyzers/AnalyzerRepository";
import { IntegrationProvider } from "@/codeclarity_components/organizations/integrations/Integrations";
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
  commit_hash: string;
  config: Record<string, Record<string, unknown>>;
  schedule_type?: "once" | "daily" | "weekly";
  is_active?: boolean;
  next_scheduled_run?: string;
}

const VULN_PLUGINS = ["vuln-finder", "js-vuln-finder"];
const LICENSE_PLUGINS = ["license-finder", "js-license"];
// Languages a plugin's `language` option accepts
const LANGUAGES = ["javascript", "php"];

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
const analyzers = ref<Analyzer[]>([]);
const analyzersLoaded = ref(false);
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
const failure = ref<{ code?: string; message?: string }>();

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

function optionsOf(plugin: Stage): PluginConfig[] {
  return Object.values(plugin.config) as PluginConfig[];
}

interface FormErrors {
  analyzer?: string;
  branch?: string;
}

const errors = computed(() => {
  const result: FormErrors = {};
  if (!analyzerId.value) result.analyzer = "Choose an analyzer";
  if (sbomPlugins.value.length > 0 && branch.value.trim() === "") {
    result.branch = "A branch is required";
  }
  return result;
});

/** Shown only once the user tried to submit, so the form starts clean. */
function errorFor(field: keyof FormErrors): string | undefined {
  return submitted.value ? errors.value[field] : undefined;
}

const repositoryUrl = computed(() =>
  project.value?.url.startsWith("http") ? project.value.url : undefined,
);

async function loadProject(orgId: string, token: string): Promise<void> {
  try {
    const response = await projectRepository.getProjectById({
      orgId,
      projectId,
      bearerToken: token,
      handleBusinessErrors: true,
    });
    project.value = response.data;
  } catch {
    failure.value = { message: "The project could not be loaded." };
  }
}

async function loadAnalyzers(orgId: string, token: string): Promise<void> {
  try {
    const response = await analyzerRepository.getAnalyzers({
      orgId,
      page: 0,
      entries_per_page: 0,
      search_key: "",
      bearerToken: token,
      handleBusinessErrors: true,
    });
    analyzers.value = response.data;
  } catch {
    failure.value = { message: "The analyzers could not be loaded." };
  } finally {
    analyzersLoaded.value = true;
  }
}

// The list holds no plugin options, so the chosen analyzer is fetched again.
watch(analyzerId, async (id) => {
  analyzer.value = undefined;
  const orgId = user.defaultOrg?.id;
  if (!id || !orgId || !auth.getToken) return;
  try {
    const response = await analyzerRepository.getAnalyzer({
      analyzer_id: id,
      orgId,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
    });
    if (analyzerId.value !== id) return;
    analyzer.value = response.data;
    for (const plugin of advancedPlugins.value) {
      advanced[plugin.name] ??= {};
    }
  } catch {
    failure.value = { message: "The analyzer could not be loaded." };
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
        ([, value]) => value !== "",
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
  if (Object.keys(errors.value).length > 0 || submitting.value) return;
  if (!orgId || !auth.getToken || !analyzer.value) return;

  submitting.value = true;
  failure.value = undefined;
  const data: AnalysisDataPayload = {
    analyzer_id: analyzerId.value,
    branch: branch.value.trim(),
    // The API wants a value; a blank one means the latest commit.
    commit_hash: commit.value.trim() || " ",
    config: buildConfig(orgId),
  };
  if (schedule.value.schedule_type !== "once") {
    data.schedule_type = schedule.value.schedule_type;
    data.is_active = schedule.value.is_active;
    data.next_scheduled_run = schedule.value.next_scheduled_run?.toISOString();
  }

  try {
    await analysisRepository.createAnalysis({
      orgId,
      projectId,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
      data,
    });
    toast.success("Analysis started", {
      description: "It runs in the background; results appear when it ends.",
    });
    void router.push({ name: "projects" });
  } catch (err) {
    failure.value =
      err instanceof BusinessLogicError
        ? { code: err.error_code, message: err.error_message }
        : { message: "The analysis could not be started." };
  } finally {
    submitting.value = false;
  }
}

const alreadyScheduled = computed(
  () =>
    failure.value?.code === (APIErrors.AlreadyExists as string) &&
    schedule.value.schedule_type !== "once",
);

const newAnalyzerRoute = computed(() => ({
  name: "orgs",
  params: { action: "add", page: "analyzers", orgId: user.defaultOrg?.id },
}));

onMounted(() => {
  const orgId = user.defaultOrg?.id;
  if (!orgId || !auth.getToken) return;
  void loadProject(orgId, auth.getToken);
  void loadAnalyzers(orgId, auth.getToken);
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

    <Card class="rounded-card shadow-card">
      <CardContent class="flex items-center gap-4 pt-6">
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
        <div class="flex min-w-0 flex-1 flex-col">
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
          {{ failure.message ?? failure.code }}
        </template>
      </AlertDescription>
    </Alert>

    <form class="flex flex-col gap-6" novalidate @submit.prevent="submit">
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

          <OwlEmptyState
            v-else-if="analyzers.length === 0"
            title="No analyzers yet"
            description="An analyzer lists the plugins an analysis runs. Create one for the organisation first."
          >
            <Button :as="RouterLink" :to="newAnalyzerRoute" arrow>
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
                :class="choiceClass"
              >
                <RadioGroupItem :value="item.id" :class="radioClass" />
                <span class="flex flex-col gap-0.5">
                  <span class="font-semibold text-foreground-strong">
                    {{ displayName(item) }}
                  </span>
                  <span class="text-sm text-muted-foreground">
                    {{ item.description }}
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
        v-if="analyzerId && !analyzer && !failure"
        role="status"
        aria-label="Loading the analyzer options"
      >
        <Skeleton class="h-40 w-full rounded-card" />
      </div>

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
        <CardContent class="grid grid-cols-2 gap-4">
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
            <p id="analysis-commit-hint" class="text-xs text-muted-foreground">
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
        <CardContent class="grid grid-cols-2 gap-6">
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

      <Card v-if="advancedPlugins.length > 0" class="rounded-card shadow-card">
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
            </legend>
            <div
              v-for="option in optionsOf(plugin)"
              :key="option.name"
              class="flex flex-col gap-2"
            >
              <Label :for="`analysis-${plugin.name}-${option.name}`">
                {{ option.name }}
                <span v-if="!option.required" class="text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Select
                v-if="option.name === 'language'"
                v-model="advanced[plugin.name]![option.name]"
              >
                <SelectTrigger :id="`analysis-${plugin.name}-${option.name}`">
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
                :id="`analysis-${plugin.name}-${option.name}`"
                v-model="advanced[plugin.name]![option.name]"
              />
              <p
                v-if="option.description"
                class="text-xs text-muted-foreground"
              >
                {{ option.description }}
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
            <ScheduleSelector v-model="schedule" />
          </CardContent>
        </Card>

        <div class="flex justify-end">
          <Button type="submit" :disabled="submitting" arrow>
            {{ submitting ? "Starting the analysis" : "Start Analysis" }}
          </Button>
        </div>
      </template>
    </form>
  </div>
</template>

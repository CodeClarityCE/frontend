<script setup lang="ts">
import {
  Database,
  FlaskConical,
  FolderGit2,
  type LucideIcon,
  Plus,
  Settings2,
  UserRound,
} from "@lucide/vue";
import { useEventListener } from "@vueuse/core";
import { ref, watch } from "vue";
import { type RouteLocationRaw, useRouter } from "vue-router";

import { DatasetsRepository } from "@/codeclarity_components/datasets/datasets.repository";
import { ExperimentsRepository } from "@/codeclarity_components/experiments/experiments.repository";
import { ProjectRepository } from "@/codeclarity_components/projects/project.repository";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shadcn/ui/command";
import { DialogDescription, DialogTitle } from "@/shadcn/ui/dialog";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { SortDirection } from "@/utils/api/PaginatedRequestOptions";

import { navGroups, orgSettingsItem } from "./nav-items";
import { isPaletteShortcut } from "./shortcut";

interface Entry {
  id: string;
  label: string;
  to: RouteLocationRaw;
}

interface Action extends Entry {
  icon: LucideIcon;
}

const open = defineModel<boolean>("open", { default: false });

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();

const datasets = ref<Entry[]>([]);
const experiments = ref<Entry[]>([]);
const projects = ref<Entry[]>([]);

useEventListener(document, "keydown", (event: KeyboardEvent) => {
  if (!isPaletteShortcut(event)) return;
  event.preventDefault();
  open.value = !open.value;
});

function pages(): Action[] {
  const orgId = userStore.getDefaultOrg?.id;
  const items = [...navGroups.flatMap((group) => group.items), orgSettingsItem];
  const result: Action[] = [];
  for (const item of items) {
    const to = item.to(orgId);
    if (to)
      result.push({ id: item.label, label: item.label, icon: item.icon, to });
  }
  result.push({
    id: "account",
    label: "Account settings",
    icon: UserRound,
    to: { name: "settings", params: { page: "account" } },
  });
  return result;
}

function actions(): Action[] {
  const orgId = userStore.getDefaultOrg?.id;
  return [
    {
      id: "create-dataset",
      label: "Create a Dataset",
      icon: Plus,
      to: { name: "datasets", params: { page: "add" } },
    },
    {
      id: "create-experiment",
      label: "Create an Experiment",
      icon: Plus,
      to: { name: "experiments", params: { page: "add" } },
    },
    {
      id: "import-project",
      label: "Import a project",
      icon: Plus,
      to: { name: "projects", params: { page: "add" } },
    },
    {
      id: "create-analyzer",
      label: "Create an analyzer",
      icon: Settings2,
      to: {
        name: "orgs",
        params: { action: "add", page: "analyzers", orgId },
      },
    },
  ];
}

// Loads the searchable records each time the palette opens, so they stay current.
async function loadRecords(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  const bearerToken = authStore.getToken;
  if (!orgId || !bearerToken) return;
  const pagination = { page: 0, entries_per_page: 50 };
  const common = { orgId, bearerToken, pagination, handleBusinessErrors: true };

  const [ds, exps, projs] = await Promise.allSettled([
    new DatasetsRepository().getDatasets(common),
    new ExperimentsRepository().getExperiments(common),
    new ProjectRepository().getProjects({
      ...common,
      search: { searchKey: "" },
      sort: { sortKey: "name", sortDirection: SortDirection.ASC },
    }),
  ]);

  if (ds.status === "fulfilled") {
    datasets.value = ds.value.data.map((d) => ({
      id: d.id,
      label: d.name,
      to: { name: "datasets", params: { page: "detail" }, query: { id: d.id } },
    }));
  }
  if (exps.status === "fulfilled") {
    experiments.value = exps.value.data.map((e) => ({
      id: e.id,
      label: e.name,
      to: {
        name: "experiments",
        params: { page: "detail" },
        query: { id: e.id },
      },
    }));
  }
  if (projs.status === "fulfilled") {
    projects.value = projs.value.data.map((p) => {
      const latest = [...(p.analyses ?? [])].sort(
        (a, b) =>
          new Date(b.created_on).getTime() - new Date(a.created_on).getTime(),
      )[0];
      // A project opens on its latest results, or on starting its first analysis.
      const to: RouteLocationRaw = latest
        ? {
            name: "results",
            query: { analysis_id: latest.id, project_id: p.id },
          }
        : { name: "analyses", params: { page: "add" }, query: { id: p.id } };
      return { id: p.id, label: p.name, to };
    });
  }
}

// Also reloads when the organisation arrives or changes while the palette is open.
watch([open, () => userStore.getDefaultOrg?.id], ([isOpen]) => {
  if (isOpen) void loadRecords();
});

function go(to: RouteLocationRaw): void {
  open.value = false;
  void router.push(to);
}
</script>

<template>
  <CommandDialog v-model:open="open">
    <DialogTitle class="sr-only">Command palette</DialogTitle>
    <DialogDescription class="sr-only">
      Search pages, Datasets, Experiments and Projects, then press Enter to go
      there.
    </DialogDescription>
    <CommandInput
      placeholder="Search pages, Datasets, Experiments, Projects..."
      aria-label="Search"
    />
    <CommandList aria-label="Results" class="max-h-[min(60vh,26rem)]">
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandGroup heading="Pages">
        <CommandItem
          v-for="item in pages()"
          :key="item.id"
          :value="`page-${item.id}`"
          @select="go(item.to)"
        >
          <component :is="item.icon" aria-hidden="true" />
          {{ item.label }}
        </CommandItem>
      </CommandGroup>
      <CommandGroup v-if="datasets.length" heading="Datasets">
        <CommandItem
          v-for="item in datasets"
          :key="item.id"
          :value="`dataset-${item.id}`"
          @select="go(item.to)"
        >
          <Database aria-hidden="true" />
          {{ item.label }}
        </CommandItem>
      </CommandGroup>
      <CommandGroup v-if="experiments.length" heading="Experiments">
        <CommandItem
          v-for="item in experiments"
          :key="item.id"
          :value="`experiment-${item.id}`"
          @select="go(item.to)"
        >
          <FlaskConical aria-hidden="true" />
          {{ item.label }}
        </CommandItem>
      </CommandGroup>
      <CommandGroup v-if="projects.length" heading="Projects">
        <CommandItem
          v-for="item in projects"
          :key="item.id"
          :value="`project-${item.id}`"
          @select="go(item.to)"
        >
          <FolderGit2 aria-hidden="true" />
          {{ item.label }}
        </CommandItem>
      </CommandGroup>
      <CommandGroup heading="Actions">
        <CommandItem
          v-for="item in actions()"
          :key="item.id"
          :value="`action-${item.id}`"
          @select="go(item.to)"
        >
          <component :is="item.icon" aria-hidden="true" />
          {{ item.label }}
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </CommandDialog>
</template>

<script setup lang="ts">
import { ChevronRight } from "@lucide/vue";
import { ref } from "vue";

import { SeverityBadge } from "@/base_components/page";
import { detailsRoute } from "@/codeclarity_components/results/vulnerabilities/vuln-format";
import { Badge } from "@/shadcn/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";

import type {
  AffectedInstance,
  AffectedProject,
  TopLevelDependency,
} from "../organization_vulnerability.entity";
import { levelOfClass } from "../severity-class";
import InstanceDiffLinks from "../shared/InstanceDiffLinks.vue";

import ProjectRemediations from "./ProjectRemediations.vue";

// The projects whose current analysis has the vulnerability; each expands to its instances.
defineProps<{ projects: AffectedProject[] }>();

const expanded = ref(new Set<string>());

function toggle(projectId: string): void {
  const next = new Set(expanded.value);
  if (next.has(projectId)) next.delete(projectId);
  else next.add(projectId);
  expanded.value = next;
}

const plural = (count: number, noun: string): string =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

const instanceRoute = (
  project: AffectedProject,
  instance: AffectedInstance,
): ReturnType<typeof detailsRoute> =>
  detailsRoute(
    project.analysis_id,
    project.project_id,
    instance.analysis_vulnerability_id,
    instance.workspace,
    {
      AffectedDependency: instance.package,
      AffectedVersion: instance.installed_version,
    },
  );

const pathText = (top: TopLevelDependency): string =>
  top.path.map((pkg) => `${pkg.name}@${pkg.version}`).join(" > ");

// One entry per installed and fixed version pair that has a link or command.
function changesOf(project: AffectedProject): AffectedInstance[] {
  const changes = new Map<string, AffectedInstance>();
  for (const instance of project.instances) {
    const links = instance.diff_links;
    if (
      links.fix_commits.length === 0 &&
      !links.compare &&
      !links.registry_diff
    ) {
      continue;
    }
    const key = [
      instance.ecosystem,
      instance.package,
      instance.installed_version,
      instance.fixed_version,
    ].join("\u0000");
    if (!changes.has(key)) changes.set(key, instance);
  }
  return [...changes.values()];
}

const instanceKey = (instance: AffectedInstance): string =>
  [
    instance.workspace,
    instance.package,
    instance.installed_version,
    instance.analysis_vulnerability_id,
  ].join("\u0000");
</script>

<template>
  <Card aria-label="Affected projects" role="region">
    <CardHeader>
      <CardTitle>Affected projects</CardTitle>
    </CardHeader>
    <CardContent>
      <p v-if="projects.length === 0" class="text-sm text-muted-foreground">
        No project's current analysis has this vulnerability.
      </p>
      <ul v-else class="divide-y rounded-control border">
        <li v-for="project in projects" :key="project.project_id">
          <button
            type="button"
            class="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
            :aria-expanded="expanded.has(project.project_id)"
            :aria-controls="`instances-${project.project_id}`"
            @click="toggle(project.project_id)"
          >
            <ChevronRight
              class="size-4 shrink-0 transition-transform"
              :class="{ 'rotate-90': expanded.has(project.project_id) }"
              aria-hidden="true"
            />
            <span class="min-w-0 flex-1 truncate font-medium">{{
              project.project_name
            }}</span>
            <SeverityBadge
              :level="levelOfClass(project.severity_class)"
              :score="project.severity_score ?? undefined"
            />
            <span class="shrink-0 text-muted-foreground tabular-nums">{{
              plural(project.instances.length, "instance")
            }}</span>
          </button>
          <div
            v-if="expanded.has(project.project_id)"
            :id="`instances-${project.project_id}`"
            class="overflow-x-auto px-3 pb-3"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Installed version</TableHead>
                  <TableHead>Fixed in</TableHead>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Installed by</TableHead>
                  <TableHead><span class="sr-only">Details</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="instance in project.instances"
                  :key="instanceKey(instance)"
                >
                  <TableCell class="font-medium">{{
                    instance.package
                  }}</TableCell>
                  <TableCell class="tabular-nums">{{
                    instance.installed_version
                  }}</TableCell>
                  <TableCell
                    v-if="instance.fixed_version"
                    class="tabular-nums"
                    >{{ instance.fixed_version }}</TableCell
                  >
                  <TableCell v-else class="text-muted-foreground"
                    >No fix</TableCell
                  >
                  <TableCell>{{ instance.workspace }}</TableCell>
                  <TableCell>{{ instance.prod ? "Prod" : "Dev" }}</TableCell>
                  <TableCell>
                    <span
                      v-if="instance.top_level_dependencies.length === 0"
                      class="text-muted-foreground"
                      >Not found</span
                    >
                    <ul v-else aria-label="Installed by" class="space-y-1">
                      <li
                        v-for="top in instance.top_level_dependencies"
                        :key="`${top.dev}\u0000${top.name}@${top.version}`"
                      >
                        <span class="font-medium">{{ top.name }}</span>
                        {{ " " }}
                        <span class="tabular-nums">{{ top.version }}</span>
                        {{ " " }}
                        <Badge
                          v-if="top.path.length === 1"
                          variant="secondary"
                          class="ml-2"
                          >Direct</Badge
                        >
                        {{ " " }}
                        <Badge v-if="top.dev" variant="outline" class="ml-2"
                          >Dev</Badge
                        >
                        {{ " " }}
                        <div
                          v-if="top.path.length > 1"
                          class="text-xs break-all text-muted-foreground"
                        >
                          {{ pathText(top) }}
                        </div>
                      </li>
                    </ul>
                  </TableCell>
                  <TableCell class="text-right">
                    <RouterLink
                      :to="instanceRoute(project, instance)"
                      class="text-primary underline-offset-4 hover:underline"
                      >Details</RouterLink
                    >
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <ProjectRemediations :project="project" />
            <ul
              v-if="changesOf(project).length > 0"
              aria-label="Changes to the fixed versions"
              class="mt-3 space-y-3"
            >
              <li
                v-for="change in changesOf(project)"
                :key="instanceKey(change)"
                class="space-y-1"
              >
                <p class="text-sm">
                  <span class="font-medium">{{ change.package }}</span>
                  {{ " " }}
                  <span class="tabular-nums">{{
                    change.installed_version
                  }}</span>
                  <template v-if="change.fixed_version">
                    to
                    <span class="tabular-nums">{{ change.fixed_version }}</span>
                  </template>
                </p>
                <InstanceDiffLinks :links="change.diff_links" />
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </CardContent>
  </Card>
</template>

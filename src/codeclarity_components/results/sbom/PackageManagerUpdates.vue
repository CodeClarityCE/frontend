<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { Copy } from "@lucide/vue";
import { computed } from "vue";

import { Button } from "@/shadcn/ui/button";

import {
  generateUpdateCommands,
  getInstallCommand,
  getLockfileName,
  getManifestName,
  getPackageManagerHelpText,
  getPackageManagerIcon,
  type PackageManager,
  type PackageUpdate,
} from "./utils/packageManagerUtils";

// The updates of one package manager: lists, commands, manifest and lockfile.
const props = defineProps<{
  manager: PackageManager | null;
  updates: PackageUpdate[];
  // Set when the dialog shows several managers, to tell their parts apart.
  grouped?: boolean;
}>();

const emit = defineEmits<{ copy: [content: string] }>();

const productionUpdates = computed(() =>
  props.updates.filter((update) => update.isProd),
);
const developmentUpdates = computed(() =>
  props.updates.filter((update) => update.isDev && !update.isProd),
);
const updateCommands = computed(() =>
  props.manager ? generateUpdateCommands(props.manager, props.updates) : [],
);
const manifest = computed(() =>
  props.manager ? getManifestName(props.manager) : "package.json",
);
const isComposer = computed(() => props.manager === "composer");
const heading = computed(() => (props.grouped ? "h4" : "h3"));
const commandsLabel = computed(() =>
  props.grouped && props.manager
    ? `${props.manager} update commands`
    : "Update commands",
);

const packageJsonSnippet = computed((): string => {
  const snippet: Record<string, Record<string, string>> = {};
  const entries = (list: PackageUpdate[]): Record<string, string> =>
    Object.fromEntries(list.map((u) => [u.name, `^${u.latestVersion}`]));
  if (productionUpdates.value.length > 0)
    snippet[isComposer.value ? "require" : "dependencies"] = entries(
      productionUpdates.value,
    );
  if (developmentUpdates.value.length > 0)
    snippet[isComposer.value ? "require-dev" : "devDependencies"] = entries(
      developmentUpdates.value,
    );
  return JSON.stringify(snippet, null, 2);
});

const lists = computed(() =>
  [
    { title: "Production dependencies", list: productionUpdates.value },
    { title: "Development dependencies", list: developmentUpdates.value },
  ].filter((group) => group.list.length > 0),
);
</script>

<template>
  <section
    v-for="group in lists"
    :key="group.title"
    class="flex flex-col gap-2"
  >
    <component :is="heading" class="font-semibold text-foreground-strong">
      {{ group.title }}
    </component>
    <ul class="divide-y rounded-control border">
      <li
        v-for="update in group.list"
        :key="update.name"
        class="flex items-center justify-between gap-4 px-3 py-2"
      >
        <span class="font-medium">{{ update.name }}</span>
        <span class="font-mono text-muted-foreground">
          {{ update.currentVersion }} to
          <span class="font-semibold text-foreground-strong">{{
            update.latestVersion
          }}</span>
        </span>
      </li>
    </ul>
  </section>

  <section class="flex flex-col gap-2">
    <div class="flex items-center justify-between gap-4">
      <component
        :is="heading"
        class="flex items-center gap-2 font-semibold text-foreground-strong"
      >
        <Icon
          v-if="manager"
          :icon="getPackageManagerIcon(manager)"
          aria-hidden="true"
          class="size-4"
        />
        {{ manager ?? "Update" }} commands
      </component>
      <Button
        variant="outline"
        size="sm"
        :disabled="updateCommands.length === 0"
        @click="emit('copy', updateCommands.join('\n'))"
      >
        <Copy aria-hidden="true" class="size-4" />
        Copy {{ grouped && manager ? `${manager} ` : "" }}commands
      </Button>
    </div>
    <pre
      v-if="updateCommands.length > 0"
      :aria-label="commandsLabel"
      class="overflow-x-auto rounded-control bg-muted p-3 font-mono text-xs"
      >{{ updateCommands.join("\n") }}</pre>
    <p v-else class="text-muted-foreground">
      CodeClarity could not tell which package manager this workspace uses, so
      it has no commands to give. Edit {{ manifest }} by hand, then run your
      package manager's install command.
    </p>
  </section>

  <section class="flex flex-col gap-2">
    <div class="flex items-center justify-between gap-4">
      <component :is="heading" class="font-semibold text-foreground-strong">
        {{ manifest }} changes
      </component>
      <Button
        variant="outline"
        size="sm"
        :disabled="updates.length === 0"
        @click="emit('copy', packageJsonSnippet)"
      >
        <Copy aria-hidden="true" class="size-4" />
        Copy {{ grouped ? `${manifest} ` : "" }}JSON
      </Button>
    </div>
    <pre
      :aria-label="`${manifest} changes`"
      class="overflow-x-auto rounded-control bg-muted p-3 font-mono text-xs"
      >{{ packageJsonSnippet }}</pre>
    <p v-if="manager" class="text-muted-foreground">
      Merge it into {{ manifest }}, then run
      <code class="rounded-sm bg-muted px-1 font-mono">{{
        getInstallCommand(manager)
      }}</code>
      to update the lockfile.
    </p>
  </section>

  <section
    v-if="manager"
    class="flex flex-col gap-1 rounded-control bg-warning-subtle p-3 text-warning"
  >
    <component :is="heading" class="font-semibold">Keep the lockfile</component>
    <p>
      The commands update {{ getLockfileName(manager) }} for you.
      {{ getPackageManagerHelpText(manager) }} Delete it only to fix a
      resolution problem.
    </p>
  </section>
</template>

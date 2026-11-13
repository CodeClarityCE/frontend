<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { Copy } from "@lucide/vue";
import { computed } from "vue";

import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { successToast } from "@/utils/toasts";

import {
  generateUpdateCommands,
  getInstallCommand,
  getLockfileName,
  getPackageManagerHelpText,
  getPackageManagerIcon,
  type PackageManager,
  type PackageUpdate,
} from "./utils/packageManagerUtils";

const props = defineProps<{
  open: boolean;
  updates: PackageUpdate[];
  projectName?: string;
  packageManager?: string;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  "copy-to-clipboard": [content: string];
}>();

const productionUpdates = computed(() =>
  props.updates.filter((update) => update.isProd),
);
const developmentUpdates = computed(() =>
  props.updates.filter((update) => update.isDev && !update.isProd),
);
const manager = computed(
  () => (props.packageManager?.toLowerCase() ?? "yarn") as PackageManager,
);
const updateCommands = computed(() =>
  generateUpdateCommands(manager.value, props.updates),
);

const packageJsonSnippet = computed((): string => {
  const snippet: Record<string, Record<string, string>> = {};
  const entries = (list: PackageUpdate[]): Record<string, string> =>
    Object.fromEntries(list.map((u) => [u.name, `^${u.latestVersion}`]));
  if (productionUpdates.value.length > 0)
    snippet.dependencies = entries(productionUpdates.value);
  if (developmentUpdates.value.length > 0)
    snippet.devDependencies = entries(developmentUpdates.value);
  return JSON.stringify(snippet, null, 2);
});

const groups = computed(() =>
  [
    { title: "Production dependencies", list: productionUpdates.value },
    { title: "Development dependencies", list: developmentUpdates.value },
  ].filter((group) => group.list.length > 0),
);

function copy(content: string): void {
  void navigator.clipboard.writeText(content).then(() => {
    successToast("Copied to the clipboard");
    emit("copy-to-clipboard", content);
  });
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-h-[85vh] max-w-3xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Update direct dependencies</DialogTitle>
        <DialogDescription>
          {{ updates.length }} direct
          {{ updates.length === 1 ? "dependency has" : "dependencies have" }}
          a newer version<span v-if="projectName"> in {{ projectName }}</span
          >. Run the commands or edit package.json by hand.
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-6 text-sm">
        <section
          v-for="group in groups"
          :key="group.title"
          class="flex flex-col gap-2"
        >
          <h3 class="font-semibold text-foreground-strong">
            {{ group.title }}
          </h3>
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
            <h3
              class="flex items-center gap-2 font-semibold text-foreground-strong"
            >
              <Icon
                :icon="getPackageManagerIcon(manager)"
                aria-hidden="true"
                class="size-4"
              />
              {{ manager }} commands
            </h3>
            <Button
              variant="outline"
              size="sm"
              @click="copy(updateCommands.join('\n'))"
            >
              <Copy aria-hidden="true" class="size-4" />
              Copy commands
            </Button>
          </div>
          <pre
            class="overflow-x-auto rounded-control bg-muted p-3 font-mono text-xs"
            >{{ updateCommands.join("\n") }}</pre>
        </section>

        <section class="flex flex-col gap-2">
          <div class="flex items-center justify-between gap-4">
            <h3 class="font-semibold text-foreground-strong">
              package.json changes
            </h3>
            <Button
              variant="outline"
              size="sm"
              @click="copy(packageJsonSnippet)"
            >
              <Copy aria-hidden="true" class="size-4" />
              Copy JSON
            </Button>
          </div>
          <pre
            class="overflow-x-auto rounded-control bg-muted p-3 font-mono text-xs"
            >{{ packageJsonSnippet }}</pre>
          <p class="text-muted-foreground">
            Merge it into package.json, then run
            <code class="rounded-sm bg-muted px-1 font-mono">{{
              getInstallCommand(manager)
            }}</code>
            to update the lockfile.
          </p>
        </section>

        <section
          class="flex flex-col gap-1 rounded-control bg-warning-subtle p-3 text-warning"
        >
          <h3 class="font-semibold">Keep the lockfile</h3>
          <p>
            The commands update {{ getLockfileName(manager) }} for you.
            {{ getPackageManagerHelpText(manager) }} Delete it only to fix a
            resolution problem.
          </p>
        </section>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

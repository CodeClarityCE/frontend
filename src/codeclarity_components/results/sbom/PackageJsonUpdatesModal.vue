<script lang="ts" setup>
import { Icon } from "@iconify/vue";
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

import PackageManagerUpdates from "./PackageManagerUpdates.vue";
import {
  getManifestName,
  getPackageManagerIcon,
  groupUpdatesByManager,
  type PackageUpdate,
} from "./utils/packageManagerUtils";

const props = defineProps<{
  open: boolean;
  updates: PackageUpdate[];
  projectName?: string;
  packageManager?: string;
  // Package manager of each ecosystem in the workspace, e.g. { npm: "NPM" }
  packageManagers?: Record<string, string>;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  "copy-to-clipboard": [content: string];
}>();

// One group per package manager; a single group when the workspace has one.
const groups = computed(() =>
  groupUpdatesByManager(
    props.updates,
    props.packageManager,
    props.packageManagers,
  ),
);
const grouped = computed(() => groups.value.length > 1);
const manifests = computed(() =>
  [
    ...new Set(
      groups.value.map((g) =>
        g.manager ? getManifestName(g.manager) : "package.json",
      ),
    ),
  ].join(" and "),
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
          >. Run the commands or edit {{ manifests }} by hand.
        </DialogDescription>
      </DialogHeader>

      <div v-if="!grouped" class="flex flex-col gap-6 text-sm">
        <PackageManagerUpdates
          :manager="groups[0]?.manager ?? null"
          :updates="updates"
          @copy="copy"
        />
      </div>
      <div v-else class="flex flex-col gap-8 text-sm">
        <section
          v-for="group in groups"
          :key="group.manager ?? 'unknown'"
          class="flex flex-col gap-6"
        >
          <h3
            class="flex items-center gap-2 border-b pb-2 text-base font-semibold text-foreground-strong"
          >
            <Icon
              v-if="group.manager"
              :icon="getPackageManagerIcon(group.manager)"
              aria-hidden="true"
              class="size-4"
            />
            {{ group.manager ?? "Other" }} dependencies
          </h3>
          <PackageManagerUpdates
            :manager="group.manager"
            :updates="group.updates"
            grouped
            @copy="copy"
          />
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

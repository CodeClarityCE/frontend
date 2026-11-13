<script lang="ts" setup>
import { Copy } from "@lucide/vue";
import { computed, type Ref, ref, watch } from "vue";

import { StatusBadge, type StatusTone } from "@/base_components/page";
import {
  type PatchedManifestData,
  PatchType,
  type UpgradeInfo,
} from "@/codeclarity_components/results/patching/Patching";
import { ResultsRepository } from "@/codeclarity_components/results/results.repository";
import { Button } from "@/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/ui/card";
import { Skeleton } from "@/shadcn/ui/skeleton";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { errorToast, successToast } from "@/utils/toasts";

// The patched manifest and the steps to apply it.
const props = withDefaults(
  defineProps<{ analysisID?: string; projectID?: string }>(),
  { analysisID: "", projectID: "" },
);

const resultsRepository = new ResultsRepository();
const userStore = useUserStore();
const authStore = useAuthStore();

const data: Ref<PatchedManifestData | null> = ref(null);
const loading = ref(true);

let latestRequest = 0;

async function load(): Promise<void> {
  const org = userStore.getDefaultOrg;
  const token = authStore.getToken;
  if (!org || !token || props.projectID === "" || props.analysisID === "")
    return;
  const request = ++latestRequest;
  try {
    const res = await resultsRepository.getPatchesManifest({
      orgId: org.id,
      projectId: props.projectID,
      analysisId: props.analysisID,
      workspace: ".",
      bearerToken: token,
      handleBusinessErrors: true,
    });
    if (request === latestRequest) data.value = res.data;
  } catch {
    if (request === latestRequest) data.value = null;
  } finally {
    if (request === latestRequest) loading.value = false;
  }
}

watch([() => props.projectID, () => props.analysisID], () => void load(), {
  immediate: true,
});

const FIELDS = [
  ["dependencies", "Dependencies"],
  ["devDependencies", "Development dependencies"],
  ["peerDependencies", "Peer dependencies"],
  ["optionalDependencies", "Optional dependencies"],
  ["bundleDependencies", "Bundled dependencies"],
  ["bundledDependencies", "Bundled dependencies"],
] as const;

interface Change {
  name: string;
  from: string;
  to: string | null;
  label: string;
  tone: StatusTone;
}

function change(name: string, info: UpgradeInfo): Change {
  const base = { name, from: info.original_constraint, to: null };
  if (!info.vulnerable)
    return { ...base, label: "Not vulnerable", tone: "success" };
  if (info.patch_type === PatchType.Full)
    return {
      ...base,
      to: info.upgrade_to,
      label: "Full patch",
      tone: "success",
    };
  if (info.patch_type === PatchType.Partial)
    return {
      ...base,
      to: info.upgrade_to,
      label: "Partial patch",
      tone: "warning",
    };
  return { ...base, label: "No patch", tone: "danger" };
}

const groups = computed(() => {
  const manifest = data.value?.patched_manifest;
  if (!manifest) return [];
  return FIELDS.flatMap(([field, title]) => {
    const deps = manifest[field];
    if (!deps || typeof deps !== "object") return [];
    const changes = Object.entries(deps)
      .filter(([, info]) => typeof info === "object" && info !== null)
      .map(([name, info]) => change(name, info as UpgradeInfo));
    return changes.length > 0 ? [{ field, title, changes }] : [];
  });
});

const packageFile = computed(
  () => data.value?.other_info?.relative_package_file ?? "package.json",
);

const command = computed(() => {
  const manager = data.value?.other_info?.package_manager;
  if (manager === "YARN") return "rm yarn.lock ; yarn install --prefer-online";
  if (manager === "NPM")
    return "rm package-lock.json ; npm install . --prefer-online";
  return null;
});

function copy(text: string): void {
  navigator.clipboard.writeText(text).then(
    () => successToast("Copied to the clipboard"),
    () => errorToast("Could not copy to the clipboard"),
  );
}

function copyManifest(): void {
  copy(JSON.stringify(data.value?.patched_manifest_raw ?? {}, null, 2));
}
</script>

<template>
  <Skeleton
    v-if="loading"
    role="status"
    aria-label="Loading the patched manifest"
    class="h-48 rounded-card"
  />
  <Card v-else-if="data?.patched_manifest">
    <CardHeader>
      <CardTitle class="text-base">Patched manifest</CardTitle>
      <CardDescription>
        The upgrades applied to <code class="font-mono">{{ packageFile }}</code
        >.
      </CardDescription>
    </CardHeader>
    <CardContent class="flex flex-col gap-6">
      <section
        v-for="group in groups"
        :key="group.field"
        class="flex flex-col gap-2"
      >
        <h4 class="text-sm font-semibold text-foreground-strong">
          {{ group.title }}
        </h4>
        <ul class="flex flex-col divide-y rounded-control border text-sm">
          <li
            v-for="item in group.changes"
            :key="item.name"
            class="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
          >
            <span class="font-mono">
              <span class="font-semibold text-foreground-strong">{{
                item.name
              }}</span>
              {{ item.from }}
              <template v-if="item.to"> to {{ item.to }}</template>
            </span>
            <StatusBadge :tone="item.tone" :label="item.label" />
          </li>
        </ul>
      </section>

      <ol class="flex list-decimal flex-col gap-4 pl-5 text-sm">
        <li class="flex flex-col items-start gap-2">
          <span>
            Replace <code class="font-mono">{{ packageFile }}</code> with the
            patched manifest.
          </span>
          <Button variant="outline" size="sm" @click="copyManifest">
            <Copy aria-hidden="true" class="size-4" />
            Copy the patched manifest
          </Button>
        </li>
        <li v-if="command" class="flex flex-col items-start gap-2">
          <span>Reinstall to update the lockfile.</span>
          <div
            class="flex flex-wrap items-center gap-2 rounded-control bg-muted px-3 py-2"
          >
            <code class="font-mono">{{ command }}</code>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Copy the command"
              @click="copy(command)"
            >
              <Copy aria-hidden="true" class="size-4" />
            </Button>
          </div>
        </li>
      </ol>
    </CardContent>
  </Card>
</template>

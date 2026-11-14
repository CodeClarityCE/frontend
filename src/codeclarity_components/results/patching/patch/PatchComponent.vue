<script lang="ts" setup>
import { computed } from "vue";

import { StatusBadge } from "@/base_components/page";
import type { PatchInfo } from "@/codeclarity_components/results/patching/Patching";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";

import { patchStatus, semverText } from "../patch-format";

import PatchInformation from "./PatchInformation.vue";

// A Details button that opens which vulnerabilities an upgrade fixes.
const props = defineProps<{
  patch: PatchInfo;
  name: string;
  type: "prod" | "dev";
}>();

const status = computed(() => patchStatus(props.patch.IsPatchable));
const upgrade = computed(() => semverText(props.patch.Update));
</script>

<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button variant="outline" size="sm" :aria-label="`Details of ${name}`">
        Details
      </Button>
    </DialogTrigger>
    <DialogContent class="max-h-[85vh] max-w-2xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ name }}</DialogTitle>
        <DialogDescription class="flex flex-wrap items-center gap-2">
          <StatusBadge v-bind="status" />
          <span>{{
            type === "dev" ? "Development dependency" : "Production dependency"
          }}</span>
          <span v-if="upgrade">, upgrade to {{ upgrade }}</span>
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-6">
        <section
          v-if="(patch.Patchable?.length ?? 0) > 0"
          class="flex flex-col gap-2"
        >
          <h3 class="text-sm font-semibold text-foreground-strong">
            Fixed by the upgrade ({{ patch.Patchable.length }})
          </h3>
          <ul class="flex flex-col gap-2">
            <PatchInformation
              v-for="(item, index) in patch.Patchable"
              :key="`fixed-${index}`"
              :patch="item"
              :patch-info="patch"
            />
          </ul>
        </section>
        <section
          v-if="(patch.Unpatchable?.length ?? 0) > 0"
          class="flex flex-col gap-2"
        >
          <h3 class="text-sm font-semibold text-foreground-strong">
            Not fixed ({{ patch.Unpatchable.length }})
          </h3>
          <ul class="flex flex-col gap-2">
            <PatchInformation
              v-for="(item, index) in patch.Unpatchable"
              :key="`open-${index}`"
              :patch="item"
              :patch-info="patch"
            />
          </ul>
        </section>
      </div>
    </DialogContent>
  </Dialog>
</template>

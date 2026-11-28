<script lang="ts" setup>
import { ChevronDown, Download } from "@lucide/vue";
import { ref } from "vue";

import {
  ResultsRepository,
  type SourceVerdictExportFormat,
} from "@/codeclarity_components/results/results.repository";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { Spinner } from "@/shadcn/ui/spinner";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { saveBlob } from "@/utils/download";
import { errorToast } from "@/utils/toasts";

// Downloads every source verdict of the analysis, one row per instance and source.
const props = defineProps<{ analysisID: string; projectID: string }>();

const FORMATS: {
  id: SourceVerdictExportFormat;
  name: string;
  description: string;
}[] = [
  { id: "csv", name: "CSV", description: "One row per instance and source" },
  { id: "json", name: "JSON", description: "The same rows, as JSON" },
];

const resultsRepository = new ResultsRepository();
const userStore = useUserStore();
const authStore = useAuthStore();
const exporting = ref(false);

async function exportVerdicts(
  format: SourceVerdictExportFormat,
): Promise<void> {
  const org = userStore.getDefaultOrg;
  if (!org || !authStore.getAuthenticated || exporting.value) return;
  exporting.value = true;
  try {
    const blob = await resultsRepository.downloadSourceVerdicts({
      orgId: org.id,
      projectId: props.projectID,
      analysisId: props.analysisID,
      format,
      handleBusinessErrors: true,
    });
    saveBlob(blob, `source-verdicts-${props.analysisID}.${format}`);
  } catch (err) {
    errorToast(
      err instanceof BusinessLogicError &&
        err.error_code === APIErrors.SourceVerdictsNotAvailable
        ? "This analysis predates source verdicts. Re-run it to export them."
        : "Could not export the source verdicts",
    );
  } finally {
    exporting.value = false;
  }
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" :disabled="exporting">
        <Spinner v-if="exporting" />
        <Download v-else aria-hidden="true" class="size-4" />
        {{ exporting ? "Exporting" : "Export source verdicts" }}
        <ChevronDown aria-hidden="true" class="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-64">
      <DropdownMenuLabel>Export format</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        v-for="format in FORMATS"
        :key="format.id"
        :data-testid="`export-verdicts-${format.id}`"
        class="flex flex-col items-start gap-0.5"
        @select="exportVerdicts(format.id)"
      >
        <span class="font-medium">{{ format.name }}</span>
        <span class="text-xs text-muted-foreground">{{
          format.description
        }}</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

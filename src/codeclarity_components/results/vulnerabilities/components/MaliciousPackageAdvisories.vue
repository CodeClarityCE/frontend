<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { ref, watch } from "vue";

import {
  type MaliciousPackageAdvisory,
  ResultsRepository,
} from "@/codeclarity_components/results/results.repository";
import { Alert, AlertDescription, AlertTitle } from "@/shadcn/ui/alert";
import { Badge } from "@/shadcn/ui/badge";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { formatDate } from "@/utils/dateUtils";

const props = defineProps<{
  analysisID: string;
  projectID: string;
  workspace: string;
}>();

const authStore = useAuthStore();
const userStore = useUserStore();
const advisories = ref<MaliciousPackageAdvisory[]>([]);

// Counts requests so a slow answer for an earlier selection is dropped.
let latestRequest = 0;

// Advisory data comes from outside, so only web addresses become links.
function isWebUrl(reference: string): boolean {
  try {
    const { protocol } = new URL(reference);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

// The section is an addition to the page, so a failed lookup must not affect the rest.
async function loadAdvisories(): Promise<void> {
  const request = ++latestRequest;
  advisories.value = [];

  const org = userStore.getDefaultOrg;
  const token = authStore.getToken;
  if (!authStore.getAuthenticated || !token || !org) return;
  if (props.analysisID === "" || props.projectID === "") return;

  try {
    const response =
      await new ResultsRepository().getMaliciousPackageAdvisories({
        orgId: org.id,
        projectId: props.projectID,
        analysisId: props.analysisID,
        workspace: props.workspace,
        bearerToken: token,
        handleBusinessErrors: true,
        handleHTTPErrors: true,
        handleOtherErrors: true,
      });
    if (request === latestRequest) advisories.value = response.data;
  } catch (error) {
    console.warn("Could not load malicious package advisories", error);
  }
}

watch(
  () => [props.analysisID, props.projectID, props.workspace],
  () => void loadAdvisories(),
  { immediate: true },
);
</script>

<template>
  <Alert
    v-if="advisories.length > 0"
    variant="destructive"
    data-testid="malicious-package-advisories"
    class="border-2"
  >
    <Icon icon="solar:danger-triangle-bold" class="h-5 w-5" />
    <AlertTitle class="text-base font-semibold">
      Malicious packages found
    </AlertTitle>
    <AlertDescription class="text-foreground">
      <p>
        These packages are reported as intentionally harmful, so updating to
        another version is not enough. Remove them, and treat any machine or
        pipeline that installed them as potentially compromised, including the
        credentials it could reach.
      </p>
      <ul class="mt-4 flex flex-col gap-4">
        <li
          v-for="advisory in advisories"
          :key="`${advisory.AdvisoryId}-${advisory.AffectedDependency}-${advisory.AffectedVersion}`"
          data-advisory
          class="rounded-md border p-3"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-semibold">
              {{ advisory.AffectedDependency }}@{{ advisory.AffectedVersion }}
            </span>
            <Badge variant="destructive">Malicious</Badge>
            <Badge variant="outline">
              {{ advisory.DirectDependency ? "Direct" : "Transitive" }}
            </Badge>
          </div>
          <p class="mt-1 text-xs text-muted-foreground">
            {{ advisory.AdvisoryId }}
            <template v-if="advisory.Aliases?.length">
              ({{ advisory.Aliases.join(", ") }})
            </template>
            <template v-if="advisory.Published">
              , published {{ formatDate(advisory.Published, "LL") }}
            </template>
          </p>
          <p v-if="advisory.Summary" class="mt-2">{{ advisory.Summary }}</p>
          <p v-if="advisory.Details" class="mt-2 whitespace-pre-line">
            {{ advisory.Details }}
          </p>
          <ul
            v-if="advisory.References?.some(isWebUrl)"
            class="mt-2 list-disc pl-5"
          >
            <template v-for="reference in advisory.References" :key="reference">
              <li v-if="isWebUrl(reference)">
                <a
                  :href="reference"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="break-all underline"
                  >{{ reference }}</a
                >
              </li>
            </template>
          </ul>
        </li>
      </ul>
    </AlertDescription>
  </Alert>
</template>

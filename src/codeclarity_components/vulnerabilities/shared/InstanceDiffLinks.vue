<script setup lang="ts">
import CopyCommand from "@/base_components/ui/CopyCommand.vue";
import ExternalLink from "@/base_components/ui/ExternalLink.vue";

import type {
  FixCommitLink,
  InstanceDiffLinks,
} from "../organization_vulnerability.entity";

// The fix commits, guessed compare view and registry diff command of one instance.
defineProps<{ links: InstanceDiffLinks }>();

const HOSTS = { github: "GitHub", gitlab: "GitLab" } as const;

function fixLabel(fix: FixCommitLink): string {
  if (fix.sha) return `Fix commit ${fix.sha.slice(0, 7)}`;
  try {
    return `Fix ${new URL(fix.url).hostname}`;
  } catch {
    return "Fix";
  }
}
</script>

<template>
  <div class="space-y-2 text-sm">
    <ul
      v-if="links.fix_commits.length > 0 || links.compare"
      class="flex flex-wrap gap-x-4 gap-y-1"
    >
      <li v-for="fix in links.fix_commits" :key="fix.url">
        <ExternalLink :href="fix.url">{{ fixLabel(fix) }}</ExternalLink>
      </li>
      <li v-if="links.compare">
        <ExternalLink :href="links.compare.url"
          >Compare {{ links.compare.from_tag }}...{{ links.compare.to_tag }} on
          {{ HOSTS[links.compare.host] }}
          <span class="text-muted-foreground"
            >(guessed tags)</span
          ></ExternalLink
        >
      </li>
    </ul>
    <CopyCommand
      v-if="links.registry_diff"
      :command="links.registry_diff.command"
      label="registry diff"
    />
  </div>
</template>

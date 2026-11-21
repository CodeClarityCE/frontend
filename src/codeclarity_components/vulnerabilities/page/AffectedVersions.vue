<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/ui/card";

import type {
  AffectedPackageRanges,
  VersionRange,
} from "../organization_vulnerability.entity";

// The affected and fixed version ranges the knowledge sources give each package.
defineProps<{ affected: AffectedPackageRanges[] }>();

// A range as constraints, such as ">= 4.0.0, < 4.17.21".
function rangeText(range: VersionRange): string {
  const parts: string[] = [];
  if (range.introduced && range.introduced !== "0") {
    parts.push(`>= ${range.introduced}`);
  }
  if (range.fixed) parts.push(`< ${range.fixed}`);
  else if (range.last_affected) parts.push(`<= ${range.last_affected}`);
  return parts.length > 0 ? parts.join(", ") : "All versions";
}

const packageKey = (entry: AffectedPackageRanges): string =>
  `${entry.ecosystem ?? ""}\u0000${entry.package}`;
</script>

<template>
  <Card aria-label="Affected versions" role="region">
    <CardHeader>
      <CardTitle>Affected versions</CardTitle>
    </CardHeader>
    <CardContent>
      <p v-if="affected.length === 0" class="text-sm text-muted-foreground">
        No knowledge source gives affected version ranges.
      </p>
      <ul v-else class="flex flex-col gap-4 text-sm">
        <li v-for="entry in affected" :key="packageKey(entry)">
          <p>
            <span class="font-medium">{{ entry.package }}</span>
            <span v-if="entry.ecosystem" class="ml-2 text-muted-foreground">{{
              entry.ecosystem
            }}</span>
          </p>
          <dl class="mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt class="text-muted-foreground">Affected</dt>
            <dd>
              <ul class="flex flex-wrap gap-2 font-mono text-xs">
                <li
                  v-for="range in entry.ranges"
                  :key="rangeText(range)"
                  class="rounded-control border px-2 py-0.5"
                >
                  {{ rangeText(range) }}
                </li>
              </ul>
            </dd>
            <dt class="text-muted-foreground">Fixed in</dt>
            <dd
              v-if="entry.fixed_versions.length > 0"
              class="font-medium tabular-nums"
            >
              {{ entry.fixed_versions.join(", ") }}
            </dd>
            <dd v-else class="font-medium text-severity-high">
              No fix available
            </dd>
          </dl>
        </li>
      </ul>
    </CardContent>
  </Card>
</template>

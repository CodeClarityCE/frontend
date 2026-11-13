<script lang="ts" setup>
import { ChevronDown, Download, LoaderCircle } from "@lucide/vue";

import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";

import type { ExportFormat } from "./exports/sbomExportUtils";

// A menu of SBOM download formats; the parent builds the file.
defineProps<{ exporting?: boolean }>();

const emit = defineEmits<{ export: [format: ExportFormat] }>();

const FORMATS: { id: ExportFormat; name: string; description: string }[] = [
  { id: "csv", name: "CSV", description: "Comma-separated values" },
  { id: "html", name: "HTML report", description: "A table you can print" },
  { id: "json", name: "JSON", description: "Every field, as JSON" },
  {
    id: "cyclonedx",
    name: "CycloneDX",
    description: "The industry standard SBOM format",
  },
];
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" :disabled="exporting">
        <LoaderCircle
          v-if="exporting"
          aria-hidden="true"
          class="size-4 animate-spin motion-reduce:animate-none"
        />
        <Download v-else aria-hidden="true" class="size-4" />
        {{ exporting ? "Exporting" : "Export SBOM" }}
        <ChevronDown aria-hidden="true" class="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-64">
      <DropdownMenuLabel>Export format</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        v-for="format in FORMATS"
        :key="format.id"
        class="flex flex-col items-start gap-0.5"
        @select="emit('export', format.id)"
      >
        <span class="font-medium">{{ format.name }}</span>
        <span class="text-xs text-muted-foreground">{{
          format.description
        }}</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

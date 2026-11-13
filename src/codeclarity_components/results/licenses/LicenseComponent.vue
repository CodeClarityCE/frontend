<script lang="ts" setup>
import { ExternalLink } from "@lucide/vue";
import { computed } from "vue";

import { StatusBadge } from "@/base_components/page";
import { type License } from "@/codeclarity_components/results/licenses/License";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";

import {
  licenseFamily,
  licenseName,
  licenseStatus,
  propertyDescription,
  propertyName,
} from "./license-format";

// A Details button that opens what a license allows, requires and limits.
const props = withDefaults(
  defineProps<{ license: License; analysisID?: string; projectID?: string }>(),
  { analysisID: "", projectID: "" },
);

const name = computed(() => licenseName(props.license));

const sections = computed(() => {
  const properties = props.license.license_properties;
  if (!properties) return [];
  return (
    [
      [
        "Permissions",
        "What the license allows",
        properties.permissions,
        "permission",
      ],
      ["Conditions", "What you must do", properties.conditions, "condition"],
      [
        "Limitations",
        "What the license does not give",
        properties.limitations,
        "limitation",
      ],
    ] as const
  )
    .filter(([, , list]) => (list?.length ?? 0) > 0)
    .map(([title, description, list, kind]) => ({
      title,
      description,
      items: list.map((property) => ({
        property,
        name: propertyName(property),
        text: propertyDescription(property, kind),
      })),
    }));
});

function referenceHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function dependencyRoute(dep: string): Record<string, unknown> {
  return {
    name: "results",
    params: { page: "sbom_details" },
    query: {
      analysis_id: props.analysisID,
      project_id: props.projectID,
      package_id: dep,
    },
  };
}

const LINK =
  "inline-flex items-center gap-1 rounded-sm font-medium text-brand-subtle-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
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
          <StatusBadge v-bind="licenseStatus(license)" />
          <span>{{ licenseFamily(license) }} license</span>
          <span v-if="license.name && license.name !== license.id"
            >({{ license.id }})</span
          >
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-6 text-sm">
        <p v-if="license.description">{{ license.description }}</p>

        <section
          v-for="section in sections"
          :key="section.title"
          class="flex flex-col gap-2"
        >
          <h3 class="font-semibold text-foreground-strong">
            {{ section.title }}
            <span class="font-normal text-muted-foreground">{{
              section.description
            }}</span>
          </h3>
          <dl class="flex flex-col gap-2">
            <div
              v-for="item in section.items"
              :key="item.property"
              class="rounded-control border p-3"
            >
              <dt class="font-medium text-foreground-strong">
                {{ item.name }}
              </dt>
              <dd class="text-muted-foreground">{{ item.text }}</dd>
            </div>
          </dl>
        </section>

        <section class="flex flex-col gap-2">
          <h3 class="font-semibold text-foreground-strong">
            Dependencies using it ({{
              license.deps_using_license?.length ?? 0
            }})
          </h3>
          <ul class="flex max-h-48 flex-col gap-1 overflow-y-auto">
            <li v-for="dep in license.deps_using_license" :key="dep">
              <RouterLink :class="LINK" :to="dependencyRoute(dep)">{{
                dep
              }}</RouterLink>
            </li>
          </ul>
        </section>

        <section
          v-if="(license.references?.length ?? 0) > 0"
          class="flex flex-col gap-2"
        >
          <h3 class="font-semibold text-foreground-strong">References</h3>
          <ul class="flex flex-col gap-1">
            <li v-for="reference in license.references" :key="reference">
              <a :href="reference" target="_blank" rel="noopener" :class="LINK">
                {{ referenceHost(reference) }}
                <ExternalLink aria-hidden="true" class="size-3.5" />
                <span class="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          </ul>
        </section>

        <p v-if="sections.length > 0" class="text-xs text-muted-foreground">
          License properties from
          <a
            href="https://choosealicense.com/"
            target="_blank"
            rel="noopener"
            :class="LINK"
            >choosealicense.com</a
          >
          under
          <a
            href="https://creativecommons.org/licenses/by/3.0/"
            target="_blank"
            rel="noopener"
            :class="LINK"
            >CC BY 3.0</a
          >.
        </p>
      </div>
    </DialogContent>
  </Dialog>
</template>

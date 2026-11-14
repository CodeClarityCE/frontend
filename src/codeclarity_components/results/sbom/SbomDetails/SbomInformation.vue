<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { ArrowRight, ChevronDown, ExternalLink } from "@lucide/vue";
import { computed } from "vue";

import { StatusBadge, type StatusTone } from "@/base_components/page";
import { type DependencyDetails } from "@/codeclarity_components/results/sbom/SbomDetails/SbomDetails";
import { Card, CardContent, CardHeader } from "@/shadcn/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shadcn/ui/collapsible";
import {
  calculateDateDifference,
  formatRelativeTime,
  isValidDate,
} from "@/utils/dateUtils";
import {
  EcosystemDetector,
  EcosystemMetadataExtractor,
  PackageEcosystem,
} from "@/utils/packageEcosystem";

// The version, license, age, ecosystem and engines of one dependency.
const props = defineProps<{ dependency: DependencyDetails }>();

const ecosystem = computed(() =>
  EcosystemDetector.detectFromDependency(props.dependency),
);
const metadata = computed(() =>
  EcosystemMetadataExtractor.extractMetadata(props.dependency, ecosystem.value),
);
// Only language logos are bundled, so other icons are left out.
const ecosystemLogo = computed(() =>
  ecosystem.value.icon.startsWith("devicon:") ? ecosystem.value.icon : null,
);

function humanDays(days: number): string {
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.round(days / 30)} months`;
  return `${Math.round(days / 365)} years`;
}

const versionStatus = computed((): { tone: StatusTone; label: string } => {
  const { version, latest_version, release_date, lastest_release_date } =
    props.dependency;
  if (!version || version === latest_version)
    return { tone: "success", label: "Using the latest version" };
  if (lastest_release_date && release_date) {
    const lag = calculateDateDifference(
      lastest_release_date,
      release_date,
      "days",
    );
    if (lag > 182)
      return { tone: "warning", label: `${humanDays(lag)} behind latest` };
  }
  return { tone: "neutral", label: `Update available (${latest_version})` };
});

const age = computed(() => {
  if (!props.dependency.release_date) return "Unknown";
  const days = calculateDateDifference(
    new Date(),
    props.dependency.release_date,
    "days",
  );
  return `${humanDays(days)} old`;
});

const ENGINE_LOGOS: Record<string, string> = {
  node: "devicon:nodejs",
  npm: "devicon:npm",
  yarn: "devicon:yarn",
  python: "devicon:python",
  java: "devicon:java",
  go: "devicon:go",
  rust: "devicon:rust",
  php: "devicon:php",
};

const engines = computed(() =>
  Object.entries(props.dependency.engines ?? {}).map(([name, range]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    range,
    logo: ENGINE_LOGOS[name.toLowerCase()] ?? null,
  })),
);

const ecosystemUrl = computed(() => {
  if (!ecosystem.value.website) return "";
  const path =
    ecosystem.value.type === PackageEcosystem.PACKAGIST
      ? "packages"
      : "package";
  return `${ecosystem.value.website}/${path}/${props.dependency.name}`;
});

function metadataText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(metadataText).join(", ");
  return JSON.stringify(value, null, 2);
}

// Metadata entries worth showing, as readable text.
const metadataEntries = computed(() =>
  Object.entries(metadata.value)
    .filter(([, value]) => value !== undefined && value !== null)
    .filter(([, value]) =>
      typeof value === "object" ? Object.keys(value!).length > 0 : value !== "",
    )
    .map(([key, value]) => ({
      key,
      label: key.replace(/([A-Z])/g, " $1").toLowerCase(),
      text: metadataText(value),
      block: typeof value === "object" && !Array.isArray(value),
    })),
);

const LINK =
  "inline-flex items-center gap-1 rounded-sm font-medium text-brand-subtle-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-2">
    <Card>
      <CardHeader>
        <h2 class="text-lg font-semibold leading-none tracking-tight">
          Version and release
        </h2>
      </CardHeader>
      <CardContent class="flex flex-col gap-4 text-sm">
        <div class="flex items-start gap-6">
          <div class="flex flex-col gap-1">
            <span class="text-muted-foreground">Installed</span>
            <code class="font-mono font-semibold text-foreground-strong">{{
              dependency.version
            }}</code>
            <span
              v-if="isValidDate(dependency.release_date)"
              class="text-xs text-muted-foreground"
              >{{ formatRelativeTime(dependency.release_date) }}</span
            >
          </div>
          <ArrowRight
            aria-hidden="true"
            class="mt-6 size-4 text-muted-foreground"
          />
          <div class="flex flex-col gap-1">
            <span class="text-muted-foreground">Latest</span>
            <code class="font-mono font-semibold text-foreground-strong">{{
              dependency.latest_version
            }}</code>
            <span
              v-if="isValidDate(dependency.lastest_release_date)"
              class="text-xs text-muted-foreground"
              >{{ formatRelativeTime(dependency.lastest_release_date) }}</span
            >
          </div>
        </div>
        <StatusBadge v-bind="versionStatus" class="self-start" />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <h2 class="text-lg font-semibold leading-none tracking-tight">
          Package details
        </h2>
      </CardHeader>
      <CardContent>
        <dl class="flex flex-col gap-2 text-sm">
          <div
            class="flex items-center justify-between gap-4 border-b pb-2 last:border-b-0"
          >
            <dt class="text-muted-foreground">License</dt>
            <dd>
              <span
                v-if="dependency.license"
                class="font-semibold text-foreground-strong"
                >{{ dependency.license }}</span
              >
              <StatusBadge v-else tone="danger" label="Unlicensed" />
            </dd>
          </div>
          <div
            class="flex items-center justify-between gap-4 border-b pb-2 last:border-b-0"
          >
            <dt class="text-muted-foreground">Release age</dt>
            <dd class="font-semibold text-foreground-strong">{{ age }}</dd>
          </div>
          <div
            class="flex items-center justify-between gap-4 border-b pb-2 last:border-b-0"
          >
            <dt class="text-muted-foreground">Ecosystem</dt>
            <dd class="flex items-center gap-1.5">
              <Icon
                v-if="ecosystemLogo"
                :icon="ecosystemLogo"
                aria-hidden="true"
                class="size-4"
              />
              <a
                v-if="ecosystemUrl"
                :href="ecosystemUrl"
                target="_blank"
                rel="noopener"
                :class="LINK"
              >
                {{ ecosystem.name }}
                <ExternalLink aria-hidden="true" class="size-3.5" />
                <span class="sr-only">(opens in a new tab)</span>
              </a>
              <span v-else>{{ ecosystem.name }}</span>
            </dd>
          </div>
          <div
            v-if="engines.length > 0"
            class="flex items-center justify-between gap-4 border-b pb-2 last:border-b-0"
          >
            <dt class="text-muted-foreground">Engines</dt>
            <dd>
              <ul class="flex flex-wrap justify-end gap-3">
                <li
                  v-for="engine in engines"
                  :key="engine.name"
                  class="flex items-center gap-1"
                >
                  <Icon
                    v-if="engine.logo"
                    :icon="engine.logo"
                    aria-hidden="true"
                    class="size-4"
                  />
                  {{ engine.name }}
                  <code class="font-mono">{{ engine.range }}</code>
                </li>
              </ul>
            </dd>
          </div>
          <div
            v-if="ecosystem.tools.length > 0"
            class="flex items-center justify-between gap-4 border-b pb-2 last:border-b-0"
          >
            <dt class="text-muted-foreground">Tools</dt>
            <dd>{{ ecosystem.tools.join(", ") }}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>

    <Card v-if="metadataEntries.length > 0" class="lg:col-span-2">
      <Collapsible v-slot="{ open }">
        <CardHeader>
          <h2 class="text-lg font-semibold leading-none tracking-tight">
            <CollapsibleTrigger
              class="flex w-full items-center justify-between gap-2 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {{ ecosystem.language }} metadata
              <ChevronDown
                aria-hidden="true"
                class="size-4 transition-transform motion-reduce:transition-none"
                :class="open ? 'rotate-180' : ''"
              />
            </CollapsibleTrigger>
          </h2>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <dl class="flex flex-col gap-3 text-sm">
              <div v-for="entry in metadataEntries" :key="entry.key">
                <dt class="font-semibold capitalize text-foreground-strong">
                  {{ entry.label }}
                </dt>
                <dd>
                  <pre
                    v-if="entry.block"
                    class="max-h-40 overflow-auto rounded-control bg-muted p-2 font-mono text-xs"
                    >{{ entry.text }}</pre>
                  <span v-else>{{ entry.text }}</span>
                </dd>
              </div>
            </dl>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  </div>
</template>

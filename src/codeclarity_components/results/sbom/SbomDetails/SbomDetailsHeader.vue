<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { ExternalLink } from "@lucide/vue";
import { computed } from "vue";

import { type DependencyDetails } from "@/codeclarity_components/results/sbom/SbomDetails/SbomDetails";

// Links to the package registry and source repository of a dependency.
const props = defineProps<{ dependency: DependencyDetails }>();

interface PackageLink {
  label: string;
  href: string;
  logo: string;
}

const links = computed((): PackageLink[] => {
  const { name, version, package_manager, source } = props.dependency;
  const pm = package_manager?.toLowerCase() ?? "";
  const list: PackageLink[] = [];
  if (["npm", "yarn", "pnpm", ""].includes(pm)) {
    list.push(
      {
        label: "npm",
        href: `https://www.npmjs.com/package/${name}/v/${version}`,
        logo: "simple-icons:npm",
      },
      {
        label: "Yarn",
        href: `https://yarnpkg.com/package?name=${name}&version=${version}`,
        logo: "simple-icons:yarn",
      },
    );
  }
  if (pm === "composer") {
    list.push({
      label: "Packagist",
      href: `https://packagist.org/packages/${name}#${version}`,
      logo: "simple-icons:packagist",
    });
  }
  if (source?.Type === "git") {
    const href = source.Url.replace("git+", "");
    if (source.Url.includes("github"))
      list.push({ label: "GitHub", href, logo: "simple-icons:github" });
    else if (source.Url.includes("gitlab"))
      list.push({ label: "GitLab", href, logo: "simple-icons:gitlab" });
  }
  return list;
});
</script>

<template>
  <ul v-if="links.length > 0" class="flex flex-wrap gap-x-5 gap-y-2 text-sm">
    <li v-for="link in links" :key="link.label">
      <a
        :href="link.href"
        target="_blank"
        rel="noopener"
        class="inline-flex items-center gap-1.5 rounded-sm font-medium text-brand-subtle-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon :icon="link.logo" aria-hidden="true" class="size-4" />
        {{ link.label }}
        <ExternalLink aria-hidden="true" class="size-3.5" />
        <span class="sr-only">(opens in a new tab)</span>
      </a>
    </li>
  </ul>
</template>

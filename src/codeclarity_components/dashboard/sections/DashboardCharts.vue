<script setup lang="ts">
import type {
  OrganizationVulnerabilityFilters,
  OrganizationVulnerabilityList,
} from "@/codeclarity_components/vulnerabilities/organization_vulnerability.entity";
import type {
  VulnerabilityTrend,
  VulnerabilityTrendFilters,
} from "@/codeclarity_components/vulnerabilities/vulnerability_trend.entity";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/ui/card";

import CurrentVulns from "../charts/CurrentVulns.vue";
import LicenseDist from "../charts/LicenseDist.vue";
import OpenVulnerabilitiesTrend from "../charts/OpenVulnerabilitiesTrend.vue";
import StaleProjects from "../charts/StaleProjects.vue";
import TicketsDashboardCard from "../charts/TicketsDashboardCard.vue";
import VulnerabilityImpact from "../charts/VulnerabilityImpact.vue";
import type { FilteredDashboardRequest } from "../composables/useDashboardRequest";

// The project overview's charts and summaries, one card each.
defineProps<{
  integrationIds: string[];
  /** Shared with the project numbers, so it is requested once */
  vulnerabilityList: FilteredDashboardRequest<
    OrganizationVulnerabilityList,
    OrganizationVulnerabilityFilters
  >;
  /** Shared with the project numbers, which follow its filters */
  trend: FilteredDashboardRequest<
    VulnerabilityTrend,
    VulnerabilityTrendFilters
  >;
  /** The projects the vulnerability list can be narrowed to */
  projects: { id: string; name: string }[];
  /** The organization shown, for links to its vulnerability pages */
  orgId: string;
}>();
</script>

<template>
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <Card class="rounded-card shadow-card lg:col-span-2">
      <CardHeader>
        <CardTitle class="text-base leading-normal"
          >Open vulnerabilities over time</CardTitle
        >
        <CardDescription>
          Vulnerability instances in each project's current analysis at the end
          of each period, and how many were introduced and fixed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OpenVulnerabilitiesTrend :request="trend" />
      </CardContent>
    </Card>
    <Card class="rounded-card shadow-card">
      <CardHeader>
        <CardTitle class="text-base leading-normal"
          >Vulnerabilities summary</CardTitle
        >
        <CardDescription
          >Current threats affecting your projects</CardDescription
        >
      </CardHeader>
      <CardContent>
        <CurrentVulns
          :request="vulnerabilityList"
          :projects="projects"
          :org-id="orgId"
        />
      </CardContent>
    </Card>
    <Card class="rounded-card shadow-card">
      <CardHeader>
        <CardTitle class="text-base leading-normal">Tickets</CardTitle>
        <CardDescription
          >Track vulnerability remediation progress</CardDescription
        >
      </CardHeader>
      <CardContent>
        <TicketsDashboardCard :integration-ids="integrationIds" />
      </CardContent>
    </Card>
    <Card class="rounded-card shadow-card">
      <CardHeader>
        <CardTitle class="text-base leading-normal">Stale projects</CardTitle>
        <CardDescription>Projects not analysed lately</CardDescription>
      </CardHeader>
      <CardContent>
        <StaleProjects />
      </CardContent>
    </Card>
    <Card class="rounded-card shadow-card">
      <CardHeader>
        <CardTitle class="text-base leading-normal"
          >Open source licenses</CardTitle
        >
        <CardDescription>Licenses across your dependencies</CardDescription>
      </CardHeader>
      <CardContent>
        <LicenseDist :integration-ids="integrationIds" />
      </CardContent>
    </Card>
    <Card class="rounded-card shadow-card">
      <CardHeader>
        <CardTitle class="text-base leading-normal">Impact analysis</CardTitle>
        <CardDescription>
          Mean impact of vulnerabilities on your projects
        </CardDescription>
      </CardHeader>
      <CardContent>
        <VulnerabilityImpact :integration-ids="integrationIds" />
      </CardContent>
    </Card>
  </div>
</template>

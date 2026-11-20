<script setup lang="ts">
import type { OrganizationVulnerabilityList } from "@/codeclarity_components/vulnerabilities/organization_vulnerability.entity";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/ui/card";

import CurrentVulns from "../charts/CurrentVulns.vue";
import ExposureOverview from "../charts/ExposureOverview.vue";
import LicenseDist from "../charts/LicenseDist.vue";
import StaleProjects from "../charts/StaleProjects.vue";
import TicketsDashboardCard from "../charts/TicketsDashboardCard.vue";
import VulnerabilityImpact from "../charts/VulnerabilityImpact.vue";
import type { DashboardRequest } from "../composables/useDashboardRequest";

// The project overview's charts and summaries, one card each.
defineProps<{
  integrationIds: string[];
  /** Shared with the project numbers, so it is requested once */
  vulnerabilityList: DashboardRequest<OrganizationVulnerabilityList>;
}>();
</script>

<template>
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <Card class="rounded-card shadow-card lg:col-span-2">
      <CardHeader>
        <CardTitle class="text-base">Vulnerability exposure</CardTitle>
        <CardDescription>
          Total severity of vulnerabilities across all your projects
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ExposureOverview :integration-ids="integrationIds" />
      </CardContent>
    </Card>
    <Card class="rounded-card shadow-card">
      <CardHeader>
        <CardTitle class="text-base">Vulnerabilities summary</CardTitle>
        <CardDescription
          >Current threats affecting your projects</CardDescription
        >
      </CardHeader>
      <CardContent>
        <CurrentVulns :request="vulnerabilityList" />
      </CardContent>
    </Card>
    <Card class="rounded-card shadow-card">
      <CardHeader>
        <CardTitle class="text-base">Tickets</CardTitle>
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
        <CardTitle class="text-base">Stale projects</CardTitle>
        <CardDescription>Projects not analysed lately</CardDescription>
      </CardHeader>
      <CardContent>
        <StaleProjects />
      </CardContent>
    </Card>
    <Card class="rounded-card shadow-card">
      <CardHeader>
        <CardTitle class="text-base">Open source licenses</CardTitle>
        <CardDescription>Licenses across your dependencies</CardDescription>
      </CardHeader>
      <CardContent>
        <LicenseDist :integration-ids="integrationIds" />
      </CardContent>
    </Card>
    <Card class="rounded-card shadow-card">
      <CardHeader>
        <CardTitle class="text-base">Impact analysis</CardTitle>
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

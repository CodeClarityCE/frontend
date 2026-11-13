<script lang="ts" setup>
import { KeyRound, RefreshCw, Trash2, TriangleAlert } from "@lucide/vue";
import { computed, ref } from "vue";
import { type RouteLocationRaw, RouterLink } from "vue-router";

import { StatusBadge } from "@/base_components/page";
import { type AccessTokenBasedIntegration } from "@/codeclarity_components/organizations/integrations/Integrations";
import router from "@/router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shadcn/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/shadcn/ui/card";
import { Skeleton } from "@/shadcn/ui/skeleton";
import { APIErrors } from "@/utils/api/ApiErrors";
import { formatDate, formatRelativeTime } from "@/utils/dateUtils";

import DeleteIntegrationDialog from "./DeleteIntegrationDialog.vue";
import { integrationHealth } from "./integration-status";

// The detail page of a GitHub or GitLab integration: health, token and actions.
const props = defineProps<{
  name: string;
  integration?: AccessTokenBasedIntegration;
  updateRoute: RouteLocationRaw;
  loading?: boolean;
  error?: boolean;
  errorCode?: string;
  deleting?: boolean;
}>();

const emit = defineEmits<{
  (e: "refresh"): void;
  (e: "delete"): void;
}>();

const confirmOpen = ref(false);

const health = computed(() =>
  props.integration ? integrationHealth(props.integration) : undefined,
);

const errorText = computed(() => {
  if (props.errorCode === APIErrors.EntityNotFound) {
    return "This integration does not exist.";
  }
  if (props.errorCode === APIErrors.NotAuthorized) {
    return "You do not have the permissions to view this integration.";
  }
  return "We encountered an error while loading the integration.";
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <h2
      class="flex items-center gap-3 text-2xl font-bold text-foreground-strong"
    >
      <slot name="header-integration-icon" />
      {{ name }} integration
    </h2>

    <Alert v-if="error" variant="destructive">
      <AlertTitle>The integration could not be loaded</AlertTitle>
      <AlertDescription class="flex flex-col items-start gap-3">
        {{ errorText }}
        <div class="flex gap-2">
          <Button
            v-if="errorCode !== APIErrors.NotAuthorized"
            variant="outline"
            size="sm"
            @click="emit('refresh')"
          >
            Try again
          </Button>
          <Button variant="outline" size="sm" @click="router.back()">
            Go back
          </Button>
        </div>
      </AlertDescription>
    </Alert>

    <div
      v-else-if="loading || !integration || !health"
      role="status"
      aria-label="Loading the integration"
      class="flex flex-col gap-3"
    >
      <Skeleton class="h-40 w-full rounded-card" />
      <Skeleton class="h-24 w-full rounded-card" />
    </div>

    <template v-else>
      <Alert
        v-if="health.tone === 'warning'"
        class="border-warning bg-warning-subtle text-warning [&>svg]:text-warning"
      >
        <TriangleAlert aria-hidden="true" class="size-4" />
        <AlertTitle>The token expires soon</AlertTitle>
        <AlertDescription>
          Replace it with "Replace token" before it expires, or analyses of its
          repositories stop.
        </AlertDescription>
      </Alert>

      <Card class="rounded-card shadow-card">
        <CardHeader>
          <h3 class="font-semibold leading-none text-foreground-strong">
            Details
          </h3>
          <CardDescription>
            <slot name="header-integration-description" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl class="grid grid-cols-[max-content_1fr] gap-x-8 gap-y-3 text-sm">
            <dt class="text-muted-foreground">Status</dt>
            <dd class="flex items-center gap-2">
              <StatusBadge :tone="health.tone" :label="health.label" />
              <span class="text-muted-foreground">{{ health.hint }}</span>
            </dd>
            <dt class="text-muted-foreground">Host</dt>
            <dd>{{ integration.service_domain }}</dd>
            <dt class="text-muted-foreground">Added on</dt>
            <dd>{{ formatDate(integration.added_on, "LL") }}</dd>
            <dt class="text-muted-foreground">Expires</dt>
            <dd>
              <template v-if="integration.expiry_date">
                {{ formatDate(integration.expiry_date, "LL") }}
                ({{ formatRelativeTime(integration.expiry_date) }})
              </template>
              <template v-else>Never</template>
            </dd>
            <dt class="text-muted-foreground">Token type</dt>
            <dd class="flex items-center gap-2">
              <KeyRound aria-hidden="true" class="size-4" />
              <slot name="token-type" />
            </dd>
            <slot name="extra-header-item" />
          </dl>
        </CardContent>
      </Card>

      <Card class="rounded-card shadow-card">
        <CardHeader>
          <h3 class="font-semibold leading-none text-foreground-strong">
            Actions
          </h3>
        </CardHeader>
        <CardContent class="flex flex-wrap gap-3">
          <Button :as="RouterLink" :to="updateRoute" variant="outline">
            <RefreshCw aria-hidden="true" />
            Replace token
          </Button>
          <slot name="extra-action" />
          <Button variant="destructive" @click="confirmOpen = true">
            <Trash2 aria-hidden="true" />
            Delete integration
          </Button>
        </CardContent>
      </Card>

      <Card class="rounded-card shadow-card">
        <CardHeader>
          <h3 class="font-semibold leading-none text-foreground-strong">
            Questions
          </h3>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple">
            <AccordionItem value="unhealthy">
              <AccordionTrigger
                class="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                When does an integration become invalid?
              </AccordionTrigger>
              <AccordionContent>
                <ul class="flex list-disc flex-col gap-1 pl-5">
                  <li>The token is invalid or has expired.</li>
                  <li>
                    The token's permissions changed after it was added here.
                  </li>
                  <li>
                    The permissions CodeClarity needs changed since the token
                    was added.
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="fix">
              <AccordionTrigger
                class="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                How do I fix an invalid integration?
              </AccordionTrigger>
              <AccordionContent>
                <dl class="flex flex-col gap-3">
                  <div>
                    <dt class="font-medium">The token is invalid or expired</dt>
                    <dd class="text-muted-foreground">
                      Create a new token and add it with "Replace token".
                    </dd>
                  </div>
                  <div>
                    <dt class="font-medium">The token's permissions changed</dt>
                    <dd class="text-muted-foreground">
                      Give the token the
                      <code class="font-mono text-foreground-strong">repo</code>
                      and
                      <code class="font-mono text-foreground-strong"
                        >write:org</code
                      >
                      scopes again.
                    </dd>
                  </div>
                </dl>
              </AccordionContent>
            </AccordionItem>
            <slot name="extra-faq-item" />
          </Accordion>
        </CardContent>
      </Card>
    </template>

    <DeleteIntegrationDialog
      v-model:open="confirmOpen"
      :name="name"
      :busy="deleting"
      @confirm="emit('delete')"
    />
  </div>
</template>

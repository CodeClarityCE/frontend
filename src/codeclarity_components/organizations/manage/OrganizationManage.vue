<script lang="ts" setup>
import {
  Blocks,
  ChevronRight,
  FileText,
  LogOut,
  type LucideIcon,
  Mail,
  ScrollText,
  SlidersHorizontal,
  Trash2,
  Users,
} from "@lucide/vue";
import { computed, type Ref, ref } from "vue";
import { RouterLink } from "vue-router";

import { BrandEmphasis, PageHeading } from "@/base_components/page";
import {
  MemberRole,
  type Organization,
} from "@/codeclarity_components/organizations/organization.entity";
import { OrgRepository } from "@/codeclarity_components/organizations/organization.repository";
import HeaderItem from "@/codeclarity_components/organizations/subcomponents/HeaderItem.vue";
import OrgActionDialog from "@/codeclarity_components/organizations/subcomponents/OrgActionDialog.vue";
import {
  orgSettingsSubItems,
  orgSettingsSubItemTarget,
} from "@/codeclarity_components/shell/nav-items";
import router from "@/router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shadcn/ui/accordion";
import { Button } from "@/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/shadcn/ui/card";
import { Switch } from "@/shadcn/ui/switch";
import { useAuthStore } from "@/stores/auth";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { errorToast, successToast } from "@/utils/toasts";

const props = defineProps<{
  page: string;
  orgId: string;
}>();

const authStore = useAuthStore();
const orgRepo: OrgRepository = new OrgRepository();

const orgInfo: Ref<Organization | undefined> = ref();
const autoResolveTickets = ref(false);
const savingSettings = ref(false);
const dialogOpen = ref(false);
const dialogAction = ref<"leave" | "delete">("leave");

const descriptions: Record<string, { text: string; icon: LucideIcon }> = {
  Members: { text: "See who belongs and change their roles", icon: Users },
  Invites: { text: "Invite people and follow pending invitations", icon: Mail },
  Integrations: {
    text: "Connect GitHub, GitLab and ClickUp",
    icon: Blocks,
  },
  Analyzers: {
    text: "Choose which plugins an analysis runs",
    icon: SlidersHorizontal,
  },
  Policies: {
    text: "Licence and vulnerability rules for analyses",
    icon: FileText,
  },
  "Audit logs": {
    text: "Review what happened and who did it",
    icon: ScrollText,
  },
};

// The same pages as the sidebar, without the overview itself.
const settingsLinks = computed(() =>
  orgInfo.value
    ? orgSettingsSubItems(orgInfo.value)
        .filter((item) => item.label !== "Overview")
        .map((item) => ({
          ...item,
          to: orgSettingsSubItemTarget(item, props.orgId),
          ...descriptions[item.label],
        }))
    : [],
);

const isAdmin = computed(
  () =>
    orgInfo.value?.role === MemberRole.OWNER ||
    orgInfo.value?.role === MemberRole.ADMIN,
);

const faqs = [
  {
    question: "What is a personal organisation?",
    answer:
      "One is created for you when you register. It is private: nobody else can be invited to it.",
  },
  {
    question: "What are integrations?",
    answer:
      "A connection to an external service. GitHub and GitLab integrations import projects; ClickUp receives tickets.",
  },
  {
    question: "What are policies?",
    answer:
      "Rules the analyzers apply, such as licences to allow or block and vulnerabilities to flag.",
  },
  {
    question: "How do I add people?",
    answer:
      "Invite them from Invites. Personal organisations cannot have other members.",
  },
  {
    question: "How long does an invitation last?",
    answer:
      "Three days. You can resend or revoke it from Invites while it is pending.",
  },
];

function setOrgInfo(org: Organization): void {
  orgInfo.value = org;
  autoResolveTickets.value = org.auto_resolve_tickets ?? false;
}

async function setAutoResolve(enabled: boolean): Promise<void> {
  if (!authStore.getToken || !orgInfo.value || savingSettings.value) return;
  autoResolveTickets.value = enabled;
  savingSettings.value = true;
  try {
    await orgRepo.updateSettings({
      orgId: orgInfo.value.id,
      bearerToken: authStore.getToken,
      data: { auto_resolve_tickets: enabled },
      handleBusinessErrors: true,
    });
    successToast(
      enabled
        ? "Tickets now resolve automatically"
        : "Tickets no longer resolve automatically",
    );
  } catch (err) {
    autoResolveTickets.value = !enabled;
    errorToast(
      err instanceof BusinessLogicError &&
        err.error_code === APIErrors.NotAuthorized
        ? "You do not have permission to change this setting"
        : "The setting could not be saved",
    );
  } finally {
    savingSettings.value = false;
  }
}

function ask(action: "leave" | "delete"): void {
  dialogAction.value = action;
  dialogOpen.value = true;
}

function afterAction(): void {
  void router.push({ name: "orgs", params: { action: "list" } });
}
</script>
<template>
  <div class="flex flex-col gap-8">
    <HeaderItem v-if="orgId" :org-id="orgId" @on-org-info="setOrgInfo" />

    <template v-if="orgInfo">
      <PageHeading
        description="Everything this organisation shares: people, connections and the rules its analyses follow."
      >
        Organisation <BrandEmphasis>overview</BrandEmphasis>
      </PageHeading>

      <section aria-labelledby="org-settings-links" class="flex flex-col gap-4">
        <h2
          id="org-settings-links"
          class="text-lg font-semibold text-foreground-strong"
        >
          Settings
        </h2>
        <ul class="grid grid-cols-2 gap-4 xl:grid-cols-3">
          <li v-for="link in settingsLinks" :key="link.label">
            <RouterLink
              :to="link.to"
              class="group flex h-full items-center gap-4 rounded-card border bg-card p-4 text-card-foreground shadow-card transition-colors duration-150 hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              <span
                class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand-subtle-foreground"
              >
                <component :is="link.icon" aria-hidden="true" class="size-5" />
              </span>
              <span class="flex min-w-0 flex-1 flex-col">
                <span class="font-semibold text-foreground-strong">
                  {{ link.label }}
                </span>
                <span class="text-sm text-muted-foreground">{{
                  link.text
                }}</span>
              </span>
              <ChevronRight
                aria-hidden="true"
                class="size-4 text-muted-foreground"
              />
            </RouterLink>
          </li>
        </ul>
      </section>

      <Card v-if="isAdmin" class="rounded-card shadow-card">
        <CardHeader>
          <h2
            class="text-lg font-semibold leading-none tracking-tight text-foreground-strong"
          >
            Tickets
          </h2>
        </CardHeader>
        <CardContent class="flex items-center justify-between gap-6">
          <div class="flex flex-col gap-1">
            <label
              for="org-auto-resolve"
              class="font-medium text-foreground-strong"
            >
              Resolve tickets automatically
            </label>
            <p id="org-auto-resolve-hint" class="text-sm text-muted-foreground">
              Close a ticket once a later analysis no longer finds its
              vulnerability.
            </p>
          </div>
          <Switch
            id="org-auto-resolve"
            :model-value="autoResolveTickets"
            :disabled="savingSettings"
            aria-describedby="org-auto-resolve-hint"
            @update:model-value="setAutoResolve($event)"
          />
        </CardContent>
      </Card>

      <Card
        v-if="!orgInfo.personal"
        class="rounded-card border-destructive/40 shadow-card"
      >
        <CardHeader>
          <h2
            class="text-lg font-semibold leading-none tracking-tight text-foreground-strong"
          >
            Leave or delete
          </h2>
          <CardDescription>
            These actions affect your access, and deleting cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent class="flex flex-col gap-4">
          <div class="flex items-center justify-between gap-6">
            <p class="text-sm text-muted-foreground">
              Leave this organisation. You lose access to its projects.
            </p>
            <Button variant="destructive" @click="ask('leave')">
              <LogOut aria-hidden="true" />
              Leave organisation
            </Button>
          </div>
          <div
            v-if="orgInfo.role === MemberRole.OWNER"
            class="flex items-center justify-between gap-6 border-t pt-4"
          >
            <p class="text-sm text-muted-foreground">
              Delete this organisation for every member.
            </p>
            <Button variant="destructive" @click="ask('delete')">
              <Trash2 aria-hidden="true" />
              Delete organisation
            </Button>
          </div>
        </CardContent>
      </Card>

      <section aria-labelledby="org-faq" class="flex flex-col gap-2">
        <h2 id="org-faq" class="text-lg font-semibold text-foreground-strong">
          Questions
        </h2>
        <Accordion type="multiple">
          <AccordionItem
            v-for="(faq, index) in faqs"
            :key="faq.question"
            :value="`faq-${index}`"
          >
            <AccordionTrigger
              class="rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {{ faq.question }}
            </AccordionTrigger>
            <AccordionContent class="text-muted-foreground">
              {{ faq.answer }}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <OrgActionDialog
        v-model:open="dialogOpen"
        :action="dialogAction"
        :org-id="orgId"
        :org-name="orgInfo.name"
        @done="afterAction"
      />
    </template>
  </div>
</template>

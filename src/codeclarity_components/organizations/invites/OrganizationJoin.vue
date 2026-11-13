<script lang="ts" setup>
import { Building2, CircleAlert, LoaderCircle } from "@lucide/vue";
import { computed, onMounted, type Ref, ref } from "vue";

import { BrandEmphasis, PageHeading } from "@/base_components/page";
import router from "@/router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shadcn/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import { Card, CardContent } from "@/shadcn/ui/card";
import { Skeleton } from "@/shadcn/ui/skeleton";
import { useAuthStore } from "@/stores/auth";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { formatDate } from "@/utils/dateUtils";
import { successToast } from "@/utils/toasts";

import {
  MemberRole,
  type OrganizationInfoForInvitee,
  type TeamMember,
} from "../organization.entity";
import { OrgRepository } from "../organization.repository";

const authStore = useAuthStore();
const orgRepository = new OrgRepository();

const inviteToken = ref<string>();
const userEmailHash = ref<string>();
const orgId = ref<string>();
const orgInfo: Ref<OrganizationInfoForInvitee | undefined> = ref();
const fetchErrorCode = ref<string>();
const fetchFailed = ref(false);
const joinErrorCode = ref<string>();
const joinFailed = ref(false);
const joining = ref(false);

const roleNames: Record<MemberRole, string> = {
  [MemberRole.OWNER]: "Owner",
  [MemberRole.ADMIN]: "Admin",
  [MemberRole.MODERATOR]: "Moderator",
  [MemberRole.USER]: "User",
};

const faqs = [
  {
    question: "What happens when I join an organisation?",
    answer:
      "You can work with its members on its projects, Datasets and Experiments.",
  },
  {
    question: "Can I leave an organisation I did not mean to join?",
    answer:
      "Yes. Open Organisation settings for that organisation and choose Leave the organisation.",
  },
  {
    question: "What can each role do?",
    answer:
      "Users import projects, start analyses and read results. Moderators also manage invites and members. Admins also add integrations with external services. The Owner created the organisation and can manage all of it.",
  },
  {
    question: "The inviter or owner shows as Deleted user. What now?",
    answer:
      "We recommend not joining. An organisation whose inviter or owner was deleted is often a sign of spam.",
  },
];

// Expired or unknown invitations cannot succeed on a retry.
const fetchRetryable = computed(
  () =>
    fetchErrorCode.value !== APIErrors.NotAuthorized &&
    fetchErrorCode.value !== APIErrors.EntityNotFound,
);
const joinRetryable = computed(
  () =>
    joinErrorCode.value !== APIErrors.NotAuthorized &&
    joinErrorCode.value !== APIErrors.EntityNotFound &&
    joinErrorCode.value !== APIErrors.InvitationInvalidOrExpired,
);

const fetchMessage = computed(() =>
  fetchRetryable.value
    ? "Something went wrong while loading the invitation."
    : "This invitation does not exist or has expired.",
);
const joinMessage = computed(() =>
  joinRetryable.value
    ? "Something went wrong while joining the organisation."
    : "This invitation does not exist or has expired.",
);

function personName(person: TeamMember | undefined): string {
  if (!person) return "Deleted user";
  return `${person.first_name} ${person.last_name} (${person.email})`;
}

onMounted(() => {
  const searchParams = new URL(window.location.href).searchParams;
  const token = searchParams.get("token");
  const emailHash = searchParams.get("useremail");
  const id = searchParams.get("orgId");

  if (!token || !emailHash || !id) {
    void router.push("/");
    return;
  }

  inviteToken.value = token;
  userEmailHash.value = emailHash;
  orgId.value = id;

  void fetchOrgInfo();
});

async function fetchOrgInfo(): Promise<void> {
  if (!userEmailHash.value || !orgId.value || !inviteToken.value) return;
  if (!authStore.getAuthenticated || !authStore.getToken) return;

  fetchFailed.value = false;
  fetchErrorCode.value = undefined;
  try {
    orgInfo.value = await orgRepository.getOrgInfoAsInvitedMember({
      bearerToken: authStore.getToken,
      orgId: orgId.value,
      inviteToken: inviteToken.value,
      userEmailHash: userEmailHash.value,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
    });
  } catch (err) {
    fetchFailed.value = true;
    if (err instanceof BusinessLogicError) {
      fetchErrorCode.value = err.error_code;
    }
  }
}

async function joinOrg(): Promise<void> {
  if (!userEmailHash.value || !orgId.value || !inviteToken.value) return;
  if (!authStore.getAuthenticated || !authStore.getToken) return;

  joining.value = true;
  joinFailed.value = false;
  joinErrorCode.value = undefined;
  try {
    await orgRepository.joinOrgViaInvitation({
      bearerToken: authStore.getToken,
      orgId: orgId.value,
      data: {
        token: inviteToken.value,
        email_digest: userEmailHash.value,
      },
      handleBusinessErrors: true,
      handleHTTPErrors: true,
    });
    successToast(`You joined ${orgInfo.value?.name ?? "the organisation"}`);
    void router.push({
      name: "orgs",
      params: { action: "manage", page: "main", orgId: orgId.value },
    });
  } catch (err) {
    joinFailed.value = true;
    if (err instanceof BusinessLogicError) {
      joinErrorCode.value = err.error_code;
    }
  } finally {
    joining.value = false;
  }
}
</script>

<template>
  <div class="flex max-w-3xl flex-col gap-8">
    <template v-if="fetchFailed">
      <PageHeading
        >Organisation <BrandEmphasis>invitation</BrandEmphasis></PageHeading
      >
      <Alert variant="destructive">
        <CircleAlert aria-hidden="true" class="size-4" />
        <AlertTitle>We could not load this invitation</AlertTitle>
        <AlertDescription>{{ fetchMessage }}</AlertDescription>
      </Alert>
      <div class="flex gap-2">
        <Button v-if="fetchRetryable" @click="fetchOrgInfo">Try again</Button>
        <Button variant="outline" @click="router.back()">Go back</Button>
      </div>
    </template>

    <div
      v-else-if="!orgInfo"
      role="status"
      aria-label="Loading the invitation"
      class="flex flex-col gap-4"
    >
      <Skeleton class="h-9 w-2/3" />
      <Skeleton class="h-40 w-full rounded-card" />
    </div>

    <template v-else>
      <PageHeading
        description="Accept the invitation to work with this organisation's members."
      >
        Join <BrandEmphasis>{{ orgInfo.name }}</BrandEmphasis
        >?
      </PageHeading>

      <Card class="rounded-card shadow-card">
        <CardContent class="flex flex-col gap-6 pt-6">
          <div class="flex items-start gap-3">
            <Building2
              aria-hidden="true"
              class="mt-1 size-5 shrink-0 text-muted-foreground"
            />
            <div class="flex flex-col gap-1">
              <h2 class="text-lg font-semibold text-foreground-strong">
                {{ orgInfo.name }}
              </h2>
              <p v-if="orgInfo.description" class="text-muted-foreground">
                {{ orgInfo.description }}
              </p>
            </div>
          </div>

          <dl class="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
            <dt class="text-muted-foreground">Invited by</dt>
            <dd>{{ personName(orgInfo.invite_created_by) }}</dd>
            <dt class="text-muted-foreground">Your role</dt>
            <dd class="font-semibold">{{ roleNames[orgInfo.role] }}</dd>
            <dt class="text-muted-foreground">Owner</dt>
            <dd>{{ personName(orgInfo.created_by) }}</dd>
            <dt class="text-muted-foreground">Members</dt>
            <dd class="tabular-nums">{{ orgInfo.number_of_members }}</dd>
            <dt class="text-muted-foreground">Invited on</dt>
            <dd>{{ formatDate(orgInfo.invite_created_on, "LL") }}</dd>
          </dl>

          <Alert v-if="joinFailed" variant="destructive">
            <CircleAlert aria-hidden="true" class="size-4" />
            <AlertTitle>You could not join the organisation</AlertTitle>
            <AlertDescription>{{ joinMessage }}</AlertDescription>
          </Alert>

          <div class="flex gap-2">
            <Button
              v-if="!joinFailed || joinRetryable"
              :disabled="joining"
              arrow
              @click="joinOrg"
            >
              <LoaderCircle
                v-if="joining"
                aria-hidden="true"
                class="animate-spin motion-reduce:animate-none"
              />
              {{ joinFailed ? "Try again" : "Join organisation" }}
            </Button>
            <Button variant="outline" @click="router.back()">
              {{ joinFailed ? "Go back" : "Cancel" }}
            </Button>
          </div>
        </CardContent>
      </Card>

      <section aria-labelledby="join-faq-title" class="flex flex-col gap-2">
        <h2
          id="join-faq-title"
          class="text-lg font-semibold text-foreground-strong"
        >
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
    </template>
  </div>
</template>

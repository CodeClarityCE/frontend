<script setup lang="ts">
import { LoaderCircle, Send } from "@lucide/vue";
import { computed, ref, watch } from "vue";

import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { useAuthStore } from "@/stores/auth";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { errorToast, successToast } from "@/utils/toasts";

import { invitableRoles, roleLabel } from "../members/member-role";
import { MemberRole } from "../organization.entity";
import { OrgRepository } from "../organization.repository";

const props = defineProps<{ orgId: string }>();
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<{ invited: [] }>();

const orgRepo = new OrgRepository();
const authStore = useAuthStore();

const email = ref("");
const role = ref(String(MemberRole.USER));
const submitted = ref(false);
const busy = ref(false);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emailError = computed(() => {
  const value = email.value.trim();
  if (!value) return "An email is required";
  if (!EMAIL_PATTERN.test(value)) return "Enter a valid email address";
  return undefined;
});

// Errors show only after the first submit, so the form opens clean.
const shownEmailError = computed(() =>
  submitted.value ? emailError.value : undefined,
);

watch(open, (isOpen) => {
  if (!isOpen) return;
  email.value = "";
  role.value = String(MemberRole.USER);
  submitted.value = false;
});

function inviteError(code: string): string {
  switch (code) {
    case APIErrors.AlreadyExists:
    case APIErrors.InvitationOrgAlreadyExists:
      return "This person already has an open invitation";
    case APIErrors.NotAuthorized:
      return "Your role does not allow inviting members";
    case APIErrors.PersonalOrgCannotBeModified:
      return "A personal organisation cannot have members";
    default:
      return "Failed to send the invitation";
  }
}

async function submit(): Promise<void> {
  submitted.value = true;
  if (emailError.value || busy.value || !authStore.getToken) return;
  busy.value = true;
  try {
    await orgRepo.inviteUser({
      orgId: props.orgId,
      data: { user_email: email.value.trim(), role: Number(role.value) },
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
    });
    successToast(`Invitation sent to ${email.value.trim()}`);
    open.value = false;
    emit("invited");
  } catch (err) {
    errorToast(
      inviteError(err instanceof BusinessLogicError ? err.error_code : ""),
    );
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Invite a member</DialogTitle>
        <DialogDescription>
          They get an email with a link to join the organisation.
        </DialogDescription>
      </DialogHeader>
      <form
        id="invite-member-form"
        class="flex flex-col gap-5"
        novalidate
        @submit.prevent="submit"
      >
        <div class="flex flex-col gap-2">
          <Label for="invite-email">Email</Label>
          <Input
            id="invite-email"
            v-model="email"
            type="email"
            autocomplete="off"
            placeholder="name@example.com"
            :aria-invalid="shownEmailError ? true : undefined"
            :aria-describedby="
              shownEmailError ? 'invite-email-error' : undefined
            "
          />
          <p
            v-if="shownEmailError"
            id="invite-email-error"
            class="text-sm text-destructive"
          >
            {{ shownEmailError }}
          </p>
        </div>
        <div class="flex flex-col gap-2">
          <Label for="invite-role">Role</Label>
          <Select v-model="role">
            <SelectTrigger id="invite-role" aria-describedby="invite-role-hint">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in invitableRoles"
                :key="option"
                :value="String(option)"
              >
                {{ roleLabel(option) }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p id="invite-role-hint" class="text-sm text-muted-foreground">
            Admins and moderators can manage members; users work on projects.
          </p>
        </div>
      </form>
      <DialogFooter class="gap-2">
        <Button variant="outline" @click="open = false">Cancel</Button>
        <Button type="submit" form="invite-member-form" :disabled="busy">
          <LoaderCircle
            v-if="busy"
            aria-hidden="true"
            class="animate-spin motion-reduce:animate-none"
          />
          <Send v-else aria-hidden="true" />
          Send invitation
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

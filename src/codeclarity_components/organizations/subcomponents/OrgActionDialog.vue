<script setup lang="ts">
import { LogOut, Trash2 } from "@lucide/vue";
import { ref } from "vue";

import { OrgRepository } from "@/codeclarity_components/organizations/organization.repository";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shadcn/ui/alert-dialog";
import { Button } from "@/shadcn/ui/button";
import { Spinner } from "@/shadcn/ui/spinner";
import { useAuthStore } from "@/stores/auth";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { errorToast, successToast } from "@/utils/toasts";

// Asks before leaving or deleting an organisation, then does it.
const props = defineProps<{
  action: "leave" | "delete";
  orgId: string;
  orgName: string;
}>();
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<{ done: [] }>();

const authStore = useAuthStore();
const orgRepo = new OrgRepository();
const busy = ref(false);

function failureMessage(err: unknown): string | null {
  if (!(err instanceof BusinessLogicError)) {
    return `Failed to ${props.action} the organisation.`;
  }
  switch (err.error_code) {
    case APIErrors.EntityNotFound:
      return null;
    case APIErrors.PersonalOrgCannotBeModified:
      return `You cannot ${props.action} a personal organisation.`;
    case APIErrors.CannotLeaveAsLastOwner:
      return "You are the last owner, so you cannot leave. Delete the organisation instead.";
    default:
      return `Failed to ${props.action} the organisation.`;
  }
}

async function confirm(): Promise<void> {
  if (!authStore.getAuthenticated || busy.value) return;
  busy.value = true;
  try {
    const options = {
      orgId: props.orgId,
      handleBusinessErrors: true,
    };
    if (props.action === "delete") await orgRepo.delete(options);
    else await orgRepo.leave(options);
    successToast(
      props.action === "delete"
        ? `Deleted ${props.orgName}`
        : `You left ${props.orgName}`,
    );
    open.value = false;
    emit("done");
  } catch (err) {
    const message = failureMessage(err);
    if (message) {
      errorToast(message);
    } else {
      // It is already gone, so treat it as done.
      open.value = false;
      emit("done");
    }
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {{ action === "delete" ? "Delete" : "Leave" }} {{ orgName }}?
        </AlertDialogTitle>
        <AlertDialogDescription v-if="action === 'delete'">
          Its projects, analyses and results, tickets, analyzers, integrations,
          policies, invitations and audit log are deleted for every member.
          Integrations and policies also used by another organisation are kept
          there. Tasks already created in ClickUp are kept. This cannot be
          undone.
        </AlertDialogDescription>
        <AlertDialogDescription v-else>
          You lose access to its projects and results until someone invites you
          again.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <Button variant="destructive" :disabled="busy" @click="confirm">
          <Spinner v-if="busy" />
          <Trash2 v-else-if="action === 'delete'" aria-hidden="true" />
          <LogOut v-else aria-hidden="true" />
          {{
            action === "delete" ? "Delete organisation" : "Leave organisation"
          }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

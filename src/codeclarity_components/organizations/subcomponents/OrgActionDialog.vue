<script setup lang="ts">
import { LoaderCircle, LogOut, Trash2 } from "@lucide/vue";
import { ref } from "vue";

import { OrgRepository } from "@/codeclarity_components/organizations/organization.repository";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
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
  if (!authStore.getToken || busy.value) return;
  busy.value = true;
  try {
    const options = {
      orgId: props.orgId,
      bearerToken: authStore.getToken,
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
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {{ action === "delete" ? "Delete" : "Leave" }} {{ orgName }}?
        </DialogTitle>
        <DialogDescription v-if="action === 'delete'">
          Its projects, analyses, integrations and policies are deleted for
          every member. This cannot be undone.
        </DialogDescription>
        <DialogDescription v-else>
          You lose access to its projects and results until someone invites you
          again.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter class="gap-2">
        <Button variant="outline" @click="open = false">Cancel</Button>
        <Button variant="destructive" :disabled="busy" @click="confirm">
          <LoaderCircle
            v-if="busy"
            aria-hidden="true"
            class="animate-spin motion-reduce:animate-none"
          />
          <Trash2 v-else-if="action === 'delete'" aria-hidden="true" />
          <LogOut v-else aria-hidden="true" />
          {{
            action === "delete" ? "Delete organisation" : "Leave organisation"
          }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

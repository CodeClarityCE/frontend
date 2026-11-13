<script setup lang="ts">
import { Check, ChevronsUpDown, Plus, Settings2 } from "@lucide/vue";
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";

import { UserRepository } from "@/codeclarity_components/authentication/user.repository";
import { OrgRepository } from "@/codeclarity_components/organizations/organization.repository";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shadcn/ui/sidebar";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { errorToast, successToast } from "@/utils/toasts";

import { initials } from "./initials";

interface OrgOption {
  id: string;
  name: string;
}

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();
const orgRepository = new OrgRepository();
const userRepository = new UserRepository();

const orgs = ref<OrgOption[]>([]);
const currentId = computed(() => userStore.getDefaultOrg?.id);
const currentName = computed(
  () =>
    userStore.getDefaultOrg?.name ??
    orgs.value.find((org) => org.id === currentId.value)?.name ??
    "",
);

async function loadOrgs(): Promise<void> {
  if (!authStore.getAuthenticated || !authStore.getToken) return;
  try {
    const response = await orgRepository.getMany({
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
      pagination: { page: 0, entries_per_page: 50 },
    });
    orgs.value = response.data.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
    }));
  } catch {
    // The base repository already reports failed requests.
    orgs.value = [];
  }
}

async function switchOrg(org: OrgOption): Promise<void> {
  const user = userStore.getUser;
  if (!user || !authStore.getToken || org.id === currentId.value) return;
  try {
    await userRepository.setDefaultOrg({
      bearerToken: authStore.getToken,
      userId: user.id,
      data: { default_org: org.id },
      handleBusinessErrors: true,
    });
    const next = await orgRepository.get({
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
      orgId: org.id,
    });
    userStore.setDefaultOrg(next);
    if (router.currentRoute.value.name === "home") {
      router.go(0);
    } else {
      void router.push({ name: "home" });
    }
    successToast(`Switched to ${org.name}`);
  } catch {
    errorToast("Failed to switch organisation");
  }
}

watch(
  () => userStore.getUser,
  () => void loadOrgs(),
);
void loadOrgs();
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <span
              aria-hidden="true"
              class="flex aspect-square size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground"
              >{{ initials(currentName) }}</span
            >
            <span class="grid flex-1 text-left leading-tight">
              <span class="truncate text-xs text-sidebar-muted-foreground"
                >Organisation</span
              >
              <span class="truncate font-semibold">{{ currentName }}</span>
            </span>
            <span class="sr-only">, switch organisation</span>
            <ChevronsUpDown class="ml-auto" aria-hidden="true" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-(--reka-dropdown-menu-trigger-width) min-w-56"
          side="bottom"
          align="start"
        >
          <DropdownMenuLabel class="text-xs text-muted-foreground">
            Organisations
          </DropdownMenuLabel>
          <DropdownMenuItem
            v-for="org in orgs"
            :key="org.id"
            class="cursor-pointer gap-2"
            @select="switchOrg(org)"
          >
            <span
              aria-hidden="true"
              class="flex size-6 items-center justify-center rounded-sm border text-xs font-semibold"
              >{{ initials(org.name) }}</span
            >
            <span class="flex-1 truncate">{{ org.name }}</span>
            <Check
              v-if="org.id === currentId"
              class="size-4"
              aria-label="Current organisation"
            />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            class="cursor-pointer gap-2"
            @select="router.push({ name: 'orgs', params: { action: 'list' } })"
          >
            <Settings2 class="size-4" aria-hidden="true" />
            Manage organisations
          </DropdownMenuItem>
          <DropdownMenuItem
            class="cursor-pointer gap-2"
            @select="router.push({ name: 'orgs', params: { action: 'add' } })"
          >
            <Plus class="size-4" aria-hidden="true" />
            Create organisation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>

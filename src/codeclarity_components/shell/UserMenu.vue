<script setup lang="ts">
import {
  Building2,
  ChevronsUpDown,
  CircleAlert,
  LogOut,
  UserRound,
} from "@lucide/vue";
import { computed } from "vue";
import { useRouter } from "vue-router";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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

import { initials } from "./initials";

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();

const fullName = computed(() => {
  const user = userStore.getUser;
  return user ? `${user.first_name} ${user.last_name}` : "";
});

const reportUrl =
  "https://github.com/CodeClarityCE/codeclarity-dev/issues/new?template=BLANK_ISSUE";

function logout(): void {
  userStore.$reset();
  authStore.$reset();
  void router.push("/login");
}

function openReport(): void {
  window.open(reportUrl, "_blank", "noopener,noreferrer");
}
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
              class="flex size-8 shrink-0 items-center justify-center rounded-full border border-sidebar-border text-xs font-semibold"
              >{{ initials(fullName) }}</span
            >
            <span class="grid flex-1 text-left leading-tight">
              <span class="truncate font-semibold">{{ fullName }}</span>
              <span class="truncate text-xs text-sidebar-muted-foreground">{{
                userStore.getUser?.email
              }}</span>
            </span>
            <span class="sr-only">, open the account menu</span>
            <ChevronsUpDown class="ml-auto" aria-hidden="true" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-(--reka-dropdown-menu-trigger-width) min-w-56"
          side="top"
          align="start"
        >
          <DropdownMenuLabel class="font-normal">
            <p class="text-sm font-medium">{{ userStore.getUser?.handle }}</p>
            <p class="text-xs text-muted-foreground">
              {{ userStore.getUser?.email }}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              class="cursor-pointer gap-2"
              @select="
                router.push({ name: 'settings', params: { page: 'account' } })
              "
            >
              <UserRound class="size-4" aria-hidden="true" />
              Account settings
            </DropdownMenuItem>
            <DropdownMenuItem
              class="cursor-pointer gap-2"
              @select="
                router.push({ name: 'orgs', params: { action: 'list' } })
              "
            >
              <Building2 class="size-4" aria-hidden="true" />
              Manage organisations
            </DropdownMenuItem>
            <DropdownMenuItem class="cursor-pointer gap-2" @select="openReport">
              <CircleAlert class="size-4" aria-hidden="true" />
              Report a problem
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="cursor-pointer gap-2" @select="logout">
            <LogOut class="size-4" aria-hidden="true" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>

<script setup lang="ts">
import { PanelLeft, Search } from "@lucide/vue";
import { computed, ref, watch } from "vue";
import { type RouteLocationRaw, RouterLink, useRoute } from "vue-router";

import logo from "@/assets/images/logos/logo-green.svg";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/shadcn/ui/sidebar";
import { useUserStore } from "@/stores/user";

import {
  isActive,
  navGroups,
  type NavItem,
  orgSettingsItem,
} from "./nav-items";
import NotificationsDialog from "./NotificationsDialog.vue";
import OrgSwitcher from "./OrgSwitcher.vue";
import { shortcutLabel } from "./shortcut";
import UserMenu from "./UserMenu.vue";

defineEmits<{ openPalette: [] }>();

const route = useRoute();
const userStore = useUserStore();
const { state, toggleSidebar } = useSidebar();

const expanded = computed(() => state.value === "expanded");

// Results need an analysis, so remember the last one the user opened.
const lastResults = ref<RouteLocationRaw | null>(null);
watch(
  () => route.fullPath,
  () => {
    if (route.name === "results") lastResults.value = route.fullPath;
  },
  { immediate: true },
);

function target(item: NavItem): RouteLocationRaw | null {
  if (item.label === "Results") return lastResults.value;
  return item.to(userStore.getDefaultOrg?.id);
}

const groups = navGroups.map((group, index) => ({
  ...group,
  id: `sidebar-group-${index}`,
}));

// The landing page's green bar marks the current page.
const activeBar =
  "relative data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:before:absolute data-[active=true]:before:inset-y-1 data-[active=true]:before:left-0 data-[active=true]:before:w-1 data-[active=true]:before:rounded-full data-[active=true]:before:bg-sidebar-primary";
</script>

<template>
  <Sidebar collapsible="icon" class="border-sidebar-border">
    <SidebarHeader class="gap-3 p-3">
      <div
        class="flex items-center gap-2 group-data-[collapsible=icon]:justify-center"
      >
        <RouterLink
          :to="{ name: 'home' }"
          class="flex min-w-0 items-center gap-2 rounded-md px-1 text-sidebar-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:hidden"
        >
          <img :src="logo" alt="" class="h-7 w-auto" />
          <span class="truncate text-lg font-bold">CodeClarity</span>
          <span class="sr-only">, go to the Dashboard</span>
        </RouterLink>
        <button
          type="button"
          class="ml-auto inline-flex size-8 shrink-0 items-center justify-center rounded-md text-sidebar-muted-foreground outline-hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:ml-0"
          :aria-label="expanded ? 'Collapse sidebar' : 'Expand sidebar'"
          :aria-expanded="expanded"
          @click="toggleSidebar"
        >
          <PanelLeft class="size-4" aria-hidden="true" />
        </button>
      </div>
      <OrgSwitcher />
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            class="border border-sidebar-border text-sidebar-muted-foreground"
            tooltip="Search"
            @click="$emit('openPalette')"
          >
            <Search aria-hidden="true" />
            <span>Search</span>
            <kbd
              class="ml-auto rounded border border-sidebar-border px-1.5 font-mono text-xs group-data-[collapsible=icon]:hidden"
              >{{ shortcutLabel }}</kbd
            >
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <nav aria-label="Main" class="flex min-h-0 flex-1 flex-col">
      <SidebarContent>
        <SidebarGroup
          v-for="group in groups"
          :key="group.id"
          :role="group.label ? 'group' : undefined"
          :aria-labelledby="group.label ? group.id : undefined"
        >
          <SidebarGroupLabel
            v-if="group.label"
            :id="group.id"
            class="uppercase tracking-wide text-sidebar-muted-foreground"
          >
            {{ group.label }}
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in group.items" :key="item.label">
              <SidebarMenuButton
                v-if="target(item)"
                as-child
                :is-active="isActive(item, route.name)"
                :tooltip="item.label"
                :class="activeBar"
              >
                <RouterLink
                  :to="target(item)!"
                  :aria-current="
                    isActive(item, route.name) ? 'page' : undefined
                  "
                >
                  <component :is="item.icon" aria-hidden="true" />
                  <span>{{ item.label }}</span>
                </RouterLink>
              </SidebarMenuButton>
              <SidebarMenuButton
                v-else
                as="span"
                aria-disabled="true"
                title="Open an analysis from Projects to see its results"
              >
                <component :is="item.icon" aria-hidden="true" />
                <span>{{ item.label }}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarGroup class="mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              as-child
              :is-active="isActive(orgSettingsItem, route.name)"
              :tooltip="orgSettingsItem.label"
              :class="activeBar"
            >
              <RouterLink
                :to="orgSettingsItem.to(userStore.getDefaultOrg?.id)!"
                :aria-current="
                  isActive(orgSettingsItem, route.name) ? 'page' : undefined
                "
              >
                <component :is="orgSettingsItem.icon" aria-hidden="true" />
                <span>{{ orgSettingsItem.label }}</span>
              </RouterLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </nav>

    <SidebarFooter class="border-t border-sidebar-border">
      <NotificationsDialog />
      <UserMenu />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>

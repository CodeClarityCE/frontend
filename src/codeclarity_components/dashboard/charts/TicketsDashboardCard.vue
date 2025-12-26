<script setup lang="ts">
import {
  TicketPriorityLabels,
  TicketPriorityColors,
  type TicketDashboardStats,
} from "@/codeclarity_components/tickets/tickets.entity";
import { TicketsRepository } from "@/codeclarity_components/tickets/tickets.repository";
import { Button } from "@/shadcn/ui/button";
import { ScrollArea } from "@/shadcn/ui/scroll-area";
import { Skeleton } from "@/shadcn/ui/skeleton";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { Icon } from "@iconify/vue";
import { storeToRefs } from "pinia";
import { ref, watch, type Ref } from "vue";
import { useRouter } from "vue-router";

// Props
const props = defineProps<{
  integrationIds: string[];
}>();

watch(props.integrationIds, async () => {
  void fetch();
});

// Stores
const userStore = useUserStore();
const authStore = useAuthStore();
const router = useRouter();
const { defaultOrg } = storeToRefs(userStore);

// Repository
const ticketsRepository = new TicketsRepository();

// State
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const loading: Ref<boolean> = ref(true);
const noData: Ref<boolean> = ref(false);
const stats: Ref<TicketDashboardStats | null> = ref(null);

async function fetch(refresh = false): Promise<void> {
  if (!defaultOrg?.value) return;
  if (!authStore.getAuthenticated || !authStore.getToken) return;

  if (!refresh) loading.value = true;

  noData.value = false;
  error.value = false;
  errorCode.value = undefined;

  try {
    const resp = await ticketsRepository.getDashboardStats({
      orgId: defaultOrg.value.id,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
    });
    stats.value = resp.data;

    if (
      stats.value.total_open === 0 &&
      stats.value.total_in_progress === 0 &&
      stats.value.total_resolved_this_week === 0
    ) {
      noData.value = true;
    }
  } catch (_err) {
    error.value = true;
    if (_err instanceof BusinessLogicError) {
      errorCode.value = _err.error_code;
    }
  } finally {
    if (!refresh) loading.value = false;
  }
}

function navigateToTickets(): void {
  void router.push({ name: "tickets" });
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

void fetch();
</script>

<template>
  <div class="w-full">
    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col gap-6">
      <div class="flex flex-row gap-4 justify-evenly">
        <Skeleton
          v-for="index in 3"
          :key="index"
          class="h-[70px] w-[100px] rounded-xl"
        />
      </div>
      <div class="flex flex-col gap-2">
        <Skeleton
          v-for="index in 3"
          :key="index"
          class="h-[50px] w-full rounded-xl"
        />
      </div>
    </div>

    <!-- No Data State -->
    <div
      v-else-if="noData"
      class="flex flex-col items-center justify-center py-8 text-gray-500"
    >
      <Icon icon="solar:ticket-linear" class="w-12 h-12 mb-3 text-gray-300" />
      <p class="text-sm font-medium">No tickets yet</p>
      <p class="text-xs text-gray-400 mt-1">
        Create tickets from vulnerability results
      </p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex flex-row gap-2">
      <Icon
        class="text-3xl text-gray-400"
        icon="solar:confounded-square-outline"
      />
      <div class="flex flex-col gap-2">
        <div class="text-sm text-gray-600">
          Failed to load ticket statistics
        </div>
        <Button size="sm" variant="outline" @click="fetch()">Try again</Button>
      </div>
    </div>

    <!-- Content -->
    <div v-else-if="stats" class="flex flex-col gap-6">
      <!-- Summary Stats -->
      <div class="flex flex-row gap-4 justify-evenly">
        <div class="flex flex-col items-center">
          <div class="font-black text-4xl text-yellow-600">
            {{ stats.total_open }}
          </div>
          <div class="font-semibold text-sm text-gray-500">Open</div>
        </div>
        <div class="flex flex-col items-center">
          <div class="font-black text-4xl text-blue-600">
            {{ stats.total_in_progress }}
          </div>
          <div class="font-semibold text-sm text-gray-500">In Progress</div>
        </div>
        <div class="flex flex-col items-center">
          <div class="font-black text-4xl text-green-600">
            {{ stats.total_resolved_this_week }}
          </div>
          <div class="font-semibold text-sm text-gray-500">Resolved</div>
        </div>
      </div>

      <!-- Priority Breakdown -->
      <div class="flex flex-wrap gap-2 justify-center">
        <div
          v-if="stats.by_priority.critical > 0"
          class="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"
        >
          <Icon icon="solar:danger-triangle-bold" class="w-3 h-3" />
          {{ stats.by_priority.critical }} Critical
        </div>
        <div
          v-if="stats.by_priority.high > 0"
          class="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700"
        >
          <Icon icon="solar:shield-warning-bold" class="w-3 h-3" />
          {{ stats.by_priority.high }} High
        </div>
        <div
          v-if="stats.by_priority.medium > 0"
          class="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"
        >
          {{ stats.by_priority.medium }} Medium
        </div>
        <div
          v-if="stats.by_priority.low > 0"
          class="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
        >
          {{ stats.by_priority.low }} Low
        </div>
      </div>

      <!-- Recent Tickets -->
      <div v-if="stats.recent_tickets && stats.recent_tickets.length > 0">
        <div class="text-sm font-semibold text-gray-700 mb-2">
          Recent Tickets
        </div>
        <ScrollArea class="h-48 rounded-md border">
          <div class="p-2 space-y-2">
            <div
              v-for="ticket in stats.recent_tickets"
              :key="ticket.id"
              class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              @click="navigateToTickets"
            >
              <div class="flex items-center gap-2 min-w-0">
                <span
                  class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
                  :class="TicketPriorityColors[ticket.priority]"
                >
                  {{ TicketPriorityLabels[ticket.priority]?.charAt(0) }}
                </span>
                <span class="text-sm text-gray-900 truncate">
                  {{ ticket.title }}
                </span>
              </div>
              <span class="text-xs text-gray-400 flex-shrink-0 ml-2">
                {{ formatDate(ticket.created_on) }}
              </span>
            </div>
          </div>
        </ScrollArea>
      </div>

      <!-- View All Button -->
      <Button
        variant="outline"
        size="sm"
        class="w-full"
        @click="navigateToTickets"
      >
        <Icon icon="solar:ticket-bold" class="w-4 h-4 mr-2" />
        View All Tickets
      </Button>
    </div>
  </div>
</template>

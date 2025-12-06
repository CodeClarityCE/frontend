<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import { Button } from '@/shadcn/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shadcn/ui/tooltip';
import TicketCreateModal, { type VulnerabilityData } from './TicketCreateModal.vue';

const props = defineProps<{
    projectId: string;
    projectName?: string;
    vulnerability: VulnerabilityData;
    size?: 'default' | 'sm' | 'lg' | 'icon';
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}>();

const emit = defineEmits<{
    created: [ticketId: string];
}>();

const isModalOpen = ref(false);

function openModal() {
    isModalOpen.value = true;
}

function handleCreated(ticketId: string) {
    emit('created', ticketId);
}
</script>

<template>
    <div>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger as-child>
                    <Button
                        :size="size || 'sm'"
                        :variant="variant || 'outline'"
                        class="gap-1.5"
                        @click="openModal"
                    >
                        <Icon icon="solar:ticket-bold" class="w-3.5 h-3.5" />
                        <span class="hidden sm:inline">Create Ticket</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Create a ticket to track remediation</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>

        <TicketCreateModal
            v-model:open="isModalOpen"
            :project-id="projectId"
            :project-name="projectName"
            :vulnerability="vulnerability"
            @created="handleCreated"
        />
    </div>
</template>

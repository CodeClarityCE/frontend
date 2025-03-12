<script setup lang="ts">
import { useMagicKeys } from '@vueuse/core';

import { ref, watch } from 'vue';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator
} from '@/shadcn/ui/command';
import router from '@/router';
import { useUserStore } from '@/stores/user';
import { Button } from '@/shadcn/ui/button';
import { Icon } from '@iconify/vue';

const userStore = useUserStore();

const open = ref(false);

const { Meta_K, Ctrl_K, enter } = useMagicKeys({
    passive: false,
    onEventFired(e) {
        if (e.key === 'k' && (e.metaKey || e.ctrlKey)) e.preventDefault();
    }
});

watch([Meta_K, Ctrl_K], (v) => {
    if (v[0] || v[1]) handleOpenChange();
});

watch(enter, (v) => {
    if (v) {
        handleCommandSelect();
    }
});

watch(open, (v) => {
    console.log('open', v, open);
});

function handleCommandSelect() {
    if (open.value) {
        const highlighted = document.querySelectorAll('[data-highlighted=""]')[0];
        console.log(highlighted.innerText);
        open.value = false;
        if (highlighted.innerText === 'Dashboard') {
            router.push({ name: 'home' });
        } else if (highlighted.innerText === 'Projects') {
            router.push({ name: 'projects' });
        } else if (highlighted.innerText === 'Settings') {
            router.push({ name: 'settings', params: { page: 'account' } });
        } else if (highlighted.innerText === 'Organizations') {
            router.push({ name: 'orgs', params: { action: 'list' } });
        } else if (highlighted.innerText === 'Create Analyzer') {
            router.push({
                name: 'orgs',
                params: { action: 'add', page: 'analyzers', orgId: userStore.defaultOrg?.id }
            });
        } else if (highlighted.innerText === 'Import Project') {
            router.push({
                name: 'projects',
                params: { page: 'add', orgId: userStore.defaultOrg?.id }
            });
        } else if (highlighted.innerText === 'Start Analysis') {
            router.push({ name: 'analyses', params: { page: 'add' } });
        }
    }
}

function handleOpenChange() {
    open.value = !open.value;
}
</script>

<template>
    <div class="flex items-center">
        <p class="text-sm text-muted-foreground">
            Commands
            <kbd
                class="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span class="text-xs">⌘</span>K
            </kbd>
        </p>
        <CommandDialog v-model:open="open">
            <CommandInput placeholder="Type a command or search..." />
            <CommandList @click="handleCommandSelect">
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Pages">
                    <CommandItem value="dashboard" class="cursor-pointer"> Dashboard </CommandItem>
                    <CommandItem value="projects" class="cursor-pointer"> Projects </CommandItem>
                    <CommandItem value="settings" class="cursor-pointer"> Settings </CommandItem>
                    <CommandItem value="organizations" class="cursor-pointer">
                        Organizations
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Commands">
                    <CommandItem value="create_analyzer" class="cursor-pointer">
                        Create Analyzer
                    </CommandItem>
                    <CommandItem value="import_project" class="cursor-pointer">
                        Import Project
                    </CommandItem>
                    <CommandItem value="start_analysis" class="cursor-pointer">
                        Start Analysis
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
        <Button variant="link">
            <a href="https://doli.codeclarity.io/public/ticket/index.php?entity=1" class="flex gap-1 items-center">
                <Icon icon="ion:ticket-outline"></Icon>Report a problem / Ask a question
            </a>
        </Button>
    </div>
</template>

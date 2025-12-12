<script setup lang="ts">

import router from '@/router';
import { Button } from '@/shadcn/ui/button';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator
} from '@/shadcn/ui/command';
import { useUserStore } from '@/stores/user';
import { Icon } from '@iconify/vue';
import { useMagicKeys } from '@vueuse/core';
import { ref, watch } from 'vue';

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

if (enter) {
    watch(enter, (v) => {
        if (v) {
            handleCommandSelect();
        }
    });
}

watch(open, (v) => {
    console.log('open', v, open);
});

function handleCommandSelect() {
    if (open.value) {
        const highlighted = document.querySelectorAll('[data-highlighted=""]')[0] as HTMLElement;
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
        <Button
            variant="outline"
            size="sm"
            class="bg-gray-50 border-gray-300 hover:bg-gray-100 transition-colors duration-200 text-gray-600 hover:text-gray-900"
            @click="handleOpenChange"
        >
            <Icon icon="lucide:search" class="w-4 h-4 mr-2" />
            <span class="text-sm">Commands</span>
            <kbd
                class="pointer-events-none ml-3 inline-flex h-5 select-none items-center gap-1 rounded bg-white border border-gray-200 px-1.5 font-mono text-[10px] font-medium text-gray-500"
            >
                <span class="text-xs">⌘</span>K
            </kbd>
        </Button>
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
                </CommandGroup>
            </CommandList>
        </CommandDialog>
        <Button variant="link">
            <a
                class="flex gap-2 items-center"
                href="https://github.com/CodeClarityCE/codeclarity-dev/issues/new?template=BLANK_ISSUE"
                target="_blank"
                rel="noopener noreferrer"
            >
                <Icon icon="ion:ticket-outline"></Icon>Report a problem
            </a>
        </Button>
    </div>
</template>

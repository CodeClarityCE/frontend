<script setup lang="ts">
import { MoreHorizontal } from 'lucide-vue-next';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/shadcn/ui/dropdown-menu';
import { Button } from '@/shadcn/ui/button';
import { ref } from 'vue';

defineProps<{
    dependency: {
        name: string;
        vulnerabilities?: string[];
        version: string;
    };
}>();

const urlParams = new URLSearchParams(window.location.search);
const analysis_id = ref(urlParams.get('analysis_id'));
const project_id = ref(urlParams.get('project_id'));

function copy(vulnerabilities?: string[]) {
    if (vulnerabilities === undefined) {
        navigator.clipboard.writeText('No vulnerabilities found');
        return;
    }
    if (vulnerabilities.length === 0) {
        navigator.clipboard.writeText('No vulnerabilities found');
        return;
    }
    const joined = vulnerabilities.join(', ');
    navigator.clipboard.writeText(joined);
}
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button variant="ghost" class="w-8 h-8 p-0">
                <span class="sr-only">Open menu</span>
                <MoreHorizontal class="w-4 h-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem @click="copy(dependency.vulnerabilities)">
                Copy CVE ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
                <RouterLink title="View dependency details" :to="{
                    name: 'results',
                    query: {
                        analysis_id: analysis_id,
                        project_id: project_id,
                        package_id: dependency.name + '@' + dependency.version
                    },
                    params: { page: 'sbom_details' }
                }">
                    View dependency details
                </RouterLink>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>

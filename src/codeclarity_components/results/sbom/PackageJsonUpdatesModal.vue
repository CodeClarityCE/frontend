<script lang="ts" setup>
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import { Button } from '@/shadcn/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/shadcn/ui/dialog';

export interface PackageUpdate {
    name: string;
    currentVersion: string;
    latestVersion: string;
    isDev: boolean;
    isProd: boolean;
}

interface Props {
    open: boolean;
    updates: PackageUpdate[];
    projectName?: string;
    packageManager?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    'copy-to-clipboard': [content: string];
}>();

// Separate production and development dependencies
const productionUpdates = computed(() => props.updates.filter((update) => update.isProd));

const developmentUpdates = computed(() =>
    props.updates.filter((update) => update.isDev && !update.isProd)
);

// Determine which package manager is being used (default to yarn if not specified)
const detectedPackageManager = computed(() => {
    return props.packageManager?.toLowerCase() || 'yarn';
});

// Show NPM commands if using npm
const showNpmCommands = computed(() => {
    return detectedPackageManager.value === 'npm';
});

// Show Yarn commands if using yarn
const showYarnCommands = computed(() => {
    return detectedPackageManager.value === 'yarn';
});

// Show pnpm commands if using pnpm
const showPnpmCommands = computed(() => {
    return detectedPackageManager.value === 'pnpm';
});

// Show bun commands if using bun
const showBunCommands = computed(() => {
    return detectedPackageManager.value === 'bun';
});

// Get the appropriate lockfile name
const lockfileName = computed(() => {
    switch (detectedPackageManager.value) {
        case 'npm':
            return 'package-lock.json';
        case 'pnpm':
            return 'pnpm-lock.yaml';
        case 'bun':
            return 'bun.lockb';
        case 'yarn':
        default:
            return 'yarn.lock';
    }
});

// Generate package.json snippet
const packageJsonSnippet = computed(() => {
    const dependencies: Record<string, string> = {};
    const devDependencies: Record<string, string> = {};

    productionUpdates.value.forEach((update) => {
        dependencies[update.name] = `^${update.latestVersion}`;
    });

    developmentUpdates.value.forEach((update) => {
        devDependencies[update.name] = `^${update.latestVersion}`;
    });

    const snippet: any = {};

    if (Object.keys(dependencies).length > 0) {
        snippet.dependencies = dependencies;
    }

    if (Object.keys(devDependencies).length > 0) {
        snippet.devDependencies = devDependencies;
    }

    return JSON.stringify(snippet, null, 2);
});

// Generate npm/yarn commands
const npmCommands = computed(() => {
    const commands: string[] = [];

    if (productionUpdates.value.length > 0) {
        const prodPackages = productionUpdates.value
            .map((update) => `${update.name}@^${update.latestVersion}`)
            .join(' ');
        commands.push(`npm install ${prodPackages}`);
    }

    if (developmentUpdates.value.length > 0) {
        const devPackages = developmentUpdates.value
            .map((update) => `${update.name}@^${update.latestVersion}`)
            .join(' ');
        commands.push(`npm install --save-dev ${devPackages}`);
    }

    return commands;
});

const yarnCommands = computed(() => {
    const commands: string[] = [];

    if (productionUpdates.value.length > 0) {
        const prodPackages = productionUpdates.value
            .map((update) => `${update.name}@^${update.latestVersion}`)
            .join(' ');
        commands.push(`yarn upgrade ${prodPackages}`);
    }

    if (developmentUpdates.value.length > 0) {
        const devPackages = developmentUpdates.value
            .map((update) => `${update.name}@^${update.latestVersion}`)
            .join(' ');
        commands.push(`yarn upgrade ${devPackages}`);
    }

    return commands;
});

// Generate pnpm commands
const pnpmCommands = computed(() => {
    const commands: string[] = [];

    if (productionUpdates.value.length > 0) {
        const prodPackages = productionUpdates.value
            .map((update) => `${update.name}@^${update.latestVersion}`)
            .join(' ');
        commands.push(`pnpm update ${prodPackages}`);
    }

    if (developmentUpdates.value.length > 0) {
        const devPackages = developmentUpdates.value
            .map((update) => `${update.name}@^${update.latestVersion}`)
            .join(' ');
        commands.push(`pnpm update ${devPackages}`);
    }

    return commands;
});

// Generate bun commands
const bunCommands = computed(() => {
    const commands: string[] = [];

    if (productionUpdates.value.length > 0) {
        const prodPackages = productionUpdates.value
            .map((update) => `${update.name}@^${update.latestVersion}`)
            .join(' ');
        commands.push(`bun update ${prodPackages}`);
    }

    if (developmentUpdates.value.length > 0) {
        const devPackages = developmentUpdates.value
            .map((update) => `${update.name}@^${update.latestVersion}`)
            .join(' ');
        commands.push(`bun update ${devPackages}`);
    }

    return commands;
});

function copyToClipboard(content: string) {
    navigator.clipboard.writeText(content).then(() => {
        emit('copy-to-clipboard', content);
    });
}

function closeModal() {
    emit('update:open', false);
}
</script>

<template>
    <Dialog :open="open" @update:open="emit('update:open', $event)">
        <DialogContent class="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle class="flex items-center gap-2">
                    <Icon icon="solar:code-file-bold" class="h-5 w-5 text-[#1dce79]" />
                    Package.json Updates
                    <span v-if="projectName" class="text-sm font-normal text-gray-500">
                        for {{ projectName }}
                    </span>
                </DialogTitle>
                <DialogDescription>
                    {{ updates.length }} direct dependencies have updates available. Choose your
                    preferred method to update them.
                </DialogDescription>
            </DialogHeader>

            <div class="space-y-6">
                <!-- Summary -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 class="font-semibold text-blue-900 mb-2">Update Summary</h3>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="font-medium">Production Dependencies:</span>
                            <span class="ml-2 text-blue-700">{{ productionUpdates.length }}</span>
                        </div>
                        <div>
                            <span class="font-medium">Development Dependencies:</span>
                            <span class="ml-2 text-blue-700">{{ developmentUpdates.length }}</span>
                        </div>
                    </div>
                </div>

                <!-- Dependencies List -->
                <div class="space-y-4">
                    <div v-if="productionUpdates.length > 0">
                        <h3 class="font-semibold text-gray-900 mb-3">Production Dependencies</h3>
                        <div class="grid gap-2">
                            <div
                                v-for="update in productionUpdates"
                                :key="update.name"
                                class="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                            >
                                <div class="flex items-center gap-3">
                                    <Icon icon="solar:box-bold" class="h-4 w-4 text-green-600" />
                                    <span class="font-medium">{{ update.name }}</span>
                                </div>
                                <div class="text-sm text-gray-600">
                                    {{ update.currentVersion }} →
                                    <span class="font-semibold text-green-600">{{
                                        update.latestVersion
                                    }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-if="developmentUpdates.length > 0">
                        <h3 class="font-semibold text-gray-900 mb-3">Development Dependencies</h3>
                        <div class="grid gap-2">
                            <div
                                v-for="update in developmentUpdates"
                                :key="update.name"
                                class="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
                            >
                                <div class="flex items-center gap-3">
                                    <Icon icon="solar:code-bold" class="h-4 w-4 text-orange-600" />
                                    <span class="font-medium">{{ update.name }}</span>
                                </div>
                                <div class="text-sm text-gray-600">
                                    {{ update.currentVersion }} →
                                    <span class="font-semibold text-orange-600">{{
                                        update.latestVersion
                                    }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Update Methods -->
                <div class="space-y-4">
                    <h3 class="font-semibold text-gray-900">Choose Your Update Method</h3>

                    <!-- NPM Commands (only show if using npm) -->
                    <div v-if="showNpmCommands" class="border rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-medium flex items-center gap-2">
                                <Icon icon="logos:npm-icon" class="h-5 w-5" />
                                NPM Commands
                            </h4>
                            <Button
                                variant="outline"
                                size="sm"
                                @click="copyToClipboard(npmCommands.join('\n'))"
                            >
                                <Icon icon="solar:copy-bold" class="h-4 w-4 mr-1" />
                                Copy All
                            </Button>
                        </div>
                        <div class="space-y-2">
                            <div
                                v-for="(command, index) in npmCommands"
                                :key="index"
                                class="flex items-center justify-between bg-gray-50 rounded p-3 font-mono text-sm"
                            >
                                <code>{{ command }}</code>
                                <Button variant="ghost" size="sm" @click="copyToClipboard(command)">
                                    <Icon icon="solar:copy-linear" class="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <!-- Yarn Commands (only show if using yarn) -->
                    <div v-if="showYarnCommands" class="border rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-medium flex items-center gap-2">
                                <Icon icon="logos:yarn" class="h-5 w-5" />
                                Yarn Commands
                            </h4>
                            <Button
                                variant="outline"
                                size="sm"
                                @click="copyToClipboard(yarnCommands.join('\n'))"
                            >
                                <Icon icon="solar:copy-bold" class="h-4 w-4 mr-1" />
                                Copy All
                            </Button>
                        </div>
                        <div class="space-y-2">
                            <div
                                v-for="(command, index) in yarnCommands"
                                :key="index"
                                class="flex items-center justify-between bg-gray-50 rounded p-3 font-mono text-sm"
                            >
                                <code>{{ command }}</code>
                                <Button variant="ghost" size="sm" @click="copyToClipboard(command)">
                                    <Icon icon="solar:copy-linear" class="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <!-- Pnpm Commands (only show if using pnpm) -->
                    <div v-if="showPnpmCommands" class="border rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-medium flex items-center gap-2">
                                <Icon icon="logos:pnpm" class="h-5 w-5" />
                                Pnpm Commands
                            </h4>
                            <Button
                                variant="outline"
                                size="sm"
                                @click="copyToClipboard(pnpmCommands.join('\n'))"
                            >
                                <Icon icon="solar:copy-bold" class="h-4 w-4 mr-1" />
                                Copy All
                            </Button>
                        </div>
                        <div class="space-y-2">
                            <div
                                v-for="(command, index) in pnpmCommands"
                                :key="index"
                                class="flex items-center justify-between bg-gray-50 rounded p-3 font-mono text-sm"
                            >
                                <code>{{ command }}</code>
                                <Button variant="ghost" size="sm" @click="copyToClipboard(command)">
                                    <Icon icon="solar:copy-linear" class="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <!-- Bun Commands (only show if using bun) -->
                    <div v-if="showBunCommands" class="border rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-medium flex items-center gap-2">
                                <Icon icon="logos:bun" class="h-5 w-5" />
                                Bun Commands
                            </h4>
                            <Button
                                variant="outline"
                                size="sm"
                                @click="copyToClipboard(bunCommands.join('\n'))"
                            >
                                <Icon icon="solar:copy-bold" class="h-4 w-4 mr-1" />
                                Copy All
                            </Button>
                        </div>
                        <div class="space-y-2">
                            <div
                                v-for="(command, index) in bunCommands"
                                :key="index"
                                class="flex items-center justify-between bg-gray-50 rounded p-3 font-mono text-sm"
                            >
                                <code>{{ command }}</code>
                                <Button variant="ghost" size="sm" @click="copyToClipboard(command)">
                                    <Icon icon="solar:copy-linear" class="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <!-- Manual package.json -->
                    <div class="border rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-medium flex items-center gap-2">
                                <Icon icon="solar:code-file-bold" class="h-4 w-4 text-[#1dce79]" />
                                Manual package.json Update
                            </h4>
                            <Button
                                variant="outline"
                                size="sm"
                                @click="copyToClipboard(packageJsonSnippet)"
                            >
                                <Icon icon="solar:copy-bold" class="h-4 w-4 mr-1" />
                                Copy JSON
                            </Button>
                        </div>
                        <div class="bg-gray-50 rounded p-3 font-mono text-sm overflow-x-auto">
                            <pre>{{ packageJsonSnippet }}</pre>
                        </div>
                        <p class="text-xs text-gray-600 mt-2">
                            Copy this JSON and merge it into your package.json file, then run
                            <code class="bg-gray-200 px-1 rounded">{{
                                detectedPackageManager === 'npm'
                                    ? 'npm install'
                                    : detectedPackageManager === 'pnpm'
                                      ? 'pnpm install'
                                      : detectedPackageManager === 'bun'
                                        ? 'bun install'
                                        : 'yarn install'
                            }}</code>
                            to update the lockfile.
                        </p>
                    </div>
                </div>

                <!-- Lockfile Information -->
                <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 class="font-medium flex items-center gap-2 mb-2">
                        <Icon icon="solar:info-circle-bold" class="h-4 w-4 text-amber-600" />
                        Lockfile Handling
                    </h4>
                    <div class="text-sm text-amber-800 space-y-2">
                        <p>
                            <strong>Recommended:</strong> Keep your lockfile ({{ lockfileName }})
                            and let the commands above update it automatically.
                        </p>
                        <p v-if="showYarnCommands">
                            <strong>Why yarn upgrade?</strong> Unlike
                            <code class="bg-amber-100 px-1 rounded">yarn add</code>, the
                            <code class="bg-amber-100 px-1 rounded">yarn upgrade</code> command will
                            update packages even if current versions satisfy semver constraints.
                        </p>
                        <p v-if="showNpmCommands">
                            <strong>Why specific versions?</strong> NPM will install the exact
                            versions specified, ensuring your dependencies are updated to the latest
                            available versions.
                        </p>
                        <p v-if="showPnpmCommands">
                            <strong>Why pnpm update?</strong> The
                            <code class="bg-amber-100 px-1 rounded">pnpm update</code> command will
                            update packages to their latest versions, respecting the version ranges
                            specified.
                        </p>
                        <p v-if="showBunCommands">
                            <strong>Why bun update?</strong> Bun's
                            <code class="bg-amber-100 px-1 rounded">bun update</code> command
                            efficiently updates packages to their latest compatible versions.
                        </p>
                        <p class="text-xs">
                            Only delete the lockfile if you're experiencing dependency resolution
                            issues or want to get the very latest compatible versions of all
                            dependencies.
                        </p>
                    </div>
                </div>

                <!-- Footer -->
                <div class="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" @click="closeModal"> Close </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

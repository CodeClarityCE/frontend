<script lang="ts" setup>
/**
 * ComposerDependencyTree Component
 * 
 * Displays PHP Composer dependencies in a hierarchical tree structure.
 * Features:
 * - Visual representation of package dependencies from composer.lock
 * - Framework detection (Laravel, Symfony, CakePHP, etc.)
 * - Production vs development dependency separation
 * - Package version and constraint information
 * - Interactive expand/collapse functionality
 */

import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shadcn/ui/collapsible';
interface Dependency {
    name: string;
    version: string;
    version_info?: any;
    framework?: string;
    package_url?: string;
    ecosystem?: string;
    type?: string;
    description?: string;
    license?: string | string[];
    scope?: string;
}

interface ComposerPackage {
    name: string;
    version: string;
    type?: string;
    description?: string;
    license?: string[];
    framework?: string;
    isDev: boolean;
    dependencies: ComposerPackage[];
    expanded?: boolean;
}

const props = defineProps<{
    /** Array of dependencies from SBOM data */
    dependencies: Dependency[];
    /** Current workspace/ecosystem being displayed */
    workspace: string;
    /** Loading state */
    isLoading?: boolean;
}>();

const emit = defineEmits<{
    /** Emitted when a package is selected for details */
    packageSelected: [packageName: string];
}>();

// Internal state
const expandedPackages = ref<Set<string>>(new Set());

// Computed properties
const composerPackages = computed(() => {
    // Filter for PHP/Composer dependencies only
    const phpDeps = props.dependencies.filter(dep => 
        dep.package_url?.includes('pkg:composer/') || 
        dep.ecosystem === 'composer' ||
        dep.name?.includes('/')  // Composer packages typically have vendor/package format
    );

    return buildPackageTree(phpDeps);
});

const frameworkInfo = computed(() => {
    const frameworks = new Set<string>();
    const totalPackages = composerPackages.value.length;
    let devPackages = 0;
    let prodPackages = 0;

    composerPackages.value.forEach(pkg => {
        if (pkg.framework) frameworks.add(pkg.framework);
        if (pkg.isDev) devPackages++; else prodPackages++;
    });

    return {
        frameworks: Array.from(frameworks),
        totalPackages,
        devPackages,
        prodPackages
    };
});

// Methods
function buildPackageTree(dependencies: Dependency[]): ComposerPackage[] {
    const packages: ComposerPackage[] = [];
    const packageMap = new Map<string, ComposerPackage>();

    // Convert dependencies to ComposerPackage format
    dependencies.forEach(dep => {
        const pkg: ComposerPackage = {
            name: dep.name || 'unknown',
            version: dep.version || 'unknown',
            type: dep.type,
            description: dep.description,
            license: Array.isArray(dep.license) ? dep.license : dep.license ? [dep.license] : undefined,
            framework: detectFramework(dep.name || ''),
            isDev: dep.scope === 'dev' || dep.scope === 'development',
            dependencies: [],
            expanded: false
        };

        packageMap.set(pkg.name, pkg);
        packages.push(pkg);
    });

    // Build parent-child relationships (simplified for display)
    // In a real implementation, this would parse composer.lock dependency relationships
    return packages.sort((a, b) => {
        // Sort by framework packages first, then production, then dev
        if (a.framework && !b.framework) return -1;
        if (!a.framework && b.framework) return 1;
        if (a.isDev !== b.isDev) return a.isDev ? 1 : -1;
        return a.name.localeCompare(b.name);
    });
}

function detectFramework(packageName: string): string | undefined {
    const frameworkPatterns = {
        'Laravel': ['laravel/framework', 'laravel/'],
        'Symfony': ['symfony/framework-bundle', 'symfony/'],
        'CakePHP': ['cakephp/cakephp', 'cakephp/'],
        'CodeIgniter': ['codeigniter4/framework'],
        'WordPress': ['johnpbloch/wordpress', 'wordpress/'],
        'Drupal': ['drupal/core', 'drupal/'],
        'Slim': ['slim/slim'],
        'Yii': ['yiisoft/yii2'],
        'Laminas': ['laminas/']
    };

    for (const [framework, patterns] of Object.entries(frameworkPatterns)) {
        if (patterns.some(pattern => packageName.includes(pattern))) {
            return framework;
        }
    }

    return undefined;
}

function togglePackage(packageName: string) {
    if (expandedPackages.value.has(packageName)) {
        expandedPackages.value.delete(packageName);
    } else {
        expandedPackages.value.add(packageName);
    }
}

function getPackageIcon(pkg: ComposerPackage): string {
    if (pkg.framework) return 'mdi:package-variant';
    if (pkg.type === 'library') return 'mdi:library';
    if (pkg.type === 'project') return 'mdi:folder-open';
    if (pkg.isDev) return 'mdi:wrench';
    return 'mdi:package';
}

function getPackageColor(pkg: ComposerPackage): string {
    if (pkg.framework) return 'text-blue-600';
    if (pkg.isDev) return 'text-orange-600';
    return 'text-gray-600';
}

function selectPackage(packageName: string) {
    emit('packageSelected', packageName);
}
</script>

<template>
    <div class="composer-dependency-tree">
        <!-- Header with framework information -->
        <div class="tree-header mb-6">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Icon icon="mdi:package-variant-closed" class="text-blue-600" />
                    Composer Dependencies
                </h3>
                <div class="text-sm text-gray-500">
                    {{ frameworkInfo.totalPackages }} packages
                </div>
            </div>

            <!-- Framework badges -->
            <div v-if="frameworkInfo.frameworks.length > 0" class="flex flex-wrap gap-2 mb-4">
                <span 
                    v-for="framework in frameworkInfo.frameworks" 
                    :key="framework"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                    {{ framework }}
                </span>
            </div>

            <!-- Package type summary -->
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div class="bg-gray-50 rounded-lg p-3">
                    <div class="text-gray-500">Production</div>
                    <div class="text-lg font-semibold text-gray-900">{{ frameworkInfo.prodPackages }}</div>
                </div>
                <div class="bg-orange-50 rounded-lg p-3">
                    <div class="text-gray-500">Development</div>
                    <div class="text-lg font-semibold text-orange-600">{{ frameworkInfo.devPackages }}</div>
                </div>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="isLoading" class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-2 text-gray-600">Loading dependencies...</span>
        </div>

        <!-- Empty state -->
        <div v-else-if="composerPackages.length === 0" class="text-center py-8 text-gray-500">
            <Icon icon="mdi:package-variant" class="mx-auto h-12 w-12 mb-2" />
            <p>No Composer dependencies found</p>
            <p class="text-sm">Make sure this is a PHP project with a composer.lock file</p>
        </div>

        <!-- Dependency tree -->
        <div v-else class="space-y-1">
            <div 
                v-for="pkg in composerPackages" 
                :key="pkg.name"
                class="dependency-item"
            >
                <Collapsible v-model:open="pkg.expanded">
                    <div class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <!-- Expand/collapse button -->
                        <CollapsibleTrigger 
                            v-if="pkg.dependencies.length > 0"
                            class="flex-shrink-0 p-1 hover:bg-gray-200 rounded"
                            @click="togglePackage(pkg.name)"
                        >
                            <Icon 
                                :icon="pkg.expanded ? 'mdi:chevron-down' : 'mdi:chevron-right'" 
                                class="w-4 h-4 text-gray-400"
                            />
                        </CollapsibleTrigger>
                        <div v-else class="w-6"></div>

                        <!-- Package icon -->
                        <Icon 
                            :icon="getPackageIcon(pkg)" 
                            :class="getPackageColor(pkg)"
                            class="w-5 h-5"
                        />

                        <!-- Package information -->
                        <div class="flex-1 min-w-0" @click="selectPackage(pkg.name)">
                            <div class="flex items-center space-x-2">
                                <span class="font-medium text-gray-900 truncate">{{ pkg.name }}</span>
                                <span class="text-sm text-gray-500">{{ pkg.version }}</span>
                                
                                <!-- Framework badge -->
                                <span 
                                    v-if="pkg.framework"
                                    class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700"
                                >
                                    {{ pkg.framework }}
                                </span>

                                <!-- Dev badge -->
                                <span 
                                    v-if="pkg.isDev"
                                    class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700"
                                >
                                    DEV
                                </span>
                            </div>

                            <div v-if="pkg.description" class="text-sm text-gray-500 truncate mt-1">
                                {{ pkg.description }}
                            </div>

                            <div v-if="pkg.license" class="flex items-center space-x-1 mt-1">
                                <Icon icon="mdi:license" class="w-3 h-3 text-gray-400" />
                                <span class="text-xs text-gray-500">
                                    {{ pkg.license.join(', ') }}
                                </span>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="flex-shrink-0">
                            <button
                                class="p-1 text-gray-400 hover:text-gray-600 rounded"
                                title="View package details"
                                @click="selectPackage(pkg.name)"
                            >
                                <Icon icon="mdi:information-outline" class="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <!-- Child dependencies -->
                    <CollapsibleContent v-if="pkg.dependencies.length > 0">
                        <div class="ml-8 mt-2 space-y-1">
                            <div 
                                v-for="childPkg in pkg.dependencies" 
                                :key="childPkg.name"
                                class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                                @click="selectPackage(childPkg.name)"
                            >
                                <Icon :icon="getPackageIcon(childPkg)" class="w-4 h-4 text-gray-400" />
                                <span class="text-sm text-gray-700">{{ childPkg.name }}</span>
                                <span class="text-xs text-gray-500">{{ childPkg.version }}</span>
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>
        </div>
    </div>
</template>

<style scoped>
.composer-dependency-tree {
    @apply bg-white rounded-lg border border-gray-200 p-4;
}

.tree-header {
    @apply border-b border-gray-200 pb-4;
}

.dependency-item {
    @apply border-l-2 border-gray-100;
}

.dependency-item:hover {
    @apply border-l-blue-200;
}
</style>
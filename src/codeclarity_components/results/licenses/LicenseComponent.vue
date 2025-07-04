<script lang="ts" setup>
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import { License } from '@/codeclarity_components/results/licenses/License';
import Popover from '@/shadcn/ui/popover/Popover.vue';
import PopoverTrigger from '@/shadcn/ui/popover/PopoverTrigger.vue';
import PopoverContent from '@/shadcn/ui/popover/PopoverContent.vue';
import Badge from '@/shadcn/ui/badge/Badge.vue';
import { Card, CardContent } from '@/shadcn/ui/card';
import { Button } from '@/shadcn/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shadcn/ui/tooltip';

const property_title = ref('');
const property_content = ref('');
const isExpanded = ref(false);

// Computed properties for license categorization and styling
const licenseCategory = computed(() => {
    const category = props.license.license_category?.toLowerCase();
    if (category?.includes('permissive')) return 'permissive';
    if (category?.includes('copyleft')) return 'copyleft';
    if (category?.includes('strong')) return 'strong-copyleft';
    if (category?.includes('weak')) return 'weak-copyleft';
    return 'unknown';
});

const licenseTypeInfo = computed(() => {
    const category = licenseCategory.value;
    const configs = {
        permissive: {
            color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
            icon: 'tabler:shield-check',
            iconColor: 'text-emerald-600',
            gradient: 'from-emerald-50 to-green-50',
            riskLevel: 'Low Risk',
            riskColor: 'text-emerald-700 bg-emerald-100'
        },
        copyleft: {
            color: 'bg-orange-50 border-orange-200 text-orange-800',
            icon: 'tabler:shield-exclamation',
            iconColor: 'text-orange-600',
            gradient: 'from-orange-50 to-yellow-50',
            riskLevel: 'Medium Risk',
            riskColor: 'text-orange-700 bg-orange-100'
        },
        'strong-copyleft': {
            color: 'bg-red-50 border-red-200 text-red-800',
            icon: 'tabler:shield-x',
            iconColor: 'text-red-600',
            gradient: 'from-red-50 to-orange-50',
            riskLevel: 'High Risk',
            riskColor: 'text-red-700 bg-red-100'
        },
        'weak-copyleft': {
            color: 'bg-amber-50 border-amber-200 text-amber-800',
            icon: 'tabler:shield-half',
            iconColor: 'text-amber-600',
            gradient: 'from-amber-50 to-orange-50',
            riskLevel: 'Medium Risk',
            riskColor: 'text-amber-700 bg-amber-100'
        },
        unknown: {
            color: 'bg-gray-50 border-gray-200 text-gray-800',
            icon: 'tabler:help-circle',
            iconColor: 'text-gray-600',
            gradient: 'from-gray-50 to-slate-50',
            riskLevel: 'Review Required',
            riskColor: 'text-gray-700 bg-gray-100'
        }
    };
    return configs[category] || configs.unknown;
});

const dependencyCount = computed(() => {
    return props.license.deps_using_license?.length || 0;
});

const hasIssues = computed(() => {
    return props.license.license_compliance_violation || props.license.unable_to_infer;
});

// Helper functions for property descriptions
const getPropertyDescription = (
    property: string,
    type: 'permission' | 'condition' | 'limitation'
) => {
    const descriptions = {
        // Permissions
        'commercial-use': 'The software may be used for commercial purposes.',
        modifications: 'The software may be modified.',
        distribution: 'The software may be distributed.',
        'private-use': 'The software may be used and modified in private.',
        'patent-use-permission':
            'This license provides an express grant of patent rights from contributors.',

        // Conditions
        'include-copyright':
            'A copy of the license and copyright notice must be included with the software.',
        'include-copyright-source':
            'A copy of the license and copyright notice must be included with the software in source form, but is not required for binaries.',
        'document-changes': 'Changes made to the code must be documented.',
        'disclose-source': 'Source code must be made available when the software is distributed.',
        'network-use-disclose':
            'Users who interact with the software via network are given the right to receive a copy of the source code.',
        'same-license':
            'Modifications must be released under the same license when distributing the software. In some cases a similar or related license may be used.',
        'same-license-file':
            'Modifications of existing files must be released under the same license when distributing the software. In some cases a similar or related license may be used.',
        'same-license-library':
            'Modifications must be released under the same license when distributing the software. In some cases a similar or related license may be used, or this condition may not apply to works that use the software as a library.',

        // Limitations
        'trademark-use':
            'This license explicitly states that it does NOT grant trademark rights, even though licenses without such a statement probably do not grant any implicit trademark rights.',
        liability: 'This license includes a limitation of liability.',
        'patent-use-limitation':
            'This license explicitly states that it does NOT grant any rights in the patents of contributors.',
        warranty: 'The license explicitly states that it does NOT provide any warranty.'
    };

    // Handle patent-use for both permissions and limitations
    if (property === 'patent-use') {
        if (type === 'permission') {
            return descriptions['patent-use-permission'];
        } else if (type === 'limitation') {
            return descriptions['patent-use-limitation'];
        }
    }

    return descriptions[property as keyof typeof descriptions] || 'No information available.';
};

const getPropertyIcon = (property: string, type: 'permission' | 'condition' | 'limitation') => {
    const icons = {
        // Permissions
        'commercial-use': 'tabler:building-store',
        modifications: 'tabler:edit',
        distribution: 'tabler:share',
        'private-use': 'tabler:lock',
        'patent-use': 'tabler:certificate',

        // Conditions
        'include-copyright': 'tabler:copyright',
        'include-copyright-source': 'tabler:file-text',
        'document-changes': 'tabler:file-diff',
        'disclose-source': 'tabler:code',
        'network-use-disclose': 'tabler:network',
        'same-license': 'tabler:repeat',
        'same-license-file': 'tabler:file-code',
        'same-license-library': 'tabler:books',

        // Limitations
        'trademark-use': 'tabler:trademark',
        liability: 'tabler:shield-off',
        warranty: 'tabler:shield-x'
    };

    return icons[property as keyof typeof icons] || 'tabler:info-circle';
};

const formatPropertyName = (property: string) => {
    return property
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

type Props = {
    license: License;
    last?: boolean;
    analysisID?: string;
    projectID?: string;
};

const props = withDefaults(defineProps<Props>(), {
    last: false,
    analysisID: '',
    projectID: ''
});

function referenceDomain(url: string) {
    try {
        const host = new URL(url).hostname;
        return host;
    } catch (error) {
        console.error(error);

        return '';
    }
}

async function fillModal(title: string, type: string) {
    property_title.value = title;

    // Limitations
    if (title == 'trademark-use' && type == 'limitation') {
        property_content.value =
            'This license explicitly states that it does NOT grant trademark rights, even though licenses without such a statement probably do not grant any implicit trademark rights.';
    } else if (title == 'liability' && type == 'limitation') {
        property_content.value = 'This license includes a limitation of liability.';
    } else if (title == 'patent-use' && type == 'limitation') {
        property_content.value =
            'This license explicitly states that it does NOT grant any rights in the patents of contributors.';
    } else if (title == 'warranty' && type == 'limitation') {
        property_content.value =
            'The license explicitly states that it does NOT provide any warranty.';
    }
    // Conditions
    else if (title == 'include-copyright' && type == 'condition') {
        property_content.value =
            'A copy of the license and copyright notice must be included with the software.';
    } else if (title == 'include-copyright-source' && type == 'condition') {
        property_content.value =
            'A copy of the license and copyright notice must be included with the software in source form, but is not required for binaries.';
    } else if (title == 'document-changes' && type == 'condition') {
        property_content.value = 'Changes made to the code must be documented.';
    } else if (title == 'disclose-source' && type == 'condition') {
        property_content.value =
            'Source code must be made available when the software is distributed.';
    } else if (title == 'network-use-disclose' && type == 'condition') {
        property_content.value =
            'Users who interact with the software via network are given the right to receive a copy of the source code.';
    } else if (title == 'same-license' && type == 'condition') {
        property_content.value =
            'Modifications must be released under the same license when distributing the software. In some cases a similar or related license may be used.';
    } else if (title == 'same-license-file' && type == 'condition') {
        property_content.value =
            'Modifications of existing files must be released under the same license when distributing the software. In some cases a similar or related license may be used.';
    } else if (title == 'same-license-library' && type == 'condition') {
        property_content.value =
            'Modifications must be released under the same license when distributing the software. In some cases a similar or related license may be used, or this condition may not apply to works that use the software as a library.';
    }
    // Permissions
    else if (title == 'commercial-use' && type == 'permission') {
        property_content.value = 'The software may be used for commercial purposes.';
    } else if (title == 'modifications' && type == 'permission') {
        property_content.value = 'The software may be modified.';
    } else if (title == 'distribution' && type == 'permission') {
        property_content.value = 'The software may be distributed.';
    } else if (title == 'private-use' && type == 'permission') {
        property_content.value = 'The software may be used and modified in private.';
    } else if (title == 'patent-use' && type == 'permission') {
        property_content.value =
            'This license provides an express grant of patent rights from contributors.';
    } else {
        property_content.value = 'No information available.';
    }
}

// Helper functions for descriptions (using the main property description function)
function getPermissionDescription(permission: string): string {
    return getPropertyDescription(permission, 'permission');
}

function getConditionDescription(condition: string): string {
    return getPropertyDescription(condition, 'condition');
}

function getLimitationDescription(limitation: string): string {
    return getPropertyDescription(limitation, 'limitation');
}

// ...existing code...
</script>

<template>
    <Card
        class="license-card transition-all duration-300 hover:shadow-lg border-l-4"
        :class="[
            licenseTypeInfo.gradient,
            hasIssues
                ? 'border-l-red-500'
                : `border-l-${licenseTypeInfo.iconColor.split('-')[1]}-500`
        ]"
    >
        <CardContent class="p-6">
            <!-- Header Section -->
            <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                    <!-- License Name and Status -->
                    <div class="flex items-center gap-3 mb-2">
                        <div class="flex items-center gap-2">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger as-child>
                                        <div class="p-2 rounded-lg" :class="licenseTypeInfo.color">
                                            <Icon
                                                :icon="licenseTypeInfo.icon"
                                                class="w-5 h-5"
                                                :class="licenseTypeInfo.iconColor"
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <div class="text-sm">
                                            <div class="font-semibold">
                                                {{
                                                    licenseCategory.charAt(0).toUpperCase() +
                                                    licenseCategory.slice(1)
                                                }}
                                                License
                                            </div>
                                            <div class="text-xs text-gray-600 mt-1">
                                                {{ licenseTypeInfo.riskLevel }}
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <div>
                                <h3 class="text-lg font-bold text-gray-900">
                                    {{ props.license.name || props.license.id }}
                                    <span
                                        v-if="
                                            props.license.name &&
                                            props.license.id !== props.license.name
                                        "
                                        class="text-sm font-normal text-gray-600"
                                    >
                                        ({{ props.license.id }})
                                    </span>
                                </h3>

                                <!-- Status Badges -->
                                <div class="flex items-center gap-2 mt-1">
                                    <Badge
                                        variant="outline"
                                        class="text-xs px-2 py-1"
                                        :class="licenseTypeInfo.riskColor"
                                    >
                                        {{ licenseTypeInfo.riskLevel }}
                                    </Badge>

                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger as-child>
                                                <Badge
                                                    variant="secondary"
                                                    class="text-xs px-2 py-1"
                                                >
                                                    <Icon
                                                        icon="tabler:package"
                                                        class="w-3 h-3 mr-1"
                                                    />
                                                    {{ dependencyCount }} dependencies
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <div class="text-sm">
                                                    {{ dependencyCount }} dependencies use this
                                                    license
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Warning Messages -->
                    <div v-if="hasIssues" class="mb-3">
                        <div
                            v-if="props.license.license_compliance_violation"
                            class="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3"
                        >
                            <Icon icon="tabler:alert-triangle" class="w-4 h-4 flex-shrink-0" />
                            <span class="font-medium">License Compliance Violation</span>
                        </div>

                        <div
                            v-if="props.license.unable_to_infer"
                            class="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3"
                        >
                            <Icon icon="tabler:help-circle" class="w-4 h-4 flex-shrink-0" />
                            <span class="font-medium">Unknown license reference</span>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger as-child>
                                <Button variant="ghost" size="sm" @click="isExpanded = !isExpanded">
                                    <Icon
                                        :icon="
                                            isExpanded ? 'tabler:chevron-up' : 'tabler:chevron-down'
                                        "
                                        class="w-4 h-4"
                                    />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {{ isExpanded ? 'Collapse' : 'Expand' }} details
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            <!-- Quick Info Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <!-- Category Info -->
                <div v-if="props.license.license_category" class="flex items-center gap-2">
                    <div class="text-sm text-gray-600">Category:</div>
                    <Popover>
                        <PopoverTrigger>
                            <Badge variant="secondary" class="cursor-pointer hover:bg-gray-200">
                                {{ props.license.license_category }}
                                <Icon icon="tabler:info-circle" class="w-3 h-3 ml-1" />
                            </Badge>
                        </PopoverTrigger>
                        <PopoverContent class="w-fit max-w-md">
                            <div class="space-y-3 p-2">
                                <div class="font-bold text-gray-900">License Category</div>
                                <div class="text-sm space-y-2">
                                    <div>
                                        Most open-source software licenses fall into two groups:
                                        <span class="font-semibold">permissive licenses</span>
                                        and
                                        <span class="font-semibold">copyleft licenses</span>.
                                    </div>
                                    <div>
                                        <div
                                            class="flex items-center gap-2 font-semibold text-emerald-700"
                                        >
                                            <Icon icon="tabler:shield-check" class="w-4 h-4" />
                                            Permissive Licenses
                                        </div>
                                        <div class="text-gray-600 mt-1">
                                            Impose minimal restrictions on how the software can be
                                            used, modified, and redistributed. Examples: MIT, BSD,
                                            Apache licenses.
                                        </div>
                                    </div>
                                    <div>
                                        <div
                                            class="flex items-center gap-2 font-semibold text-orange-700"
                                        >
                                            <Icon
                                                icon="tabler:shield-exclamation"
                                                class="w-4 h-4"
                                            />
                                            Copyleft Licenses
                                        </div>
                                        <div class="text-gray-600 mt-1">
                                            Ensure that derivative works also remain open source.
                                            Examples: GPL, LGPL, MPL licenses.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                <!-- Dependencies Count -->
                <div class="flex items-center gap-2">
                    <div class="text-sm text-gray-600">Dependencies:</div>
                    <Popover>
                        <PopoverTrigger>
                            <Badge variant="outline" class="cursor-pointer hover:bg-gray-50">
                                {{ dependencyCount }}
                                <Icon icon="tabler:external-link" class="w-3 h-3 ml-1" />
                            </Badge>
                        </PopoverTrigger>
                        <PopoverContent class="w-fit max-w-lg">
                            <div class="space-y-3">
                                <div class="font-semibold text-gray-900">
                                    Dependencies using this license
                                </div>
                                <div class="max-h-64 overflow-y-auto space-y-1">
                                    <div
                                        v-for="dep in props.license.deps_using_license"
                                        :key="dep"
                                        class="licenses-deps-using-row"
                                    >
                                        <RouterLink
                                            :to="{
                                                name: 'results',
                                                query: {
                                                    analysis_id: props.analysisID,
                                                    project_id: props.projectID,
                                                    package_id: dep
                                                },
                                                params: { page: 'sbom_details' }
                                            }"
                                            class="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                                            title="View dependency details"
                                        >
                                            {{ dep }}
                                            <Icon icon="tabler:external-link" class="w-3 h-3" />
                                        </RouterLink>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                <!-- References -->
                <div
                    v-if="props.license.references && props.license.references.length > 0"
                    class="flex items-center gap-2"
                >
                    <div class="text-sm text-gray-600">References:</div>
                    <div class="flex gap-2">
                        <TooltipProvider
                            v-for="reference in props.license.references.slice(0, 2)"
                            :key="reference"
                        >
                            <Tooltip>
                                <TooltipTrigger as-child>
                                    <a
                                        :href="reference"
                                        target="_blank"
                                        class="text-blue-600 hover:text-blue-800 text-sm underline"
                                    >
                                        {{ referenceDomain(reference) }}
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Opens {{ reference }} in a new tab
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <span
                            v-if="props.license.references.length > 2"
                            class="text-sm text-gray-500"
                        >
                            +{{ props.license.references.length - 2 }} more
                        </span>
                    </div>
                </div>
            </div>

            <!-- Expandable Content -->
            <div v-if="isExpanded" class="space-y-4 border-t border-gray-200 pt-4">
                <!-- Description -->
                <div
                    v-if="props.license.description && props.license.description.length > 0"
                    class="bg-gray-50 rounded-lg p-4"
                >
                    <h4 class="font-semibold text-sm text-gray-900 mb-2">Description</h4>
                    <p class="text-sm text-gray-700 leading-relaxed">
                        {{ props.license.description }}
                    </p>
                </div>

                <!-- License Properties -->
                <div v-if="props.license.license_properties" class="space-y-6">
                    <!-- Permissions Section -->
                    <div
                        v-if="props.license.license_properties.permissions"
                        class="border border-emerald-200 rounded-lg overflow-hidden"
                    >
                        <div class="bg-emerald-100 px-4 py-3 border-b border-emerald-200">
                            <div class="flex items-center gap-2">
                                <Icon icon="tabler:check" class="w-5 h-5 text-emerald-700" />
                                <h4 class="font-semibold text-emerald-900">Permissions</h4>
                                <Badge
                                    variant="secondary"
                                    class="text-xs bg-emerald-50 text-emerald-700"
                                >
                                    {{ props.license.license_properties.permissions.length }}
                                    granted
                                </Badge>
                            </div>
                            <p class="text-sm text-emerald-700 mt-1">
                                Rights that the license explicitly grants to users
                            </p>
                        </div>
                        <div class="bg-emerald-50 p-4 space-y-3">
                            <div
                                v-for="permission in props.license.license_properties.permissions"
                                :key="permission"
                                class="flex items-start gap-3 p-3 bg-white rounded-lg border border-emerald-100 hover:border-emerald-200 transition-colors"
                            >
                                <Icon
                                    :icon="getPropertyIcon(permission, 'permission')"
                                    class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0"
                                />
                                <div class="flex-1">
                                    <div class="font-medium text-gray-900 mb-1">
                                        {{ formatPropertyName(permission) }}
                                    </div>
                                    <p class="text-sm text-gray-600">
                                        {{ getPermissionDescription(permission) }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Conditions Section -->
                    <div
                        v-if="props.license.license_properties.conditions"
                        class="border border-amber-200 rounded-lg overflow-hidden"
                    >
                        <div class="bg-amber-100 px-4 py-3 border-b border-amber-200">
                            <div class="flex items-center gap-2">
                                <Icon icon="tabler:alert-circle" class="w-5 h-5 text-amber-700" />
                                <h4 class="font-semibold text-amber-900">Conditions</h4>
                                <Badge
                                    variant="secondary"
                                    class="text-xs bg-amber-50 text-amber-700"
                                >
                                    {{ props.license.license_properties.conditions.length }}
                                    required
                                </Badge>
                            </div>
                            <p class="text-sm text-amber-700 mt-1">
                                Requirements that must be met when using this license
                            </p>
                        </div>
                        <div class="bg-amber-50 p-4 space-y-3">
                            <div
                                v-for="condition in props.license.license_properties.conditions"
                                :key="condition"
                                class="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-100 hover:border-amber-200 transition-colors"
                            >
                                <Icon
                                    :icon="getPropertyIcon(condition, 'condition')"
                                    class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
                                />
                                <div class="flex-1">
                                    <div class="font-medium text-gray-900 mb-1">
                                        {{ formatPropertyName(condition) }}
                                    </div>
                                    <p class="text-sm text-gray-600">
                                        {{ getConditionDescription(condition) }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Limitations Section -->
                    <div
                        v-if="props.license.license_properties.limitations"
                        class="border border-red-200 rounded-lg overflow-hidden"
                    >
                        <div class="bg-red-100 px-4 py-3 border-b border-red-200">
                            <div class="flex items-center gap-2">
                                <Icon icon="tabler:x" class="w-5 h-5 text-red-700" />
                                <h4 class="font-semibold text-red-900">Limitations</h4>
                                <Badge variant="secondary" class="text-xs bg-red-50 text-red-700">
                                    {{ props.license.license_properties.limitations.length }}
                                    restrictions
                                </Badge>
                            </div>
                            <p class="text-sm text-red-700 mt-1">
                                Rights and protections that the license does NOT provide
                            </p>
                        </div>
                        <div class="bg-red-50 p-4 space-y-3">
                            <div
                                v-for="limitation in props.license.license_properties.limitations"
                                :key="limitation"
                                class="flex items-start gap-3 p-3 bg-white rounded-lg border border-red-100 hover:border-red-200 transition-colors"
                            >
                                <Icon
                                    :icon="getPropertyIcon(limitation, 'limitation')"
                                    class="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
                                />
                                <div class="flex-1">
                                    <div class="font-medium text-gray-900 mb-1">
                                        {{ formatPropertyName(limitation) }}
                                    </div>
                                    <p class="text-sm text-gray-600">
                                        {{ getLimitationDescription(limitation) }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Attribution -->
                <div
                    v-if="props.license.license_properties"
                    class="text-xs text-gray-500 border-t pt-3"
                >
                    License properties from
                    <a
                        class="text-blue-600 hover:text-blue-800"
                        target="_blank"
                        href="https://choosealicense.com/"
                    >
                        choosealicense.com
                    </a>
                    licensed under
                    <a
                        class="text-blue-600 hover:text-blue-800"
                        target="_blank"
                        href="https://creativecommons.org/licenses/by/3.0/"
                    >
                        CC BY 3.0
                    </a>
                </div>
            </div>
        </CardContent>
    </Card>
</template>

<style scoped>
.license-card {
    transition: all 0.3s ease;
}

.license-card:hover {
    transform: translateY(-1px);
}

.licenses-deps-using-row {
    padding-top: 0.8em;
    padding-bottom: 0.8em;
    padding-left: 1.4em;
    padding-right: 1.4em;
}

.licenses-deps-using-row:hover {
    background-color: rgba(0, 128, 128, 0.157);
}
</style>

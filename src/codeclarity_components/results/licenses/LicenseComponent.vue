<script lang="ts" setup>
import PositionedModal from '@/base_components/PositionedModal.vue';
import { nextTick, ref, type Ref } from 'vue';
import { Icon } from '@iconify/vue';
import { License } from '@/codeclarity_components/results/licenses/License';
import Popover from '@/shadcn/ui/popover/Popover.vue';
import PopoverTrigger from '@/shadcn/ui/popover/PopoverTrigger.vue';
import PopoverContent from '@/shadcn/ui/popover/PopoverContent.vue';
import Badge from '@/shadcn/ui/badge/Badge.vue';
import { Card, CardContent } from '@/shadcn/ui/card';

const properties_modal_ref: Ref<typeof PositionedModal> = ref(PositionedModal);

const property_title = ref('');
const property_content = ref('');
const property_tracker = ref('');

type Props = {
    license: License;
    last: boolean;
    analysisID: string;
    projectID: string;
};

const props = withDefaults(defineProps<Props>(), {
    last: false,
    analysisID: '',
    projectID: ''
});

function referenceDomain(url: string) {
    try {
        let host = new URL(url).hostname;
        return host;
    } catch (error) {
        return '';
    }
}

async function fillModal(title: string, type: string, tracker: string) {
    property_tracker.value = tracker;
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
    await nextTick();

    properties_modal_ref.value.toggle();
}
</script>

<template>
    <Card>
        <CardContent>
            <div class="flex flex-col gap-4 relative">
                <div v-if="props.license.name" class="font-semibold text-lg flex gap-1">
                    <div>{{ props.license.name }} ({{ props.license.id }})</div>
                    <span v-if="props.license.license_compliance_violation"
                        class="flex gap-1 items-center text-sm text-destructive">
                        <Icon :icon="'ic:round-warning'"></Icon> License Compliance Violation
                    </span>
                </div>
                <div v-else class="font-semibold text-lg flex gap-1">
                    <div>{{ props.license.id }}</div>
                    <span v-if="props.license.unable_to_infer" class="flex gap-1 items-center text-sm text-destructive">
                        <Icon :icon="'ic:round-warning'"></Icon> Unknown license reference
                    </span>
                </div>
                <div v-if="props.license.references && props.license.references.length > 0" class="flex gap-4">
                    <div v-for="reference in props.license.references" :key="reference" class="license-reference">
                        <span style="cursor: pointer">
                            <a class="text-primary hover:text-primaryHovered cursor-pointer"
                                :title="'Opens reference ' + reference + ' in a new tab.'" target="_blank"
                                :href="reference">
                                {{ referenceDomain(reference) }}
                                <Icon :icon="'ic:attach-file-round'"></Icon>
                            </a>
                        </span>
                    </div>
                </div>
                <div class="flex gap-2 items-center cursor-pointer">
                    Dependencies using license:
                    <Popover>
                        <PopoverTrigger>
                            <Badge variant="secondary">
                                {{ props.license.deps_using_license.length }}
                                <Icon :icon="'heroicons:chevron-right-solid'"></Icon>
                            </Badge>
                        </PopoverTrigger>
                        <PopoverContent class="w-fit">
                            <div class="flex flex-row gap-4 justify-between items-center">
                                <div class="font-semibold">Dependencies using this license</div>
                            </div>

                            <div class="max-w-3xl max-h-96 overflow-y-auto -mx-5">
                                <div style="display: flex; flex-direction: column">
                                    <div v-for="dep in props.license.deps_using_license" :key="dep"
                                        class="licenses-deps-using-row">
                                        <RouterLink title="View dependency details" :to="{
                                            name: 'results',
                                            query: {
                                                analysis_id: props.analysisID,
                                                project_id: props.projectID,
                                                package_id: dep
                                            },
                                            params: { page: 'sbom_details' }
                                        }" class="flex flex-row gap-2 items-center cursor-pointer">
                                            {{ dep }} <Icon :icon="'ic:outline-open-in-new'"></Icon>
                                        </RouterLink>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                <div v-if="props.license.license_category" class="flex gap-2 items-center cursor-pointer">
                    Category:
                    <Popover>
                        <PopoverTrigger>
                            <Badge variant="secondary">
                                {{ props.license.license_category }}
                                <Icon :icon="'heroicons:chevron-right-solid'"></Icon>
                            </Badge>
                        </PopoverTrigger>
                        <PopoverContent class="w-fit">
                            <div class="flex flex-row gap-4 justify-between items-center">
                                <div class="font-bold">License Category</div>
                            </div>
                            <div style="max-width: 800px; max-height: 30em; overflow-y: auto">
                                <div style="display: flex; flex-direction: column; row-gap: 1em">
                                    <div>
                                        Most open-source software licenses fall into two groups:
                                        <span style="font-weight: 600">permissive licenses</span>
                                        and
                                        <span style="font-weight: 600">copyleft licenses</span>.
                                    </div>
                                    <div>
                                        <span class="flex flex-row gap-2" style="font-weight: 600">
                                            <Icon :icon="'mdi:shield-check'"></Icon>
                                            Permissive Licenses
                                        </span>
                                        are open-source licenses that impose minimal restrictions on
                                        how the software can be used, modified, and redistributed.
                                        Permissive licenses typically require users to include the
                                        original copyright notice and a copy of the license text
                                        when redistributing the software. Examples of permissive
                                        licenses include the MIT license, BSD license, and Apache
                                        license.
                                    </div>
                                    <div style="display: flex; flex-direction: column; row-gap: 1em">
                                        <div>
                                            <span class="flex flex-row gap-2" style="font-weight: 600">
                                                <Icon :icon="'heroicons:shield-exclamation-solid'"></Icon>
                                                Copyleft Licenses
                                            </span>
                                            are open-source licenses that aim to ensure that
                                            derivative works or modifications of the original
                                            software also remain open source. There are two flavors
                                            of copyleft licenses: strong and weak.
                                        </div>
                                        <div style="
                                                display: flex;
                                                flex-direction: column;
                                                row-gap: 1em;
                                            ">
                                            <div>
                                                <span style="font-weight: 600">Strong copyleft licenses</span>
                                                have stricter requirements compared to other
                                                copyleft licenses. They mandate that if software
                                                includes code licensed under a strong copyleft
                                                license, the entire software, must be made available
                                                under the same copyleft license. This means that the
                                                software and its source code must be freely
                                                accessible and redistributable under the terms of
                                                the strong copyleft license. Examples of strong
                                                copyleft licenses include the GNU General Public
                                                License (GPL) and the GNU Affero General Public
                                                License (AGPL)
                                            </div>
                                            <div>
                                                <span style="font-weight: 600">Weak copyleft licenses</span>
                                                have more flexible requirements compared to strong
                                                copyleft licenses. They usually apply copyleft
                                                restrictions only to the specific components that
                                                are directly derived from the original copylefted
                                                software. Other parts of the software that interact
                                                or are combined with the copylefted component may
                                                have different licensing terms. Weak copyleft
                                                licenses allow for a combination of copylefted and
                                                proprietary code in a single project, as long as the
                                                copylefted component's source code remains available
                                                and subject to the same copyleft license. Examples
                                                of weak copyleft licenses include the Mozilla Public
                                                License (MPL) and the Lesser General Public License
                                                (LGPL).
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                <div v-if="!props.license.license_category" class="flex gap-2 items-center">
                    Category:
                    <Badge variant="secondary"> Uncategorized </Badge>
                </div>
                <div v-if="props.license.description && props.license.description.length > 0">
                    {{ props.license.description }}
                </div>
                <div v-if="
                    props.license.unable_to_infer == false &&
                    !(props.license.description && props.license.description.length > 0) &&
                    props.license.references != null &&
                    props.license.references.length > 0
                ">
                    We do not have any more information on this license, you may however consult the
                    references above or your legal team to learn more.
                </div>
                <div v-if="
                    props.license.unable_to_infer == false &&
                    !(props.license.description && props.license.description.length > 0) &&
                    !(props.license.references != null && props.license.references.length > 0)
                ">
                    We do not have any more information on this license, you may however consult
                    your legal team to learn more.
                </div>
                <div v-if="props.license.unable_to_infer">
                    This license "reference" was found in the dependencies listed above. We were,
                    however, unable to identify which license the dependency is distributed under.
                    This might be because: The license text was changed to such a large degree, that
                    the license terms no longer align with the "original" license. No license file
                    or license information found in the source code that allows us to collaborate
                    the license defined by the developer.
                    <b>We strongly suggest, a manual review of those dependencies using the
                        "unrecognized" license to make sure your application does not infringe on
                        any licenses imposed by those dependencies.</b>
                </div>
                <div v-if="props.license.license_properties" class="flex gap-8">
                    <div class="flex flex-col gap-y-2" v-if="props.license.license_properties.permissions">
                        <div class="flex flex-row gap-2 items-center">
                            <Icon class="text-xl" :icon="'jam:shield-check'"></Icon>
                            <span class="font-semibold">Permissions:</span>
                        </div>
                        <div v-for="permission in props.license.license_properties.permissions" :key="permission">
                            <Badge variant="secondary" :id="'properties_modal_ref' + props.license.id + permission"
                                @click="
                                    fillModal(
                                        permission,
                                        'permission',
                                        'properties_modal_ref' + props.license.id + permission
                                    )
                                    ">
                                <div class="flex flex-row gap-1 items-center cursor-pointer">
                                    {{ permission }}
                                    <Icon :icon="'material-symbols:help-outline'"></Icon>
                                </div>
                            </Badge>
                        </div>
                    </div>
                    <div class="flex flex-col gap-y-2" v-if="props.license.license_properties.conditions">
                        <div class="flex flex-row gap-2 items-center">
                            <Icon class="text-xl" :icon="'jam:shield-close'"></Icon>
                            <span class="font-semibold">Conditions:</span>
                        </div>
                        <div v-for="condition in props.license.license_properties.conditions" :key="condition">
                            <Badge variant="secondary" :id="'properties_modal_ref' + props.license.id + condition"
                                @click="
                                    fillModal(
                                        condition,
                                        'condition',
                                        'properties_modal_ref' + props.license.id + condition
                                    )
                                    ">
                                <div class="flex flex-row gap-1 items-center cursor-pointer">
                                    {{ condition }}
                                    <Icon :icon="'material-symbols:help-outline'"></Icon>
                                </div>
                            </Badge>
                        </div>
                    </div>
                    <div class="flex flex-col gap-y-2" v-if="props.license.license_properties.limitations">
                        <div class="flex flex-row gap-2 items-center">
                            <Icon class="text-xl" :icon="'jam:shield-minus'"></Icon>
                            <span class="font-semibold">Limitations:</span>
                        </div>
                        <div v-for="limitation in props.license.license_properties.limitations" :key="limitation">
                            <Badge variant="secondary" :id="'properties_modal_ref' + props.license.id + limitation"
                                @click="
                                    fillModal(
                                        limitation,
                                        'limitation',
                                        'properties_modal_ref' + props.license.id + limitation
                                    )
                                    ">
                                <div class="flex flex-row gap-1 items-center cursor-pointer">
                                    {{ limitation }}
                                    <Icon :icon="'material-symbols:help-outline'"></Icon>
                                </div>
                            </Badge>
                        </div>
                    </div>
                </div>
                <div v-if="props.license.license_properties">
                    <div v-if="
                        props.license.license_properties.conditions ||
                        props.license.license_properties.permissions ||
                        props.license.license_properties.limitations
                    ">
                        License properties from
                        <a class="text-primary" target="_blank"
                            href="https://choosealicense.com/">choosealicense.com</a>
                        licensed under
                        <a class="text-primary" target="_blank" href="https://creativecommons.org/licenses/by/3.0/">CC
                            BY 3.0</a>
                    </div>
                </div>
                <PositionedModal ref="properties_modal_ref" :tracker="property_tracker" :position="'top'"
                    :show-title-divider="false" class="w-1/4">
                    <template #title>
                        <div class="flex flex-row gap-4 justify-between items-center">
                            <div>{{ property_title }}</div>
                            <Icon :icon="'ic:round-close'" class="cursor-pointer" title="Close modal"
                                @click="properties_modal_ref.toggle()">Close</Icon>
                        </div>
                    </template>
                    <template #content>
                        {{ property_content }}
                    </template>
                </PositionedModal>
            </div>
        </CardContent>
    </Card>
</template>

<style scoped>
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

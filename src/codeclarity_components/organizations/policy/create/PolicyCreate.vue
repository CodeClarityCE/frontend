<script lang="ts" setup>
import {
    isMemberRoleGreaterOrEqualTo,
    MemberRole,
    Organization
} from '@/codeclarity_components/organizations/organization.entity';
import router from '@/router';
import { onBeforeMount, ref, type Ref } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import HeaderItem from '@/codeclarity_components/organizations/subcomponents/HeaderItem.vue';
import { useForm } from 'vee-validate';
import { storeToRefs } from 'pinia';
import { LicensePolicyRepository } from '@/codeclarity_components/organizations/policy/license_policy.repository';
import { LicenseRepository } from '@/codeclarity_components/results/licenses/LicenseRepository';
import { LicensePolicyType } from '@/codeclarity_components/organizations/policy/license_policy.entity';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import type { License } from '@/codeclarity_components/results/licenses/License';
import FormItem from '@/shadcn/ui/form/FormItem.vue';
import FormLabel from '@/shadcn/ui/form/FormLabel.vue';
import FormControl from '@/shadcn/ui/form/FormControl.vue';
import FormMessage from '@/shadcn/ui/form/FormMessage.vue';
import Input from '@/shadcn/ui/input/Input.vue';
import { FormField } from '@/shadcn/ui/form';
import Select from '@/shadcn/ui/select/Select.vue';
import SelectTrigger from '@/shadcn/ui/select/SelectTrigger.vue';
import SelectValue from '@/shadcn/ui/select/SelectValue.vue';
import SelectContent from '@/shadcn/ui/select/SelectContent.vue';
import SelectGroup from '@/shadcn/ui/select/SelectGroup.vue';
import SelectItem from '@/shadcn/ui/select/SelectItem.vue';
import Checkbox from '@/shadcn/ui/checkbox/Checkbox.vue';
import Button from '@/shadcn/ui/button/Button.vue';
import DataTable from './DataTable.vue';
import { columns } from './columns';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';

const orgId: Ref<string> = ref('');
const orgInfo: Ref<Organization | undefined> = ref();

// Repositories
const licensePolicyRepository: LicensePolicyRepository = new LicensePolicyRepository();
const licenseRepository: LicenseRepository = new LicenseRepository();

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

const { defaultOrg } = storeToRefs(userStore);

const choices: Ref<Array<License>> = ref([]);

const error: Ref<boolean> = ref(false);
const errorCode: Ref<string> = ref('');

// Form Validation
const formSchema = toTypedSchema(
    z.object({
        name: z.string().min(5).max(200),
        description: z.string().max(200).optional().default(''),
        type: z.string(),
        isDefault: z.boolean().default(false),
        licenses: z.string().array()
    })
);

function setOrgInfo(_orgInfo: Organization) {
    orgInfo.value = _orgInfo;
    if (!isMemberRoleGreaterOrEqualTo(_orgInfo.role, MemberRole.ADMIN)) {
        router.push({ name: 'orgManage', params: { page: '', orgId: _orgInfo.id } });
    }
}

// Methods
const { handleSubmit } = useForm({
    validationSchema: formSchema,
    initialValues: {
        isDefault: false
    }
});

const onSubmit = handleSubmit(async (values) => {
    console.log(values);

    try {
        await licensePolicyRepository.createPolicy({
            orgId: defaultOrg!.value!.id,
            data: {
                name: values.name,
                description: values.description ?? '',
                type: values.type as LicensePolicyType,
                licenses: values.licenses,
                default: values.isDefault
            },
            bearerToken: authStore.getToken ?? ''
        });
    } catch (_err) {
        error.value = true;
        if (_err instanceof BusinessLogicError) {
            errorCode.value = _err.error_code;
        }
    } finally {
        router.back();
    }
});

async function init() {
    const route = useRoute();
    const _orgId = route.params.orgId;

    if (!_orgId) {
        router.back();
    }

    if (typeof _orgId == 'string') {
        orgId.value = _orgId;
    } else {
        router.back();
    }

    try {
        const resp = await licenseRepository.getAllLicenses({
            bearerToken: authStore.getToken ?? ''
        });
        choices.value = resp.data;
    } catch (_err) {
        error.value = true;
        if (_err instanceof BusinessLogicError) {
            errorCode.value = _err.error_code;
        }
    }
}

onBeforeMount(async () => {
    await init();
});
</script>
<template>
    <div class="min-h-screen bg-white">
        <HeaderItem v-if="orgId" :org-id="orgId" @on-org-info="setOrgInfo($event)"></HeaderItem>

        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <!-- Header Section -->
            <div class="text-center mb-12">
                <div
                    class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mb-6"
                >
                    <svg
                        class="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                    </svg>
                </div>
                <h1 class="text-4xl font-bold text-gray-900 mb-4">Create License Policy</h1>
                <p class="text-lg text-gray-600 max-w-2xl mx-auto">
                    Define license compliance rules for your organization. Set up whitelist or
                    blacklist policies to ensure your projects use appropriate licenses.
                </p>
            </div>

            <!-- Main Form Card -->
            <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <!-- Card Header -->
                <div
                    class="bg-gradient-to-r from-green-50 to-blue-50 px-8 py-6 border-b border-gray-100"
                >
                    <h2 class="text-xl font-semibold text-gray-900 flex items-center">
                        <svg
                            class="w-5 h-5 text-green-600 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                        </svg>
                        Policy Configuration
                    </h2>
                    <p class="text-sm text-gray-600 mt-1">
                        Configure your license policy settings and select applicable licenses
                    </p>
                </div>

                <!-- Card Content -->
                <div class="px-8 py-8">
                    <form class="space-y-8" @submit="onSubmit">
                        <!-- Basic Information Section -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Name Field -->
                            <FormField v-slot="{ componentField }" name="name">
                                <FormItem>
                                    <FormLabel
                                        class="block text-sm font-semibold text-gray-900 mb-2"
                                    >
                                        Policy Name
                                        <span class="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <div class="relative">
                                            <Input
                                                placeholder="Enter policy name..."
                                                v-bind="componentField"
                                                class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                                            />
                                            <div
                                                class="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                <svg
                                                    class="w-5 h-5 text-gray-400"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    </FormControl>
                                    <FormMessage class="text-sm text-red-600 mt-1" />
                                </FormItem>
                            </FormField>

                            <!-- Description Field -->
                            <FormField v-slot="{ componentField }" name="description">
                                <FormItem>
                                    <FormLabel
                                        class="block text-sm font-semibold text-gray-900 mb-2"
                                    >
                                        Description (Optional)
                                    </FormLabel>
                                    <FormControl>
                                        <div class="relative">
                                            <Input
                                                placeholder="Enter description..."
                                                v-bind="componentField"
                                                class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                                            />
                                            <div
                                                class="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                <svg
                                                    class="w-5 h-5 text-gray-400"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M4 6h16M4 12h16M4 18h7"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    </FormControl>
                                    <FormMessage class="text-sm text-red-600 mt-1" />
                                </FormItem>
                            </FormField>
                        </div>

                        <!-- Policy Type Section -->
                        <div class="border-t border-gray-100 pt-8">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <svg
                                    class="w-5 h-5 text-green-600 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                Policy Type
                            </h3>
                            <FormField v-slot="{ componentField }" name="type">
                                <FormItem>
                                    <FormLabel
                                        class="block text-sm font-semibold text-gray-900 mb-2"
                                    >
                                        Select Policy Type
                                        <span class="text-red-500">*</span>
                                    </FormLabel>
                                    <Select v-bind="componentField">
                                        <FormControl>
                                            <SelectTrigger
                                                class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                                            >
                                                <SelectValue placeholder="Select a policy type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem
                                                    :value="LicensePolicyType.WHITELIST"
                                                    class="hover:bg-green-50"
                                                >
                                                    <div class="flex items-center">
                                                        <svg
                                                            class="w-4 h-4 text-green-600 mr-2"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                stroke-linecap="round"
                                                                stroke-linejoin="round"
                                                                stroke-width="2"
                                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                        {{ LicensePolicyType.WHITELIST }}
                                                    </div>
                                                </SelectItem>
                                                <SelectItem
                                                    :value="LicensePolicyType.BLACKLIST"
                                                    class="hover:bg-red-50"
                                                >
                                                    <div class="flex items-center">
                                                        <svg
                                                            class="w-4 h-4 text-red-600 mr-2"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                stroke-linecap="round"
                                                                stroke-linejoin="round"
                                                                stroke-width="2"
                                                                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                        {{ LicensePolicyType.BLACKLIST }}
                                                    </div>
                                                </SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage class="text-sm text-red-600 mt-1" />
                                </FormItem>
                            </FormField>
                        </div>

                        <!-- Default Policy Section -->
                        <div class="border-t border-gray-100 pt-8">
                            <FormField
                                v-slot="{ value, handleChange }"
                                type="checkbox"
                                name="isDefault"
                            >
                                <FormItem
                                    class="flex flex-row items-start gap-x-4 space-y-0 rounded-lg border border-gray-200 bg-gray-50 p-6 hover:bg-gray-100 transition-colors duration-200"
                                >
                                    <FormControl>
                                        <Checkbox
                                            :model-value="value"
                                            class="mt-1"
                                            @update:model-value="handleChange"
                                        />
                                    </FormControl>
                                    <div class="space-y-2 leading-none">
                                        <FormLabel class="text-base font-semibold text-gray-900">
                                            Make this the default policy
                                        </FormLabel>
                                        <p class="text-sm text-gray-600">
                                            When enabled, this policy will be automatically applied
                                            to new projects in your organization.
                                        </p>
                                        <FormMessage />
                                    </div>
                                </FormItem>
                            </FormField>
                        </div>

                        <!-- License Selection Section -->
                        <div class="border-t border-gray-100 pt-8">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <svg
                                    class="w-5 h-5 text-blue-600 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                License Selection
                            </h3>
                            <FormField v-slot="{ setValue }" type="checkbox" name="licenses">
                                <FormItem>
                                    <FormLabel
                                        class="block text-sm font-semibold text-gray-900 mb-4"
                                    >
                                        Select Applicable Licenses
                                        <span class="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <div
                                            class="border border-gray-200 rounded-lg bg-white overflow-hidden"
                                        >
                                            <DataTable
                                                :columns="columns"
                                                :data="choices"
                                                @update:row-selection="setValue"
                                            />
                                        </div>
                                    </FormControl>
                                    <p class="text-sm text-gray-500 mt-2">
                                        Select the licenses that should be included in this policy.
                                        You can search and filter licenses using the table above.
                                    </p>
                                </FormItem>
                            </FormField>
                        </div>

                        <!-- Submit Button Section -->
                        <div class="border-t border-gray-100 pt-8">
                            <div class="flex justify-end space-x-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    class="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                                    @click="$router.back()"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    class="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                                >
                                    <svg
                                        class="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                        />
                                    </svg>
                                    Create Policy
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Info Cards Section -->
            <div class="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                    class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                    <div
                        class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4"
                    >
                        <svg
                            class="w-6 h-6 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Whitelist Policy</h3>
                    <p class="text-gray-600 text-sm">
                        Only allows projects to use the licenses you specify. All other licenses
                        will be flagged as violations.
                    </p>
                </div>

                <div
                    class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                    <div
                        class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4"
                    >
                        <svg
                            class="w-6 h-6 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Blacklist Policy</h3>
                    <p class="text-gray-600 text-sm">
                        Prohibits the use of specific licenses you select. All other licenses will
                        be considered acceptable.
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

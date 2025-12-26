<script lang="ts" setup>
import InfoCard from '@/base_components/ui/cards/InfoCard.vue';
import {
    isMemberRoleGreaterOrEqualTo,
    MemberRole,
    type Organization
} from '@/codeclarity_components/organizations/organization.entity';
import { LicensePolicyType } from '@/codeclarity_components/organizations/policy/license_policy.entity';
import { LicensePolicyRepository } from '@/codeclarity_components/organizations/policy/license_policy.repository';
import HeaderItem from '@/codeclarity_components/organizations/subcomponents/HeaderItem.vue';
import type { License } from '@/codeclarity_components/results/licenses/License';
import { LicenseRepository } from '@/codeclarity_components/results/licenses/LicenseRepository';
import router from '@/router';
import Alert from '@/shadcn/ui/alert/Alert.vue';
import AlertDescription from '@/shadcn/ui/alert/AlertDescription.vue';
import { Badge } from '@/shadcn/ui/badge';
import Button from '@/shadcn/ui/button/Button.vue';
import Checkbox from '@/shadcn/ui/checkbox/Checkbox.vue';
import { FormField } from '@/shadcn/ui/form';
import FormControl from '@/shadcn/ui/form/FormControl.vue';
import FormItem from '@/shadcn/ui/form/FormItem.vue';
import FormLabel from '@/shadcn/ui/form/FormLabel.vue';
import FormMessage from '@/shadcn/ui/form/FormMessage.vue';
import Input from '@/shadcn/ui/input/Input.vue';
import Select from '@/shadcn/ui/select/Select.vue';
import SelectContent from '@/shadcn/ui/select/SelectContent.vue';
import SelectGroup from '@/shadcn/ui/select/SelectGroup.vue';
import SelectItem from '@/shadcn/ui/select/SelectItem.vue';
import SelectTrigger from '@/shadcn/ui/select/SelectTrigger.vue';
import SelectValue from '@/shadcn/ui/select/SelectValue.vue';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { filterUndefined } from '@/utils/form/filterUndefined';
import { Icon } from '@iconify/vue';
import { toTypedSchema } from '@vee-validate/zod';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import { onBeforeMount, ref, type Ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { z } from 'zod';
import { columns } from './columns';
import DataTable from './DataTable.vue';

const orgId: Ref<string> = ref('');
const orgInfo: Ref<Organization | undefined> = ref();

// Repositories
const licensePolicyRepository: LicensePolicyRepository = new LicensePolicyRepository();
const licenseRepository: LicenseRepository = new LicenseRepository();

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

const { defaultOrg } = storeToRefs(userStore);

const choices: Ref<License[]> = ref([]);
const selectedLicenses: Ref<string[]> = ref([]);

const error: Ref<boolean> = ref(false);
const errorCode: Ref<string> = ref('');

// Form Validation
const formSchema = toTypedSchema(
    z.object({
        name: z
            .string()
            .min(5, 'Name must be at least 5 characters')
            .max(200, 'Name must be less than 200 characters'),
        description: z
            .string()
            .max(200, 'Description must be less than 200 characters')
            .optional()
            .default(''),
        type: z.string().min(1, 'Please select a policy type'),
        isDefault: z.boolean().default(false),
        licenses: z.string().array().min(1, 'Please select at least one license')
    })
);

// Methods
const { handleSubmit, values } = useForm({
    validationSchema: formSchema,
    initialValues: {
        isDefault: false,
        name: '',
        description: '',
        type: '',
        licenses: []
    }
});

// Form validation computed property
const isFormValid = computed(() => {
    return (
        values.name &&
        values.name.length >= 5 &&
        values.type &&
        values.licenses &&
        values.licenses.length > 0
    );
});

function setOrgInfo(_orgInfo: Organization): void {
    orgInfo.value = _orgInfo;
    if (!isMemberRoleGreaterOrEqualTo(_orgInfo.role, MemberRole.ADMIN)) {
        void router.push({ name: 'orgManage', params: { page: '', orgId: _orgInfo.id } });
    }
}

const onSubmit = handleSubmit(async (values): Promise<void> => {
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

async function init(): Promise<void> {
    const route = useRoute();
    const _orgId = route.params.orgId;

    if (!_orgId) {
        router.back();
    }

    if (typeof _orgId === 'string') {
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
    <div class="min-h-screen bg-gray-50">
        <!-- Page Header -->
        <HeaderItem v-if="orgId" :org-id="orgId" @on-org-info="setOrgInfo($event)" />

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Page Header -->
            <InfoCard
                title="License Policy Creation"
                description="Define license compliance rules for your organization to ensure projects use appropriate licenses"
                icon="solar:shield-check-bold"
                variant="primary"
                class="mb-8 shadow-lg"
            />

            <div class="grid lg:grid-cols-2 gap-8">
                <!-- Left Column - Configuration Form -->
                <InfoCard
                    title="Policy Configuration"
                    description="Configure your license policy settings and select applicable licenses"
                    icon="solar:settings-bold"
                    variant="default"
                    class="shadow-md"
                >
                    <Alert v-if="error" variant="destructive" class="mb-6">
                        <AlertDescription class="flex flex-row gap-2 items-center">
                            <Icon icon="solar:danger-triangle-bold" class="text-red-500" />
                            <div v-if="errorCode" class="text-red-700">
                                We encountered an error while processing the request.
                            </div>
                            <div v-else class="text-red-700">
                                An error occurred during the processing of the request.
                            </div>
                        </AlertDescription>
                    </Alert>

                    <form class="space-y-8" @submit="onSubmit">
                        <!-- Basic Information Section -->
                        <div class="space-y-6">
                            <!-- Name Field -->
                            <FormField v-slot="{ componentField }" name="name">
                                <FormItem>
                                    <FormLabel
                                        class="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2"
                                    >
                                        <Icon icon="solar:tag-bold" class="text-theme-primary" />
                                        Policy Name
                                        <span class="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter policy name..."
                                            v-bind="filterUndefined(componentField)"
                                            class="bg-white border-gray-300 focus:border-theme-primary focus:ring-theme-primary/20"
                                        />
                                    </FormControl>
                                    <FormMessage class="text-sm text-red-600 mt-1" />
                                </FormItem>
                            </FormField>

                            <!-- Description Field -->
                            <FormField v-slot="{ componentField }" name="description">
                                <FormItem>
                                    <FormLabel
                                        class="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2"
                                    >
                                        <Icon icon="solar:text-bold" class="text-theme-primary" />
                                        Description (Optional)
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter a brief description of what this policy covers..."
                                            v-bind="filterUndefined(componentField)"
                                            class="bg-white border-gray-300 focus:border-theme-primary focus:ring-theme-primary/20"
                                        />
                                    </FormControl>
                                    <p class="text-xs text-gray-500 mt-1">
                                        Help your team understand the purpose of this policy
                                    </p>
                                    <FormMessage class="text-sm text-red-600 mt-1" />
                                </FormItem>
                            </FormField>

                            <!-- Policy Type Section -->
                            <FormField v-slot="{ componentField }" name="type">
                                <FormItem>
                                    <FormLabel
                                        class="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2"
                                    >
                                        <Icon icon="solar:shield-bold" class="text-theme-primary" />
                                        Policy Type
                                        <span class="text-red-500">*</span>
                                        <Icon
                                            icon="solar:question-circle-bold"
                                            class="text-gray-400 cursor-help"
                                            title="Choose how this policy should enforce license compliance"
                                        />
                                    </FormLabel>
                                    <Select v-bind="filterUndefined(componentField)">
                                        <FormControl>
                                            <SelectTrigger
                                                class="bg-white border-gray-300 focus:border-theme-primary focus:ring-theme-primary/20"
                                            >
                                                <SelectValue
                                                    placeholder="Choose how this policy should work"
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem
                                                    :value="LicensePolicyType.WHITELIST"
                                                    class="hover:bg-green-50"
                                                >
                                                    <div class="flex items-center">
                                                        <Icon
                                                            icon="solar:check-circle-bold"
                                                            class="w-4 h-4 text-green-600 mr-2"
                                                        />
                                                        <div>
                                                            <div class="font-medium">
                                                                {{ LicensePolicyType.WHITELIST }}
                                                            </div>
                                                            <div class="text-xs text-gray-500">
                                                                Only allow selected licenses
                                                            </div>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem
                                                    :value="LicensePolicyType.BLACKLIST"
                                                    class="hover:bg-red-50"
                                                >
                                                    <div class="flex items-center">
                                                        <Icon
                                                            icon="solar:close-circle-bold"
                                                            class="w-4 h-4 text-red-600 mr-2"
                                                        />
                                                        <div>
                                                            <div class="font-medium">
                                                                {{ LicensePolicyType.BLACKLIST }}
                                                            </div>
                                                            <div class="text-xs text-gray-500">
                                                                Block selected licenses
                                                            </div>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage class="text-sm text-red-600 mt-1" />
                                </FormItem>
                            </FormField>

                            <!-- Default Policy Section -->
                            <FormField
                                v-slot="{ value, handleChange }"
                                type="checkbox"
                                name="isDefault"
                            >
                                <FormItem
                                    class="flex flex-row items-start gap-x-4 space-y-0 rounded-lg border border-gray-200 bg-gray-50 p-4 hover:bg-gray-100 transition-colors duration-200"
                                >
                                    <FormControl>
                                        <Checkbox
                                            :model-value="value"
                                            class="mt-1"
                                            @update:model-value="handleChange"
                                        />
                                    </FormControl>
                                    <div class="space-y-2 leading-none">
                                        <FormLabel
                                            class="flex items-center gap-2 text-base font-semibold text-gray-900"
                                        >
                                            <Icon
                                                icon="solar:star-bold"
                                                class="text-theme-primary"
                                            />
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
                        <div class="border-t border-gray-100 pt-6">
                            <FormField v-slot="{ setValue, value }" type="checkbox" name="licenses">
                                <FormItem>
                                    <FormLabel
                                        class="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4"
                                    >
                                        <Icon
                                            icon="solar:document-text-bold"
                                            class="text-theme-primary"
                                        />
                                        License Selection
                                        <span class="text-red-500">*</span>
                                        <Badge
                                            v-if="value?.length"
                                            variant="secondary"
                                            class="ml-2"
                                        >
                                            {{ value.length }} selected
                                        </Badge>
                                    </FormLabel>
                                    <FormControl>
                                        <div
                                            class="border border-gray-200 rounded-lg bg-white overflow-hidden"
                                        >
                                            <DataTable
                                                :columns="columns"
                                                :data="choices"
                                                @update:row-selection="
                                                    (selection: any) => {
                                                        selectedLicenses = Object.keys(selection);
                                                        setValue(Object.keys(selection));
                                                    }
                                                "
                                            />
                                        </div>
                                    </FormControl>
                                    <div class="flex items-start gap-2 mt-2">
                                        <Icon
                                            icon="solar:info-circle-bold"
                                            class="text-blue-500 mt-0.5 flex-shrink-0"
                                        />
                                        <p class="text-sm text-gray-500">
                                            Select the licenses that should be included in this
                                            policy. You can search and filter licenses using the
                                            table above.
                                            <span class="font-medium"
                                                >{{ selectedLicenses.length }} licenses currently
                                                selected.</span
                                            >
                                        </p>
                                    </div>
                                    <FormMessage class="text-sm text-red-600 mt-1" />
                                </FormItem>
                            </FormField>
                        </div>

                        <!-- Submit Button Section -->
                        <div class="border-t border-gray-100 pt-6">
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
                                    :disabled="!isFormValid"
                                    class="px-8 py-3 bg-theme-black hover:bg-theme-gray disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                                >
                                    <Icon icon="solar:shield-check-bold" class="w-5 h-5" />
                                    Create Policy
                                </Button>
                            </div>
                        </div>
                    </form>
                </InfoCard>

                <!-- Right Column - Information -->
                <div class="space-y-6">
                    <InfoCard
                        title="Policy Types"
                        description="Understand the different types of license policies and how they work"
                        icon="solar:info-circle-bold"
                        variant="primary"
                        class="shadow-md"
                    >
                        <div class="space-y-6">
                            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div class="flex items-center gap-3 mb-3">
                                    <div
                                        class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                                    >
                                        <Icon
                                            icon="solar:check-circle-bold"
                                            class="text-white text-sm"
                                        />
                                    </div>
                                    <h4 class="font-semibold text-green-800">Whitelist Policy</h4>
                                </div>
                                <p class="text-sm text-green-700">
                                    Only allows projects to use the licenses you specify. All other
                                    licenses will be flagged as violations.
                                </p>
                                <div class="mt-3 text-xs text-green-600">
                                    <strong>Use when:</strong> You want strict control over which
                                    licenses are allowed
                                </div>
                            </div>

                            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div class="flex items-center gap-3 mb-3">
                                    <div
                                        class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
                                    >
                                        <Icon
                                            icon="solar:close-circle-bold"
                                            class="text-white text-sm"
                                        />
                                    </div>
                                    <h4 class="font-semibold text-red-800">Blacklist Policy</h4>
                                </div>
                                <p class="text-sm text-red-700">
                                    Prohibits the use of specific licenses you select. All other
                                    licenses will be considered acceptable.
                                </p>
                                <div class="mt-3 text-xs text-red-600">
                                    <strong>Use when:</strong> You want to block specific
                                    problematic licenses
                                </div>
                            </div>
                        </div>
                    </InfoCard>

                    <InfoCard
                        title="Form Validation"
                        description="Current form completion status"
                        icon="solar:check-circle-bold"
                        variant="default"
                        class="shadow-md"
                    >
                        <div class="space-y-3">
                            <div
                                class="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                            >
                                <div class="flex items-center gap-2">
                                    <Icon
                                        :icon="
                                            (values.name?.length || 0) >= 5
                                                ? 'solar:check-circle-bold'
                                                : 'solar:close-circle-bold'
                                        "
                                        :class="
                                            (values.name?.length || 0) >= 5
                                                ? 'text-green-500'
                                                : 'text-gray-400'
                                        "
                                    />
                                    <span class="text-sm font-medium">Policy Name</span>
                                </div>
                                <span class="text-xs text-gray-500">
                                    {{ (values.name?.length || 0) >= 5 ? 'Complete' : 'Required' }}
                                </span>
                            </div>
                            <div
                                class="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                            >
                                <div class="flex items-center gap-2">
                                    <Icon
                                        :icon="
                                            values.type
                                                ? 'solar:check-circle-bold'
                                                : 'solar:close-circle-bold'
                                        "
                                        :class="values.type ? 'text-green-500' : 'text-gray-400'"
                                    />
                                    <span class="text-sm font-medium">Policy Type</span>
                                </div>
                                <span class="text-xs text-gray-500">
                                    {{ values.type ? 'Complete' : 'Required' }}
                                </span>
                            </div>
                            <div
                                class="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                            >
                                <div class="flex items-center gap-2">
                                    <Icon
                                        :icon="
                                            (values.licenses?.length || 0) > 0
                                                ? 'solar:check-circle-bold'
                                                : 'solar:close-circle-bold'
                                        "
                                        :class="
                                            (values.licenses?.length || 0) > 0
                                                ? 'text-green-500'
                                                : 'text-gray-400'
                                        "
                                    />
                                    <span class="text-sm font-medium">License Selection</span>
                                </div>
                                <span class="text-xs text-gray-500">
                                    {{ values.licenses?.length || 0 }} selected
                                </span>
                            </div>
                            <div
                                class="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                            >
                                <div class="flex items-center gap-2">
                                    <Icon
                                        :icon="
                                            (values.description?.length || 0) > 0
                                                ? 'solar:check-circle-bold'
                                                : 'solar:info-circle-bold'
                                        "
                                        :class="
                                            (values.description?.length || 0) > 0
                                                ? 'text-green-500'
                                                : 'text-blue-500'
                                        "
                                    />
                                    <span class="text-sm font-medium">Description</span>
                                </div>
                                <span class="text-xs text-gray-500">
                                    {{
                                        (values.description?.length || 0) > 0
                                            ? 'Complete'
                                            : 'Optional'
                                    }}
                                </span>
                            </div>
                        </div>
                    </InfoCard>

                    <InfoCard
                        title="Best Practices"
                        description="Tips for creating effective license policies"
                        icon="solar:lightbulb-bold"
                        variant="default"
                        class="shadow-md"
                    >
                        <div class="space-y-4">
                            <div class="flex items-start gap-3">
                                <div
                                    class="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                                >
                                    <Icon icon="solar:check-bold" class="text-white text-xs" />
                                </div>
                                <div>
                                    <h5 class="font-medium text-gray-900 mb-1">
                                        Start with common licenses
                                    </h5>
                                    <p class="text-sm text-gray-600">
                                        Include widely-used licenses like MIT, Apache 2.0, and BSD
                                    </p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <div
                                    class="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                                >
                                    <Icon icon="solar:check-bold" class="text-white text-xs" />
                                </div>
                                <div>
                                    <h5 class="font-medium text-gray-900 mb-1">Review regularly</h5>
                                    <p class="text-sm text-gray-600">
                                        Update your policies as your organization's needs evolve
                                    </p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <div
                                    class="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                                >
                                    <Icon icon="solar:check-bold" class="text-white text-xs" />
                                </div>
                                <div>
                                    <h5 class="font-medium text-gray-900 mb-1">
                                        Consider compatibility
                                    </h5>
                                    <p class="text-sm text-gray-600">
                                        Ensure selected licenses are compatible with your project
                                        goals
                                    </p>
                                </div>
                            </div>
                        </div>
                    </InfoCard>
                </div>
            </div>
        </div>
    </div>
</template>

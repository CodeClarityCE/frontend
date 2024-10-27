<script lang="ts" setup>
import {
    isMemberRoleGreaterOrEqualTo,
    MemberRole,
    Organization
} from '@/repositories/types/entities/Organization';
import router from '@/router';
import { onBeforeMount, ref, type Ref } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import OrgHeaderItem from '@/views/org/subcomponents/OrgHeaderItem.vue';
import { useForm } from 'vee-validate';
import { storeToRefs } from 'pinia';
import { LicensePolicyRepository } from '@/repositories/LicensePolicyRepository';
import { LicenseRepository } from '@/repositories/LicenseRepository';
import { LicensePolicyType } from '@/repositories/types/entities/LicensePolicy';
import { BusinessLogicError } from '@/repositories/BaseRepository';
import type { License } from '@/repositories/types/entities/License';
import FormItem from '@/shadcn/ui/form/FormItem.vue';
import FormLabel from '@/shadcn/ui/form/FormLabel.vue';
import FormControl from '@/shadcn/ui/form/FormControl.vue';
import FormDescription from '@/shadcn/ui/form/FormDescription.vue';
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
        type: z.string(),
        description: z.string().min(10).max(200),
        isDefault: z.boolean(),
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
const form = useForm({
    validationSchema: formSchema
});

const onSubmit = form.handleSubmit(async (values) => {
    console.log('Form submitted!', values);
    try {
        await licensePolicyRepository.createPolicy({
            orgId: defaultOrg!.value!.id,
            data: {
                name: values.name,
                description: values.description,
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
    <div class="flex flex-col gap-8 w-full mb-2">
        <OrgHeaderItem
            v-if="orgId"
            :org-id="orgId"
            @on-org-info="setOrgInfo($event)"
        ></OrgHeaderItem>
        <div class="p-12">
            <form class="grid grid-cols-4 gap-2" @submit="onSubmit">
                <FormField name="name" v-slot="{ componentField }">
                    <FormItem class="col-start-2 col-end-3">
                        <FormLabel>Enter a name</FormLabel>
                        <FormControl>
                            <!-- any Form Input component or native input elements -->
                            <Input placeholder="Enter a name" v-bind="componentField"></Input>
                        </FormControl>
                        <FormDescription />
                        <FormMessage />
                    </FormItem>
                </FormField>

                <FormField
                    class="col-start-3 col-end-4"
                    name="description"
                    v-slot="{ componentField }"
                >
                    <FormItem>
                        <FormLabel>Enter a description</FormLabel>
                        <FormControl>
                            <!-- any Form Input component or native input elements -->
                            <Input
                                placeholder="Enter a description"
                                v-bind="componentField"
                            ></Input>
                        </FormControl>
                        <FormDescription />
                        <FormMessage />
                    </FormItem>
                </FormField>

                <FormField name="type" v-slot="{ componentField }">
                    <FormItem class="col-start-2 col-end-4">
                        <FormLabel>Select a type</FormLabel>
                        <Select v-bind="componentField">
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a type" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem :value="LicensePolicyType.WHITELIST">
                                        {{ LicensePolicyType.WHITELIST }}
                                    </SelectItem>
                                    <SelectItem :value="LicensePolicyType.BLACKLIST">
                                        {{ LicensePolicyType.BLACKLIST }}
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <FormDescription />
                        <FormMessage />
                    </FormItem>
                </FormField>

                <FormField v-slot="{ value, handleChange }" type="checkbox" name="isDefault">
                    <FormItem
                        class="flex flex-row items-start gap-x-3 space-y-0 rounded-md border p-4 col-start-2 col-end-4"
                    >
                        <FormControl>
                            <Checkbox :checked="value" @update:checked="handleChange" />
                        </FormControl>
                        <div class="space-y-1 leading-none">
                            <FormLabel>Make this the default policy</FormLabel>
                            <FormMessage />
                        </div>
                    </FormItem>
                </FormField>

                <!-- <FormField v-slot="{ value, handleChange }" type="checkbox" name="isDefault"> -->
                <FormField v-slot="{ setValue }" type="checkbox" name="licenses">
                    <FormItem class="col-start-2 col-end-4">
                        <FormLabel>Select licenses</FormLabel>
                        <FormControl>
                            <DataTable
                                :columns="columns"
                                :data="choices"
                                @update:rowSelection="setValue"
                            />
                        </FormControl>
                    </FormItem>
                </FormField>

                <Button class="col-start-2 col-end-4" type="submit"> Create </Button>
            </form>
        </div>
    </div>
</template>

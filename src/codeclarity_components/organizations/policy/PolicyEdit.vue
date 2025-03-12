<script lang="ts" setup>
import {
    isMemberRoleGreaterOrEqualTo,
    MemberRole,
    Organization
} from '@/codeclarity_components/organizations/organization.entity';
import router from '@/router';
import { ref, type Ref } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import HeaderItem from '@/codeclarity_components/organizations/subcomponents/HeaderItem.vue';
import { Form } from 'vee-validate';
import * as yup from 'yup';
import LoadingSubmitButton from '@/base_components/LoadingSubmitButton.vue';
import { storeToRefs } from 'pinia';
import FormTextField from '@/base_components/forms/FormTextField.vue';
import { LicensePolicyRepository } from '@/codeclarity_components/organizations/policy/LicensePolicyRepository';
import { LicensePolicyType } from '@/codeclarity_components/organizations/policy/LicensePolicy';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import FormInlineCheckboxField from '@/base_components/forms/FormInlineCheckboxField.vue';
import FormSelectField from '@/base_components/forms/FormSelectField.vue';

const orgId: Ref<string> = ref('');
const orgInfo: Ref<Organization | undefined> = ref();

// Repositories
const licensePolicyRepository: LicensePolicyRepository = new LicensePolicyRepository();

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

const { defaultOrg } = storeToRefs(userStore);
// Form Data
const name: Ref<string> = ref('');
const description: Ref<string> = ref('');
const type: Ref<Array<string>> = ref(['']);
const licenses: Ref<Array<string>> = ref(['']);
const isDefault: Ref<boolean> = ref(false);
const policy_id: Ref<string> = ref('');

const error: Ref<boolean> = ref(false);
const errorCode: Ref<string> = ref('');

// Form Validation
const formValidationSchema = yup.object({
    name: yup.string().required('Please enter a name').min(5),
    type: yup.array().of(yup.string()).min(1).max(1),
    description: yup.string().required('Please enter a description').min(10),
    licenses: yup.array().of(yup.string()).min(1)
});

function setOrgInfo(_orgInfo: Organization) {
    orgInfo.value = _orgInfo;
    if (!isMemberRoleGreaterOrEqualTo(_orgInfo.role, MemberRole.ADMIN)) {
        router.push({ name: 'orgManage', params: { page: '', orgId: _orgInfo.id } });
    }
}

// Methods
async function submit() {
    try {
        await licensePolicyRepository.updatePolicy({
            orgId: defaultOrg!.value!.id,
            policyId: policy_id.value,
            data: {
                name: name.value,
                description: description.value,
                type: type.value[0] as LicensePolicyType,
                licenses: licenses.value,
                default: isDefault.value
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
}

async function init() {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;
    policy_id.value = searchParams.get('policyId') ?? '';

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

    // TODO: Fetch policy data
}

init();
</script>
<template>
    <div class="flex flex-col gap-8 w-full mb-2">
        <HeaderItem v-if="orgId" :org-id="orgId" @on-org-info="setOrgInfo($event)"></HeaderItem>
        <div class="p-12">
            <Form class="flex flex-col gap-6" :validation-schema="formValidationSchema" @submit="submit">
                <FormTextField v-model="name" :placeholder="'Enter a name'" :type="'text'" :name="'name'">
                    <template #name>Name</template>
                </FormTextField>

                <FormTextField v-model="description" :placeholder="'Enter a description'" :type="'text'"
                    :name="'description'">
                    <template #name>Description</template>
                </FormTextField>

                <FormSelectField v-model:data="type" :placeholder="'Select at type'" :name="'type'"
                    :choices="[LicensePolicyType.WHITELIST, LicensePolicyType.BLACKLIST]">
                    <template #name>Type</template>
                </FormSelectField>

                <FormSelectField v-model:data="licenses" :placeholder="'Select at least one license'" :name="'licenses'"
                    :choices="['MIT', 'GPL', 'Apache', 'BSD']">
                    <template #name>Licenses</template>
                </FormSelectField>

                <FormInlineCheckboxField v-model:value="isDefault" :name="'isDefault'">
                    <template #name>Default</template>
                </FormInlineCheckboxField>

                <LoadingSubmitButton ref="loadingButtonRef">
                    <span>Create</span>
                </LoadingSubmitButton>
            </Form>
        </div>
    </div>
</template>

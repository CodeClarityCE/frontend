<script lang="ts" setup>
import { Form, ErrorMessage } from 'vee-validate';
import * as yup from 'yup';
import { ref, type Ref } from 'vue';
import LoadingSubmitButton from '@/common_components/LoadingSubmitButton.vue';
import { Icon } from '@iconify/vue';
import { OrgRepository } from '@/repositories/OrganizationRepository';
import { BusinessLogicError, ValidationError } from '@/repositories/BaseRepository';
import { APIErrors } from '@/repositories/types/errors/ApiErrors';
import { UserRepository } from '@/repositories/UserRepository';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { errorToast, successToast } from '@/utils/toasts';
import FormTextField from '@/common_components/forms/FormTextField.vue';
import InfoBoxRed from '@/common_components/info_box/InfoBoxRed.vue';

const authStore = useAuthStore();
const userStore = useUserStore();
const loadingButtonRef: any = ref();
const errorCode: Ref<string> = ref('');
const name: Ref<string> = ref('');
const description: Ref<string> = ref('');
const colorScheme: Ref<string> = ref('1');
const orgRepo: OrgRepository = new OrgRepository();
const userRepo: UserRepository = new UserRepository();
const validationError = ref();
const setDefault = ref(false);

async function submit(_: any, { resetForm }: { resetForm: any }) {
    loadingButtonRef.value.setLoading(true);
    loadingButtonRef.value.setDisabled(true);
    let resp = null;
    validationError.value = undefined;

    try {
        resp = await orgRepo.create({
            bearerToken: authStore.token!,
            data: {
                name: name.value,
                description: description.value,
                color_scheme: colorScheme.value
            },
            handleBusinessErrors: true
        });

        successToast('Successfully created the org');
    } catch (error) {
        if (error instanceof ValidationError) {
            errorCode.value = error.error_code;
            validationError.value = error;
        } else if (error instanceof BusinessLogicError) {
            errorCode.value = error.error_code;
        }
    } finally {
        loadingButtonRef.value.setLoading(false);
        loadingButtonRef.value.setDisabled(false);
    }

    if (resp != null && setDefault.value == true) {
        try {
            await userRepo.setDefaultOrg({
                bearerToken: authStore.token!,
                userId: userStore.getUser!.id,
                data: {
                    default_org: resp.id
                },
                handleBusinessErrors: true
            });
            try {
                const org = await orgRepo.get({
                    bearerToken: authStore.token!,
                    orgId: resp.id,
                    handleBusinessErrors: true
                });
                userStore.setDefaultOrg(org);
            } catch (error) {
                console.error(error);
            }
        } catch (error) {
            errorToast(
                'Failed to set org as default. You can manually set as default in the organization view.'
            );
        }
    }

    if (resp) {
        setDefault.value = false;
        resetForm();
    }
}

const formValidationSchema = yup.object({
    name: yup.string().required('A name is required').min(1, 'Too short').max(50, 'Too long'),
    description: yup
        .string()
        .required('A description is required')
        .min(1, 'Too short')
        .max(250, 'Too long')
});
</script>
<template>
    <div class="flex flex-col justify-center items-center mt-20">
        <div class="max-w-screen-sm">
            <div class="text-grayTitle text-4xl font-medium mb-2">Create an organization</div>
            <div class="text-gray-600 font-medium mb-2">
                Creating an organization allows you to collaborate with other people.
            </div>

            <InfoBoxRed v-if="errorCode">
                <template #content>
                    <div
                        style="
                            display: flex;
                            flex-direction: row;
                            align-items: center;
                            column-gap: 0.5rem;
                        "
                    >
                        <Icon icon="material-symbols:error-outline" />
                        <div>
                            <div v-if="errorCode == APIErrors.InternalError">
                                Encountered an error while creating the org. Please refresh the page
                                and try again, and if the error persists contact our webmaster.
                            </div>
                            <div
                                v-if="errorCode == APIErrors.ValidationFailed"
                                style="white-space: break-spaces"
                            >
                                <!-- Note: this should never happen unless our client and server side validation are out of sync -->
                                {{ validationError.toMessage('Invalid form:') }}
                            </div>
                        </div>
                    </div>
                </template>
            </InfoBoxRed>

            <Form
                class="flex flex-col gap-8 mt-4 org-create-form"
                :validation-schema="formValidationSchema"
                @submit="submit"
            >
                <FormTextField
                    v-model="name"
                    :placeholder="'Enter a name for the organization'"
                    :type="'text'"
                    :name="'name'"
                >
                    <template #name>Name</template>
                </FormTextField>
                <FormTextField
                    v-model="description"
                    :placeholder="'Enter a description for the organization'"
                    :type="'text'"
                    :name="'description'"
                >
                    <template #name>Description</template>
                </FormTextField>

                <div>
                    <label>Select a color scheme for the organization:</label>
                    <div class="flex gap-2 flex-wrap">
                        <div class="relative">
                            <div
                                class="org-color-scheme org-color-scheme-1"
                                @click="colorScheme = '1'"
                            ></div>
                            <div
                                class="absolute -top-1 -right-1 z-10 text-white font-bold bg-white w-5 h-5 rounded-full border-2 border-primary"
                                v-if="colorScheme == '1'"
                            >
                                <Icon
                                    class="z-20 text-primary absolute right-px top-px"
                                    icon="fluent:checkmark-12-filled"
                                ></Icon>
                            </div>
                        </div>
                        <div class="relative">
                            <div
                                class="org-color-scheme org-color-scheme-2"
                                @click="colorScheme = '2'"
                            ></div>
                            <div
                                class="absolute -top-1 -right-1 z-10 text-white font-bold bg-white w-5 h-5 rounded-full border-2 border-primary"
                                v-if="colorScheme == '2'"
                            >
                                <Icon
                                    class="z-20 text-primary absolute right-px top-px"
                                    icon="fluent:checkmark-12-filled"
                                ></Icon>
                            </div>
                        </div>
                        <div class="relative">
                            <div
                                class="org-color-scheme org-color-scheme-3"
                                @click="colorScheme = '3'"
                            ></div>
                            <div
                                class="absolute -top-1 -right-1 z-10 text-white font-bold bg-white w-5 h-5 rounded-full border-2 border-primary"
                                v-if="colorScheme == '3'"
                            >
                                <Icon
                                    class="z-20 text-primary absolute right-px top-px"
                                    icon="fluent:checkmark-12-filled"
                                ></Icon>
                            </div>
                        </div>
                        <div class="relative">
                            <div
                                class="org-color-scheme org-color-scheme-4"
                                @click="colorScheme = '4'"
                            ></div>
                            <div
                                class="absolute -top-1 -right-1 z-10 text-white font-bold bg-white w-5 h-5 rounded-full border-2 border-primary"
                                v-if="colorScheme == '4'"
                            >
                                <Icon
                                    class="z-20 text-primary absolute right-px top-px"
                                    icon="fluent:checkmark-12-filled"
                                ></Icon>
                            </div>
                        </div>
                        <div class="relative">
                            <div
                                class="org-color-scheme org-color-scheme-5"
                                @click="colorScheme = '5'"
                            ></div>
                            <div
                                class="absolute -top-1 -right-1 z-10 text-white font-bold bg-white w-5 h-5 rounded-full border-2 border-primary"
                                v-if="colorScheme == '5'"
                            >
                                <Icon
                                    class="z-20 text-primary absolute right-px top-px"
                                    icon="fluent:checkmark-12-filled"
                                ></Icon>
                            </div>
                        </div>
                        <div class="relative">
                            <div
                                class="org-color-scheme org-color-scheme-6"
                                @click="colorScheme = '6'"
                            ></div>
                            <div
                                class="absolute -top-1 -right-1 z-10 text-white font-bold bg-white w-5 h-5 rounded-full border-2 border-primary"
                                v-if="colorScheme == '6'"
                            >
                                <Icon
                                    class="z-20 text-primary absolute right-px top-px"
                                    icon="fluent:checkmark-12-filled"
                                ></Icon>
                            </div>
                        </div>
                        <div class="relative">
                            <div
                                class="org-color-scheme org-color-scheme-7"
                                @click="colorScheme = '7'"
                            ></div>
                            <div
                                class="absolute -top-1 -right-1 z-10 text-white font-bold bg-white w-5 h-5 rounded-full border-2 border-primary"
                                v-if="colorScheme == '7'"
                            >
                                <Icon
                                    class="z-20 text-primary absolute right-px top-px"
                                    icon="fluent:checkmark-12-filled"
                                ></Icon>
                            </div>
                        </div>
                        <div class="relative">
                            <div
                                class="org-color-scheme org-color-scheme-8"
                                @click="colorScheme = '8'"
                            ></div>
                            <div
                                class="absolute -top-1 -right-1 z-10 text-white font-bold bg-white w-5 h-5 rounded-full border-2 border-primary"
                                v-if="colorScheme == '8'"
                            >
                                <Icon
                                    class="z-20 text-primary absolute right-px top-px"
                                    icon="fluent:checkmark-12-filled"
                                ></Icon>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <div class="flex flex-row items-center gap-2">
                        <div>Set as default org</div>
                        <input type="checkbox" name="default_org" v-model="setDefault" />
                    </div>
                    <ErrorMessage
                        class="text-destructive font-medium mt-1 block"
                        name="default_org"
                    />
                </div>

                <LoadingSubmitButton ref="loadingButtonRef">
                    <span>Create</span>
                </LoadingSubmitButton>
            </Form>
        </div>
    </div>
</template>
<style scoped>
.org-color-scheme {
    border-radius: 5px;
    width: 35px;
    height: 35px;
    display: flex;
    justify-content: center;
    align-items: center;
}
.org-color-scheme-1 {
    background: rgb(2, 0, 36) !important;
    background: linear-gradient(
        129deg,
        rgb(2, 0, 36) 0%,
        rgb(1, 132, 132) 53%,
        rgb(0, 212, 255) 100%
    ) !important;
}

.org-color-scheme-2 {
    background: rgb(2, 0, 36) !important;
    background: linear-gradient(
        129deg,
        rgb(2, 0, 36) 0%,
        rgb(1, 132, 52) 53%,
        rgb(0, 255, 100) 100%
    ) !important;
}

.org-color-scheme-3 {
    background: rgb(2, 0, 36) !important;
    background: linear-gradient(
        129deg,
        rgb(2, 0, 36) 0%,
        rgb(97, 132, 1) 53%,
        rgb(247, 255, 0) 100%
    ) !important;
}

.org-color-scheme-4 {
    background: rgb(2, 0, 36) !important;
    background: linear-gradient(
        129deg,
        rgb(2, 0, 36) 0%,
        rgb(132, 38, 1) 53%,
        rgb(255, 167, 0) 100%
    ) !important;
}

.org-color-scheme-5 {
    background: rgb(2, 0, 36) !important;
    background: linear-gradient(
        129deg,
        rgb(2, 0, 36) 0%,
        rgb(132, 1, 1) 53%,
        rgb(255, 0, 0) 100%
    ) !important;
}

.org-color-scheme-6 {
    background: rgb(2, 0, 36) !important;
    background: linear-gradient(
        129deg,
        rgb(2, 0, 36) 0%,
        rgb(1, 40, 132) 53%,
        rgb(0, 88, 255) 100%
    ) !important;
}

.org-color-scheme-7 {
    background: rgb(2, 0, 36) !important;
    background: linear-gradient(
        129deg,
        rgb(2, 0, 36) 0%,
        rgb(73, 1, 132) 53%,
        rgb(187, 0, 255) 100%
    ) !important;
}

.org-color-scheme-8 {
    background: rgb(2, 0, 36) !important;
    background: linear-gradient(
        129deg,
        rgb(2, 0, 36) 0%,
        rgb(132, 1, 105) 53%,
        rgb(255, 0, 227) 100%
    ) !important;
}
</style>

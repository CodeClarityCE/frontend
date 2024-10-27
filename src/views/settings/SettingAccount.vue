<template>
    <!-- Header -->
    <TitleAndSubtitle>
        <template #title>Settings</template>
        <template #subtitle>Account</template>
        <template #description
            >Update your personal information, update your password or delete your
            account.</template
        >
    </TitleAndSubtitle>

    <div class="grid grid-cols-3 gap-8 mt-10">
        <!-- Personal information -->
        <div class="flex flex-col gap-4">
            <div class="text-2xl text-muted-foreground">Update your personal information</div>
            <Form :validation-schema="formSchema" @submit="onSubmit">
                <FormField v-slot="{ componentField }" name="first_name">
                    <FormItem v-auto-animate>
                        <FormLabel>First Name: {{ userInfo.first_name }}</FormLabel>
                        <FormControl>
                            <Input
                                type="text"
                                placeholder="Enter your first name"
                                v-bind="componentField"
                            />
                        </FormControl>
                        <!-- <FormDescription>
                        This is your public display name.
                        </FormDescription> -->
                        <FormMessage />
                    </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="last_name">
                    <FormItem v-auto-animate>
                        <FormLabel>Last Name: {{ userInfo.last_name }}</FormLabel>
                        <FormControl>
                            <Input
                                type="text"
                                placeholder="Enter your last name"
                                v-bind="componentField"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </FormField>
                <Button type="submit" class="mt-4"> Update </Button>
            </Form>
        </div>

        <!-- Update Password -->
        <div class="flex flex-col gap-4">
            <div class="text-2xl text-muted-foreground">Update your password</div>
            <Form :validation-schema="passwordSchema" @submit="onPasswordSubmit">
                <FormField v-slot="{ componentField }" name="old_password">
                    <FormItem v-auto-animate>
                        <FormLabel>Old password</FormLabel>
                        <FormControl>
                            <Input
                                type="password"
                                placeholder="Enter your old password"
                                v-bind="componentField"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="password">
                    <FormItem v-auto-animate>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                            <Input
                                type="password"
                                placeholder="Enter your new password"
                                v-bind="componentField"
                            />
                        </FormControl>
                        <FormDescription> Please use a strong password. </FormDescription>
                        <FormMessage />
                    </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="password_confirmation">
                    <FormItem v-auto-animate>
                        <FormLabel>Password confirmation</FormLabel>
                        <FormControl>
                            <Input
                                type="password"
                                placeholder="Confirm your new password"
                                v-bind="componentField"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </FormField>
                <Button type="submit" class="mt-4"> Update Password </Button>
            </Form>
        </div>

        <!-- Delete Account -->
        <div class="flex flex-col gap-4">
            <div class="text-2xl text-muted-foreground">Delete your account</div>
            <div class="text-lg text-destructive px-4">
                Beware, deleting your account will delete all associated information as well, such
                as uploaded projects, analyses results, organizations and license policies.
            </div>
            <InfoBoxRed>
                <template #content>
                    <div>
                        Delete your account by clicking the button below. This action is
                        <u>not reversible</u>.
                    </div>
                    <Dialog>
                        <DialogTrigger as-child>
                            <Button variant="destructive"> Delete Profile </Button>
                        </DialogTrigger>
                        <DialogContent class="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Delete profile</DialogTitle>
                                <DialogDescription>
                                    Enter your password to confirm the deletion of your account.
                                </DialogDescription>
                            </DialogHeader>
                            <div class="grid gap-4 py-4">
                                <Form
                                    :validation-schema="onPasswordDeletionSubmit"
                                    @submit="onPasswordDeletionSubmit"
                                >
                                    <FormField v-slot="{ componentField }" name="password_deletion">
                                        <FormItem v-auto-animate>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="Enter your password"
                                                    v-bind="componentField"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    </FormField>
                                    <DialogFooter class="mt-4">
                                        <Button variant="destructive" type="submit">
                                            Delete my account
                                        </Button>
                                    </DialogFooter>
                                </Form>
                            </div>
                        </DialogContent>
                    </Dialog>
                </template>
            </InfoBoxRed>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { type Ref, ref } from 'vue';
import router from '@/router';
import { UserRepository } from '@/repositories/UserRepository';
import { BusinessLogicError } from '@/repositories/BaseRepository';

import { AuthenticatedUser } from '@/repositories/types/entities/AuthenticatedUser';

import { useStateStore } from '@/stores/state';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import TitleAndSubtitle from '@/common_components/headers/TitleAndSubtitle.vue';

import InfoBoxRed from '@/common_components/info_box/InfoBoxRed.vue';

const state = useStateStore();
const userStore = useUserStore();
const authStore = useAuthStore();
state.menu = 'settingsAccount';

import { onMounted } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { vAutoAnimate } from '@formkit/auto-animate/vue';

import { Button } from '@/shadcn/ui/button';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/shadcn/ui/form';
import { Input } from '@/shadcn/ui/input';
import { toast } from '@/shadcn/ui/toast';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/shadcn/ui/dialog';

const formSchema = toTypedSchema(
    z.object({
        first_name: z.string().min(2).max(25),
        last_name: z.string().min(2).max(25)
    })
);

const passwordSchema = toTypedSchema(
    z.object({
        old_password: z.string().min(10).max(75),
        password: z.string().min(10).max(75),
        password_confirmation: z.string().min(2).max(25)
        //   .test('passwords-match', 'Passwords must match', function (value) {
        //             return this.parent.new_password === value;
        //         }),
    })
);

const deletionSchema = toTypedSchema(
    z.object({
        password_deletion: z.string().min(10).max(75)
    })
);

let { handleSubmit } = useForm({
    validationSchema: formSchema
});

const onSubmit = handleSubmit((values) => {
    updatePersonalInformation(values.first_name, values.last_name);
})(
    ({ handleSubmit } = useForm({
        validationSchema: passwordSchema
    }))
);

const onPasswordSubmit = handleSubmit((values) => {
    updatePassword(values.old_password, values.password, values.password_confirmation);
})(
    ({ handleSubmit } = useForm({
        validationSchema: deletionSchema
    }))
);

const onPasswordDeletionSubmit = handleSubmit((values) => {
    deleteAccount(values.password_deletion);
});

/*****************************************************************************/
/*                                    Data                                   */
/*****************************************************************************/
const userInfo: Ref<AuthenticatedUser> = ref({
    id: 0,
    handle: '',
    first_name: '',
    last_name: ''
});
const errorUserInfo: Ref<boolean> = ref(false);
const errorCodeUserInfo: Ref<string> = ref('');
const reqres: Ref<any> = ref(null);

/*****************************************************************************/
/*                               Repositories                                */
/*****************************************************************************/

const userRepository: UserRepository = new UserRepository();

onMounted(async () => {
    // document.getElementById("loader")!.style.display = "none";
    userInfo.value.handle = userStore.user!.handle;
    userInfo.value.first_name = userStore.user!.first_name;
    userInfo.value.last_name = userStore.user!.last_name;
    userInfo.value.id = userStore.user!.id;
});

/*****************************************************************************/
/*                                  API Calls                                */
/*****************************************************************************/

/**
 * Update password
 */
async function updatePassword(
    password: string,
    new_password: string,
    new_password_confirmation: string
) {
    if (authStore.getAuthenticated && authStore.getToken) {
        try {
            const res = await userRepository.patchPassword({
                userId: userInfo.value.id,
                data: {
                    old_password: password,
                    password: new_password,
                    password_confirmation: new_password_confirmation
                },
                bearerToken: authStore.getToken,
                handleBusinessErrors: true
            });

            reqres.value = res;
        } catch (err) {
            errorUserInfo.value = true;
            if (err instanceof BusinessLogicError) {
                errorCodeUserInfo.value = (err as BusinessLogicError).error_code;
            }
            toast({
                title: 'Error'
            });
            return;
        } finally {
            console.log(reqres.value);
            if (!reqres.value) {
                toast({
                    title: 'Error'
                });
            } else {
                toast({
                    title: 'You successfuly updated your personal information'
                });
                userStore.$reset();
                authStore.$reset();
                router.push('/login');
            }
        }
    }
}

/**
 * Update personal information
 */
async function updatePersonalInformation(first_name: string, last_name: string) {
    if (authStore.getAuthenticated && authStore.getToken) {
        errorUserInfo.value = false;
        errorCodeUserInfo.value = '';
        try {
            const res = await userRepository.patchPersonalInfo({
                userId: userInfo.value.id,
                data: {
                    first_name: first_name,
                    last_name: last_name,
                    handle: userInfo.value.handle
                },
                bearerToken: authStore.getToken,
                handleBusinessErrors: true
            });

            reqres.value = res;
        } catch (err) {
            errorUserInfo.value = true;
            if (err instanceof BusinessLogicError) {
                errorCodeUserInfo.value = (err as BusinessLogicError).error_code;
            }
        } finally {
            userInfo.value.first_name = first_name;
            userInfo.value.last_name = last_name;
            toast({
                title: 'You successfuly updated your personal information'
            });
        }
    }
}

/**
 * Delete account
 */
async function deleteAccount(password: string) {
    if (authStore.getAuthenticated && authStore.getToken) {
        errorUserInfo.value = false;
        errorCodeUserInfo.value = '';
        try {
            const res = await userRepository.deleteUser({
                userId: userInfo.value.id,
                bearerToken: authStore.getToken,
                handleBusinessErrors: true,
                data: {
                    password: password
                }
            });

            reqres.value = res;
        } catch (err) {
            errorUserInfo.value = true;
            if (err instanceof BusinessLogicError) {
                errorCodeUserInfo.value = (err as BusinessLogicError).error_code;
            }
        } finally {
            if (!reqres.value) {
                toast({
                    title: 'Error'
                });
            } else {
                toast({
                    title: 'You successfuly deleted your account'
                });
                userStore.$reset();
                authStore.$reset();
                router.push('/login');
            }
        }
    }
}
</script>

<template>
    <form @submit="onSubmit">
        <FormField v-slot="{ componentField }" name="old_password">
            <FormItem v-auto-animate>
                <FormLabel>Old password</FormLabel>
                <FormControl>
                    <Input type="password" placeholder="Enter your old password" v-bind="componentField" />
                </FormControl>
                <FormMessage />
            </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="password">
            <FormItem v-auto-animate>
                <FormLabel>Password</FormLabel>
                <FormControl>
                    <Input type="password" placeholder="Enter your new password" v-bind="componentField" />
                </FormControl>
                <FormDescription> Please use a strong password. </FormDescription>
                <FormMessage />
            </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="password_confirmation">
            <FormItem v-auto-animate>
                <FormLabel>Password confirmation</FormLabel>
                <FormControl>
                    <Input type="password" placeholder="Confirm your new password" v-bind="componentField" />
                </FormControl>
                <FormMessage />
            </FormItem>
        </FormField>
        <Button type="submit" class="mt-4"> Update Password </Button>
    </form>
</template>
<script lang="ts" setup>
import { BusinessLogicError } from '@/utils/api/BaseRepository';

import { useStateStore } from '@/stores/state';
import { useAuthStore } from '@/stores/auth';

const state = useStateStore();
const authStore = useAuthStore();
state.menu = 'settingsAccount';

import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { vAutoAnimate } from '@formkit/auto-animate/vue';

import { Button } from '@/shadcn/ui/button';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/shadcn/ui/form';
import { Input } from '@/shadcn/ui/input';
import { useUserStore } from '@/stores/user';
import { UserRepository } from '@/codeclarity_components/authentication/user.repository';
import FormDescription from '@/shadcn/ui/form/FormDescription.vue';

const userRepository: UserRepository = new UserRepository();

const userStore = useUserStore();
const user = userStore.user

// UPDATE INFO FORM
const formSchema = toTypedSchema(
    z.object({
        old_password: z.string().min(10).max(75),
        password: z.string().min(10).max(75),
        password_confirmation: z.string().min(2).max(25)
    })
);

const form = useForm({
    validationSchema: formSchema,
})

const onSubmit = form.handleSubmit((values) => {
    updatePassword(values.old_password, values.password, values.password_confirmation);
})

/*****************************************************************************/
/*                                  API Calls                                */
/*****************************************************************************/

async function updatePassword(
    password: string,
    new_password: string,
    new_password_confirmation: string
) {
    if (authStore.getAuthenticated && authStore.getToken) {
        try {
            await userRepository.patchPassword({
                userId: user?.id ?? '',
                data: {
                    old_password: password,
                    password: new_password,
                    password_confirmation: new_password_confirmation
                },
                bearerToken: authStore.getToken,
                handleBusinessErrors: true
            });
        } catch (err) {
            if (err instanceof BusinessLogicError) {
                console.error(err)
            }
        } 
    }
}
</script>

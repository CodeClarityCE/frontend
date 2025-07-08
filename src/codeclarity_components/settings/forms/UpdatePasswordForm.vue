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
    FormMessage,
    FormDescription
} from '@/shadcn/ui/form';
import { Input } from '@/shadcn/ui/input';
import { useUserStore } from '@/stores/user';
import { UserRepository } from '@/codeclarity_components/authentication/user.repository';

const userRepository: UserRepository = new UserRepository();

const userStore = useUserStore();
const user = userStore.user;

// UPDATE INFO FORM
const formSchema = toTypedSchema(
    z.object({
        old_password: z.string().min(10).max(75),
        password: z.string().min(10).max(75),
        password_confirmation: z.string().min(2).max(25)
    })
);

const form = useForm({
    validationSchema: formSchema
});

const onSubmit = form.handleSubmit((values) => {
    updatePassword(values.old_password, values.password, values.password_confirmation);
});

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
                console.error(err);
            }
        }
    }
}
</script>

<template>
    <form class="space-y-6" @submit="onSubmit">
        <FormField v-slot="{ componentField }" name="old_password">
            <FormItem v-auto-animate>
                <FormLabel class="text-sm font-semibold text-theme-black"
                    >Current Password</FormLabel
                >
                <FormControl>
                    <Input
                        type="password"
                        placeholder="Enter your current password"
                        v-bind="componentField"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all duration-200"
                    />
                </FormControl>
                <FormMessage />
            </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="password">
            <FormItem v-auto-animate>
                <FormLabel class="text-sm font-semibold text-theme-black">New Password</FormLabel>
                <FormControl>
                    <Input
                        type="password"
                        placeholder="Enter your new password"
                        v-bind="componentField"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all duration-200"
                    />
                </FormControl>
                <FormDescription class="text-xs text-theme-gray mt-1">
                    Password must be at least 10 characters long and contain a mix of letters,
                    numbers, and symbols.
                </FormDescription>
                <FormMessage />
            </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="password_confirmation">
            <FormItem v-auto-animate>
                <FormLabel class="text-sm font-semibold text-theme-black"
                    >Confirm New Password</FormLabel
                >
                <FormControl>
                    <Input
                        type="password"
                        placeholder="Confirm your new password"
                        v-bind="componentField"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all duration-200"
                    />
                </FormControl>
                <FormMessage />
            </FormItem>
        </FormField>

        <Button
            type="submit"
            class="w-full bg-theme-black hover:bg-theme-gray text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
        >
            Update Password
        </Button>
    </form>
</template>

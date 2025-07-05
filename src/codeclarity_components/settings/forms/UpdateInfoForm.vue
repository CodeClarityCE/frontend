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
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shadcn/ui/form';
import { Input } from '@/shadcn/ui/input';
import { useUserStore } from '@/stores/user';
import { UserRepository } from '@/codeclarity_components/authentication/user.repository';
import router from '@/router';

const userRepository: UserRepository = new UserRepository();

const userStore = useUserStore();
const user = userStore.user;

// UPDATE INFO FORM
const formSchema = toTypedSchema(
    z.object({
        first_name: z.string().min(2).max(25),
        last_name: z.string().min(2).max(25)
    })
);

const form = useForm({
    validationSchema: formSchema
});

const onSubmit = form.handleSubmit((values) => {
    updatePersonalInformation(values.first_name, values.last_name);
});

/*****************************************************************************/
/*                                  API Calls                                */
/*****************************************************************************/

/**
 * Update personal information
 */
async function updatePersonalInformation(first_name: string, last_name: string) {
    if (authStore.getAuthenticated && authStore.getToken) {
        try {
            await userRepository.patchPersonalInfo({
                userId: user?.id ?? '',
                data: {
                    first_name: first_name,
                    last_name: last_name,
                    handle: user?.handle ?? ''
                },
                bearerToken: authStore.getToken,
                handleBusinessErrors: true
            });
            router.go(0);
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
        <FormField v-slot="{ componentField }" name="first_name">
            <FormItem v-auto-animate>
                <FormLabel class="text-sm font-semibold text-gray-700">
                    First Name
                    <span class="text-gray-500 font-normal">(Current: {{ user?.first_name }})</span>
                </FormLabel>
                <FormControl>
                    <Input
                        type="text"
                        placeholder="Enter your first name"
                        v-bind="componentField"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                    />
                </FormControl>
                <FormMessage />
            </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="last_name">
            <FormItem v-auto-animate>
                <FormLabel class="text-sm font-semibold text-gray-700">
                    Last Name
                    <span class="text-gray-500 font-normal">(Current: {{ user?.last_name }})</span>
                </FormLabel>
                <FormControl>
                    <Input
                        type="text"
                        placeholder="Enter your last name"
                        v-bind="componentField"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                    />
                </FormControl>
                <FormMessage />
            </FormItem>
        </FormField>

        <Button
            type="submit"
            class="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
        >
            Update Information
        </Button>
    </form>
</template>

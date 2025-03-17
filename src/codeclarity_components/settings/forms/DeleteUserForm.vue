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
import FormDescription from '@/shadcn/ui/form/FormDescription.vue';
import DialogFooter from '@/shadcn/ui/dialog/DialogFooter.vue';
import { toast } from '@/shadcn/ui/toast';

const userRepository: UserRepository = new UserRepository();

const userStore = useUserStore();
const user = userStore.user;

// UPDATE INFO FORM
const formSchema = toTypedSchema(
    z.object({
        password_deletion: z.string().min(10).max(75)
    })
);

const form = useForm({
    validationSchema: formSchema
});

const onSubmit = form.handleSubmit((values) => {
    deleteAccount(values.password_deletion);
});

/*****************************************************************************/
/*                                  API Calls                                */
/*****************************************************************************/

async function deleteAccount(password: string) {
    if (authStore.getAuthenticated && authStore.getToken) {
        try {
            const res = await userRepository.deleteUser({
                userId: user?.id ?? '',
                bearerToken: authStore.getToken,
                handleBusinessErrors: true,
                data: {
                    password: password
                }
            });
            toast({
                title: 'Password updated'
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
    <form @submit="onSubmit">
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
            <Button variant="destructive" type="submit"> Delete my account </Button>
        </DialogFooter>
    </form>
</template>

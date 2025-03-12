<script setup lang="ts">
import { BusinessLogicError } from '@/utils/api/BaseRepository'
import { OrgRepository } from '../organization.repository'
import { AutoForm } from '@/shadcn/ui/auto-form'
import { Button } from '@/shadcn/ui/button'
import { toast } from '@/shadcn/ui/toast'
import { useAuthStore } from '@/stores/auth'
import { ValidationError } from 'yup'
import * as z from 'zod'


const authStore = useAuthStore();
const orgRepo: OrgRepository = new OrgRepository();

const schema = z.object({
    name: z
        .string({
            required_error: 'A name is required.',
        })
        .min(2, {
            message: 'The name must be at least 2 characters.',
        }),

    description: z
        .string({
            required_error: 'A description is required.',
        })
        .min(2, {
            message: 'The description must be at least 2 characters.',
        }),
})

async function onSubmit(values: Record<string, any>) {
    try {
        await orgRepo.create({
            bearerToken: authStore.getToken ?? '',
            data: {
                name: values.name,
                description: values.description,
                color_scheme: '1'
            },
            handleBusinessErrors: true
        });
        toast({
            title: 'Organization created!'
        })
    } catch (error) {
        if (error instanceof ValidationError) {
            toast({
                title: 'Error during creation',
                description: error.message
            })
        } else if (error instanceof BusinessLogicError) {
            toast({
                title: 'Error during creation',
                description: error.error_message
            })
        }
    }
}
</script>

<template>
    <div class="flex flex-col justify-center items-center mt-20">
        <div class="max-w-screen-sm">
            <div class="text-grayTitle text-4xl font-medium mb-2">Create an organization</div>
            <div class="text-gray-600 font-medium mb-2">
                Creating an organization allows you to collaborate with other people.
            </div>
            <AutoForm class="w-2/3 space-y-6" :schema="schema" @submit="onSubmit">
                <Button type="submit">
                    Submit
                </Button>
            </AutoForm>
        </div>
    </div>
</template>
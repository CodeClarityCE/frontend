<script setup lang="ts">
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { OrgRepository } from '../organization.repository';
import { Button } from '@/shadcn/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shadcn/ui/form';
import { Input } from '@/shadcn/ui/input';
import { Textarea } from '@/shadcn/ui/textarea';
import { toast } from '@/shadcn/ui/toast';
import { useAuthStore } from '@/stores/auth';
import { ValidationError } from 'yup';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
const authStore = useAuthStore();
const orgRepo: OrgRepository = new OrgRepository();
const formSchema = toTypedSchema(
    z.object({
        name: z
            .string({ required_error: 'A name is required.' })
            .min(2, { message: 'The name must be at least 2 characters.' }),
        description: z
            .string({ required_error: 'A description is required.' })
            .min(2, { message: 'The description must be at least 2 characters.' })
    })
);
const form = useForm({ validationSchema: formSchema });
const onSubmit = form.handleSubmit(async (values) => {
    try {
        await orgRepo.create({
            bearerToken: authStore.getToken ?? '',
            data: { name: values.name, description: values.description, color_scheme: '1' },
            handleBusinessErrors: true
        });
        toast({ title: 'Organization created!' });
    } catch (error) {
        if (error instanceof ValidationError) {
            toast({ title: 'Error during creation', description: error.message });
        } else if (error instanceof BusinessLogicError) {
            toast({ title: 'Error during creation', description: error.error_message });
        }
    }
});
</script>
<template>
    <div class="min-h-screen bg-white py-12">
        <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <!-- Header Section -->
            <div class="text-center mb-12">
                <div
                    class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6"
                >
                    <svg
                        class="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                    </svg>
                </div>
                <h1 class="text-4xl font-bold text-gray-900 mb-4">Create an Organization</h1>
                <p class="text-lg text-gray-600 max-w-md mx-auto">
                    Start collaborating with your team by creating a new organization. Manage
                    projects, invite members, and grow together.
                </p>
            </div>
            <!-- Main Form Card -->
            <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <!-- Card Header -->
                <div
                    class="bg-gradient-to-r from-blue-50 to-purple-50 px-8 py-6 border-b border-gray-100"
                >
                    <h2 class="text-xl font-semibold text-gray-900 flex items-center">
                        <svg
                            class="w-5 h-5 text-blue-600 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                        </svg>
                        Organization Details
                    </h2>
                    <p class="text-sm text-gray-600 mt-1">
                        Fill in the information below to create your organization
                    </p>
                </div>
                <!-- Card Content -->
                <div class="px-8 py-8">
                    <form class="space-y-6" @submit="onSubmit">
                        <!-- Name Field -->
                        <FormField v-slot="{ componentField }" name="name">
                            <FormItem>
                                <FormLabel class="block text-sm font-semibold text-gray-900 mb-2">
                                    Organization Name <span class="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                    <div class="relative">
                                        <Input
                                            v-bind="componentField"
                                            type="text"
                                            placeholder="Enter organization name..."
                                            class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                                        />
                                        <div
                                            class="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        >
                                            <svg
                                                class="w-5 h-5 text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </FormControl>
                                <FormMessage class="text-sm text-red-600 mt-1" />
                            </FormItem>
                        </FormField>
                        <!-- Description Field -->
                        <FormField v-slot="{ componentField }" name="description">
                            <FormItem>
                                <FormLabel class="block text-sm font-semibold text-gray-900 mb-2">
                                    Description <span class="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                    <div class="relative">
                                        <Textarea
                                            v-bind="componentField"
                                            rows="4"
                                            placeholder="Describe your organization's purpose and goals..."
                                            class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                                        />
                                        <div class="absolute top-3 right-3">
                                            <svg
                                                class="w-5 h-5 text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M4 6h16M4 12h16M4 18h7"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </FormControl>
                                <FormMessage class="text-sm text-red-600 mt-1" />
                            </FormItem>
                        </FormField>
                        <!-- Submit Button -->
                        <div class="pt-6 border-t border-gray-100">
                            <Button
                                type="submit"
                                class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <svg
                                    class="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                    />
                                </svg>
                                Create Organization
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
            <!-- Benefits Section -->
            <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                    class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                    <div
                        class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4"
                    >
                        <svg
                            class="w-6 h-6 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Team Collaboration</h3>
                    <p class="text-gray-600 text-sm">
                        Invite team members and collaborate on projects together with shared access
                        and permissions.
                    </p>
                </div>
                <div
                    class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                    <div
                        class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4"
                    >
                        <svg
                            class="w-6 h-6 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Project Management</h3>
                    <p class="text-gray-600 text-sm">
                        Organize and manage multiple projects under one organization with
                        centralized oversight.
                    </p>
                </div>
                <div
                    class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                    <div
                        class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4"
                    >
                        <svg
                            class="w-6 h-6 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Enhanced Security</h3>
                    <p class="text-gray-600 text-sm">
                        Benefit from organization-level security settings and access controls for
                        better protection.
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

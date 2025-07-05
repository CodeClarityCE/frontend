<script lang="ts" setup>
import { useStateStore } from '@/stores/state';
import Dialog from '@/shadcn/ui/dialog/Dialog.vue';
import DialogTrigger from '@/shadcn/ui/dialog/DialogTrigger.vue';
import Button from '@/shadcn/ui/button/Button.vue';
import DialogContent from '@/shadcn/ui/dialog/DialogContent.vue';
import DialogHeader from '@/shadcn/ui/dialog/DialogHeader.vue';
import DialogTitle from '@/shadcn/ui/dialog/DialogTitle.vue';
import DialogDescription from '@/shadcn/ui/dialog/DialogDescription.vue';
import UpdateInfoForm from './UpdateInfoForm.vue';
import UpdatePasswordForm from './UpdatePasswordForm.vue';
import DeleteUserForm from './DeleteUserForm.vue';
import { Alert, AlertDescription } from '@/shadcn/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shadcn/ui/card';
import { User, Lock, Trash2, Shield, Info, AlertTriangle } from 'lucide-vue-next';

const state = useStateStore();
state.menu = 'settingsAccount';
</script>

<template>
    <div class="min-h-screen bg-white p-6 md:p-12">
        <!-- Header Section -->
        <div class="mb-12">
            <div
                class="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-8"
            >
                <div class="flex items-center gap-4 mb-4">
                    <div class="p-3 bg-white rounded-xl shadow-sm border border-gray-200">
                        <User class="w-8 h-8 text-gray-700" />
                    </div>
                    <div>
                        <h1 class="text-4xl font-bold text-gray-900 mb-2">Account Settings</h1>
                        <p class="text-gray-600 text-lg">
                            Manage your personal information, security settings, and account
                            preferences
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Settings Cards Grid -->
        <div class="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-2 gap-8">
            <!-- Personal Information Card -->
            <Card
                class="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 bg-white"
            >
                <CardHeader class="pb-6">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                            <User class="w-5 h-5 text-blue-600" />
                        </div>
                        <CardTitle class="text-xl font-semibold text-gray-900"
                            >Personal Information</CardTitle
                        >
                    </div>
                    <CardDescription class="text-gray-600 text-sm leading-relaxed">
                        Update your personal details and profile information
                    </CardDescription>
                </CardHeader>
                <CardContent class="pt-0">
                    <UpdateInfoForm />
                </CardContent>
            </Card>

            <!-- Password Security Card -->
            <Card
                class="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 bg-white"
            >
                <CardHeader class="pb-6">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="p-2.5 bg-green-50 rounded-xl border border-green-100">
                            <Lock class="w-5 h-5 text-green-600" />
                        </div>
                        <CardTitle class="text-xl font-semibold text-gray-900"
                            >Password & Security</CardTitle
                        >
                    </div>
                    <CardDescription class="text-gray-600 text-sm leading-relaxed">
                        Change your password to keep your account secure
                    </CardDescription>
                </CardHeader>
                <CardContent class="pt-0">
                    <UpdatePasswordForm />
                </CardContent>
            </Card>

            <!-- Danger Zone Card -->
            <Card
                class="border border-red-200 shadow-sm hover:shadow-md transition-all duration-300 bg-white xl:col-span-1 lg:col-span-2"
            >
                <CardHeader class="pb-6">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="p-2.5 bg-red-50 rounded-xl border border-red-100">
                            <Trash2 class="w-5 h-5 text-red-600" />
                        </div>
                        <CardTitle class="text-xl font-semibold text-red-800"
                            >Danger Zone</CardTitle
                        >
                    </div>
                    <CardDescription class="text-gray-600 text-sm leading-relaxed">
                        Permanently delete your account and all associated data
                    </CardDescription>
                </CardHeader>
                <CardContent class="pt-0">
                    <Alert variant="destructive" class="mb-6 border-red-200 bg-red-50">
                        <AlertTriangle class="h-4 w-4" />
                        <AlertDescription>
                            <div class="text-sm leading-relaxed text-red-800">
                                Deleting your account will permanently remove all associated
                                information including: uploaded projects, analysis results,
                                organizations, and license policies.
                                <strong class="block mt-2">This action cannot be undone.</strong>
                            </div>
                        </AlertDescription>
                    </Alert>

                    <Dialog>
                        <DialogTrigger as-child>
                            <Button variant="destructive" class="w-full">
                                <Trash2 class="w-4 h-4 mr-2" />
                                Delete Account
                            </Button>
                        </DialogTrigger>
                        <DialogContent class="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle class="flex items-center gap-2 text-red-800">
                                    <Trash2 class="w-5 h-5 text-red-600" />
                                    Delete Account
                                </DialogTitle>
                                <DialogDescription class="text-gray-600">
                                    Enter your password to confirm the deletion of your account.
                                    This action is permanent and cannot be reversed.
                                </DialogDescription>
                            </DialogHeader>
                            <div class="grid gap-4 py-4">
                                <DeleteUserForm />
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
        </div>

        <!-- Security Tips Section -->
        <div class="mt-16">
            <Card class="border border-gray-200 shadow-sm bg-gradient-to-br from-gray-50 to-white">
                <CardHeader class="pb-6">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                            <Shield class="w-5 h-5 text-blue-600" />
                        </div>
                        <CardTitle class="text-xl font-semibold text-gray-900"
                            >Security Best Practices</CardTitle
                        >
                    </div>
                    <CardDescription class="text-gray-600 text-sm">
                        Follow these recommendations to keep your account safe and secure
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div class="flex items-start gap-4">
                            <div
                                class="p-2 bg-blue-50 rounded-lg border border-blue-100 flex-shrink-0"
                            >
                                <Lock class="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <h4 class="font-semibold text-gray-900 mb-2">Strong Passwords</h4>
                                <p class="text-sm text-gray-600 leading-relaxed">
                                    Use at least 10 characters with a mix of letters, numbers, and
                                    symbols.
                                </p>
                            </div>
                        </div>
                        <div class="flex items-start gap-4">
                            <div
                                class="p-2 bg-green-50 rounded-lg border border-green-100 flex-shrink-0"
                            >
                                <Shield class="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                                <h4 class="font-semibold text-gray-900 mb-2">Regular Updates</h4>
                                <p class="text-sm text-gray-600 leading-relaxed">
                                    Change your password regularly and keep your information up to
                                    date.
                                </p>
                            </div>
                        </div>
                        <div class="flex items-start gap-4">
                            <div
                                class="p-2 bg-purple-50 rounded-lg border border-purple-100 flex-shrink-0"
                            >
                                <Info class="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                                <h4 class="font-semibold text-gray-900 mb-2">Stay Informed</h4>
                                <p class="text-sm text-gray-600 leading-relaxed">
                                    Monitor your account activity and report any suspicious
                                    behavior.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
</template>

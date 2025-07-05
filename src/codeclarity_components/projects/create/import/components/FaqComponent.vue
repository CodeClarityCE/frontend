<script lang="ts" setup>
import { Icon } from '@iconify/vue';
</script>
<template>
    <div class="bg-gray-50 rounded-lg p-8 mt-12">
        <div class="text-center mb-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h2>
            <p class="text-gray-600">Common questions about importing repositories</p>
        </div>

        <div class="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            <div
                class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
            >
                <div class="flex items-start gap-3 mb-4">
                    <div class="p-2 bg-blue-100 rounded-lg">
                        <Icon icon="lucide:refresh-cw" class="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 class="font-semibold text-gray-900 text-sm mb-2">
                            I cannot find a recently created repo
                        </h3>
                    </div>
                </div>
                <div class="text-gray-700 text-sm leading-relaxed">
                    We cache repositories for performance. If you can't find a recently created
                    repository, use the <strong>'Force Refresh'</strong> button at the top of the
                    page to update the list.
                </div>
            </div>

            <div
                class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
            >
                <div class="flex items-start gap-3 mb-4">
                    <div class="p-2 bg-red-100 rounded-lg">
                        <Icon icon="lucide:alert-triangle" class="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h3 class="font-semibold text-gray-900 text-sm mb-2">
                            My imports keep failing
                        </h3>
                    </div>
                </div>
                <div class="text-gray-700 text-sm leading-relaxed">
                    Try using the <strong>'Force Refresh'</strong> button first, then attempt to
                    import again. If the problem persists, please contact our support team for
                    assistance.
                </div>
            </div>

            <div
                class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
            >
                <div class="flex items-start gap-3 mb-4">
                    <div class="p-2 bg-yellow-100 rounded-lg">
                        <Icon icon="lucide:eye-off" class="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                        <h3 class="font-semibold text-gray-900 text-sm mb-2">
                            I don't see all of my repositories
                        </h3>
                    </div>
                </div>
                <div class="text-gray-700 text-sm leading-relaxed">
                    We only show repositories that your access token can access and haven't been
                    imported yet. Check your integration permissions or use
                    <strong>'Force Refresh'</strong> to update the list.
                </div>
            </div>
        </div>

        <!-- Additional Help Section -->
        <div class="mt-8 text-center">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <Icon icon="lucide:help-circle" class="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 class="font-semibold text-blue-900 mb-2">Still need help?</h3>
                <p class="text-blue-700 text-sm mb-4">
                    If you're experiencing issues not covered above, our support team is here to
                    help.
                </p>
                <div class="flex gap-3 justify-center">
                    <button
                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                        <Icon icon="lucide:mail" class="w-4 h-4 mr-2 inline" />
                        Contact Support
                    </button>
                    <button
                        class="bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                        <Icon icon="lucide:book-open" class="w-4 h-4 mr-2 inline" />
                        Documentation
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

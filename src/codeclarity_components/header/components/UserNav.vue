<script setup lang="ts">
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import router from '@/router';
import { Avatar, AvatarFallback, AvatarImage } from '@/shadcn/ui/avatar';
import { Button } from '@/shadcn/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger
} from '@/shadcn/ui/dropdown-menu';
import Badge from '@/shadcn/ui/badge/Badge.vue';
import { Icon } from '@iconify/vue';
import Dialog from '@/shadcn/ui/dialog/Dialog.vue';
import DialogTrigger from '@/shadcn/ui/dialog/DialogTrigger.vue';
import DialogContent from '@/shadcn/ui/dialog/DialogContent.vue';
import DialogDescription from '@/shadcn/ui/dialog/DialogDescription.vue';
import DialogFooter from '@/shadcn/ui/dialog/DialogFooter.vue';
import { NotificationRepository } from '@/codeclarity_components/header/notification.repository';
import { ref, type Ref } from 'vue';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import type { Notification } from '@/codeclarity_components/header/notification.entity';
import DialogTitle from '@/shadcn/ui/dialog/DialogTitle.vue';

const userStore = useUserStore();
const authStore = useAuthStore();

const notifications: Ref<Array<Notification>> = ref([]);
const total_notifications: Ref<number> = ref(0);

// Repositories
const notificationRepository: NotificationRepository = new NotificationRepository();

async function logout() {
    userStore.$reset();
    authStore.$reset();
    router.push('/login');
}

async function fetchNotifications() {
    try {
        const resp = await notificationRepository.getNotifications({
            bearerToken: authStore.getToken as string,
            handleBusinessErrors: true,
            page: 0,
            entries_per_page: 5
        });
        notifications.value = resp.data;
        total_notifications.value = resp.matching_count;
    } catch (_err) {
        if (_err instanceof BusinessLogicError) {
            console.log(_err);
        }
    }
}

async function deleteNotification(notification_id: string) {
    try {
        await notificationRepository.deleteNotification({
            bearerToken: authStore.getToken as string,
            handleBusinessErrors: true,
            notification_id: notification_id
        });
    } catch (_err) {
        if (_err instanceof BusinessLogicError) {
            console.log(_err);
        }
    }
    notifications.value = notifications.value.filter(
        (notification) => notification.id !== notification_id
    );
    total_notifications.value -= 1;
}

async function deleteAllNotifications() {
    try {
        await notificationRepository.deleteAllNotifications({
            bearerToken: authStore.getToken as string,
            handleBusinessErrors: true
        });
    } catch (_err) {
        if (_err instanceof BusinessLogicError) {
            console.log(_err);
        }
    }
    notifications.value = [];
    total_notifications.value = 0;
}

fetchNotifications();
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button
                variant="ghost"
                class="relative h-9 w-9 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
                <Avatar class="h-8 w-8 border border-gray-200">
                    <AvatarImage src="/avatars/01.png" alt="@shadcn" />
                    <AvatarFallback class="bg-gray-100 text-gray-700 font-medium text-sm"
                        >{{ userStore.getUser?.first_name.charAt(0)
                        }}{{ userStore.getUser?.last_name.charAt(0) }}</AvatarFallback
                    >
                </Avatar>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56" align="end">
            <DropdownMenuLabel class="font-normal flex">
                <div class="flex flex-col space-y-1">
                    <p class="text-sm font-medium leading-none">{{ userStore.getUser?.handle }}</p>
                    <p class="text-xs leading-none text-muted-foreground">
                        {{ userStore.getUser?.email }}
                    </p>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <RouterLink title="Profile" :to="{ name: 'settings', params: { page: 'account' } }">
                    <DropdownMenuItem class="cursor-pointer">
                        Profile

                        <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                    </DropdownMenuItem>
                </RouterLink>
                <!-- <DropdownMenuItem>
                    Billing
                    <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                </DropdownMenuItem> -->
                <!-- <DropdownMenuItem>
                    <RouterLink
                    title="Settings"
                    :to="{ name: 'settings', params: { page: 'account' } }"
                    >
                    Settings
                </RouterLink>
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem> -->
                <RouterLink
                    title="Manage Organizations"
                    :to="{ name: 'orgs', params: { action: 'list' } }"
                >
                    <DropdownMenuItem class="cursor-pointer">
                        Manage Organizations
                    </DropdownMenuItem>
                </RouterLink>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="cursor-pointer" @click="logout">
                Log out
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
    <Dialog v-if="total_notifications > 0">
        <DialogTrigger>
            <Badge class="flex gap-1 items-center">
                <Icon class="text-lg" icon="line-md:bell-loop"></Icon>{{ total_notifications }}
            </Badge>
        </DialogTrigger>
        <DialogContent>
            <DialogTitle>Notifications</DialogTitle>
            <DialogDescription>
                <p class="text-sm text-muted-foreground">
                    You have {{ total_notifications }} new notifications
                </p>
            </DialogDescription>
            <div class="max-h-96 overflow-y-auto">
                <ul class="flex flex-col gap-4">
                    <li
                        v-for="notification in notifications"
                        :key="notification.id"
                        class="border-b pb-4 last:border-b-0"
                    >
                        <div v-if="notification.content_type == 'new_version'">
                            <span class="font-semibold"
                                >{{ notification.content['package'] }} can be upgraded</span
                            >
                            <br />
                            <span>{{ notification.description }}</span>
                            <br />
                            <span
                                >{{ notification.content['package'] }}@{{
                                    notification.content['version']
                                }}</span
                            >
                        </div>
                        <div v-else-if="notification.content_type == 'fix_available'">
                            <span class="font-semibold"
                                >Fix available for {{ notification.content['package'] }}</span
                            >
                            <br />
                            <span>{{ notification.description }}</span>
                            <br />
                            <span
                                >Update to {{ notification.content['fixed_version'] }} (current: {{
                                    notification.content['vulnerable_version']
                                }})</span
                            >
                        </div>
                        <div v-else-if="notification.content_type === 'package_update'">
                            <div
:class="[
                                'rounded-lg p-4 border',
                                notification.content?.dependency_type === 'production' 
                                    ? 'bg-orange-50 border-orange-200' 
                                    : notification.content?.dependency_type === 'development'
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'bg-gray-50 border-gray-200'
                            ]">
                                <!-- Header with icon and title -->
                                <div class="flex items-start gap-3 mb-3">
                                    <div
:class="[
                                        'p-2 rounded-full',
                                        notification.content?.dependency_type === 'production' 
                                            ? 'bg-orange-100' 
                                            : notification.content?.dependency_type === 'development'
                                            ? 'bg-blue-100'
                                            : 'bg-gray-100'
                                    ]">
                                        <Icon 
                                            :icon="notification.content?.dependency_type === 'production' 
                                                ? 'mdi:alert-decagram' 
                                                : 'mdi:package-up'"
                                            :class="[
                                                'text-xl',
                                                notification.content?.dependency_type === 'production' 
                                                    ? 'text-orange-600' 
                                                    : notification.content?.dependency_type === 'development'
                                                    ? 'text-blue-600'
                                                    : 'text-gray-600'
                                            ]"
                                        />
                                    </div>
                                    <div class="flex-1">
                                        <div class="flex items-start gap-2">
                                            <h3 class="font-semibold text-base text-gray-900 flex-1">
                                                {{ notification.title || 'Package Update Available' }}
                                            </h3>
                                            <!-- Production/Dev badge -->
                                            <div
v-if="notification.content?.dependency_type" :class="[
                                                'px-2 py-1 rounded-full text-xs font-medium',
                                                notification.content.dependency_type === 'production' 
                                                    ? 'bg-orange-100 text-orange-800 border border-orange-300' 
                                                    : notification.content.dependency_type === 'development'
                                                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                                    : 'bg-gray-100 text-gray-800 border border-gray-300'
                                            ]">
                                                {{ notification.content.dependency_type === 'production' ? 'PRODUCTION' : 'DEVELOPMENT' }}
                                            </div>
                                        </div>
                                        <p v-if="notification.content && notification.content.project_name" class="text-sm text-gray-500 mt-0.5">
                                            Project: <span class="font-medium text-gray-700">{{ notification.content.project_name }}</span>
                                        </p>
                                    </div>
                                </div>
                                
                                <!-- Description -->
                                <p class="text-sm text-gray-600 mb-3 leading-relaxed">
                                    {{ notification.description }}
                                </p>
                                
                                <!-- Version info -->
                                <div v-if="notification.content && notification.content.package_name" class="bg-white rounded-md p-3 mb-3 border">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="font-medium text-gray-900">{{ notification.content.package_name }}</p>
                                            <div class="flex items-center gap-2 mt-1 text-sm text-gray-600">
                                                <span class="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{{ notification.content.current_version }}</span>
                                                <Icon icon="mdi:arrow-right" class="text-gray-400" />
                                                <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono">{{ notification.content.new_version }}</span>
                                            </div>
                                        </div>
                                        <div v-if="notification.content.release_notes_url" class="ml-3">
                                            <a 
                                                :href="notification.content.release_notes_url" 
                                                target="_blank" 
                                                class="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                                            >
                                                <Icon icon="mdi:open-in-new" class="text-sm" />
                                                Release Notes
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Footer with actions -->
                                <div
:class="[
                                    'flex items-center justify-between pt-3 border-t',
                                    notification.content?.dependency_type === 'production' 
                                        ? 'border-orange-200' 
                                        : notification.content?.dependency_type === 'development'
                                        ? 'border-blue-200'
                                        : 'border-gray-200'
                                ]">
                                    <span
:class="[
                                        'text-sm font-medium',
                                        notification.content?.dependency_type === 'production' 
                                            ? 'text-orange-700' 
                                            : notification.content?.dependency_type === 'development'
                                            ? 'text-blue-700'
                                            : 'text-gray-700'
                                    ]">
                                        {{ notification.content?.dependency_type === 'production' 
                                            ? 'Production dependency update - High Priority' 
                                            : notification.content?.dependency_type === 'development'
                                            ? 'Development dependency update'
                                            : 'Direct dependency update available'
                                        }}
                                    </span>
                                    <div class="flex items-center gap-2">
                                        <RouterLink 
                                            v-if="notification.content && notification.content.analysis_id && notification.content.project_id"
                                            :to="{ name: 'results', query: { analysis_id: notification.content.analysis_id, project_id: notification.content.project_id } }"
                                            :class="[
                                                'inline-flex items-center gap-1 text-sm font-medium transition-colors',
                                                notification.content?.dependency_type === 'production' 
                                                    ? 'text-orange-600 hover:text-orange-700' 
                                                    : notification.content?.dependency_type === 'development'
                                                    ? 'text-blue-600 hover:text-blue-700'
                                                    : 'text-gray-600 hover:text-gray-700'
                                            ]"
                                        >
                                            View Analysis
                                            <Icon icon="mdi:arrow-right" class="text-base" />
                                        </RouterLink>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            class="text-sm"
                                            @click="deleteNotification(notification.id)"
                                        >
                                            <Icon icon="mdi:close" class="text-base mr-1" />
                                            Dismiss
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else-if="notification.content_type === 'vuln_summary' || notification.content_type === 'vulnerability_summary'">
                            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <!-- Header with icon and title -->
                                <div class="flex items-start gap-3 mb-3">
                                    <div
:class="[
                                        'p-2 rounded-full',
                                        notification.content?.max_severity === 'CRITICAL' ? 'bg-severityCriticalBg' : 
                                        notification.content?.max_severity === 'HIGH' ? 'bg-severityHighBg' : 
                                        notification.content?.max_severity === 'MEDIUM' ? 'bg-severityMediumBg' : 
                                        notification.content?.max_severity === 'LOW' ? 'bg-severityLowBg' : 'bg-severityNoneBg'
                                    ]">
                                        <Icon 
                                            icon="mdi:shield-alert" 
                                            :class="[
                                                'text-xl',
                                                notification.content?.max_severity === 'CRITICAL' ? 'text-severityCritical' : 
                                                notification.content?.max_severity === 'HIGH' ? 'text-severityHigh' : 
                                                notification.content?.max_severity === 'MEDIUM' ? 'text-severityMedium' : 
                                                notification.content?.max_severity === 'LOW' ? 'text-severityLow' : 'text-severityNone'
                                            ]"
                                        />
                                    </div>
                                    <div class="flex-1">
                                        <h3 class="font-semibold text-base text-gray-900">
                                            {{ notification.title || 'Vulnerability Summary' }}
                                        </h3>
                                        <p v-if="notification.content && notification.content.project_name" class="text-sm text-gray-500 mt-0.5">
                                            Project: <span class="font-medium text-gray-700">{{ notification.content.project_name }}</span>
                                        </p>
                                    </div>
                                </div>
                                
                                <!-- Description -->
                                <p class="text-sm text-gray-600 mb-3 leading-relaxed">
                                    {{ notification.description }}
                                </p>
                                
                                <!-- Severity badges -->
                                <div v-if="notification.content && notification.content.severity_counts" class="flex flex-wrap gap-2 mb-3">
                                    <div
v-if="notification.content.severity_counts.CRITICAL && notification.content.severity_counts.CRITICAL > 0" 
                                         class="flex items-center gap-1 px-2.5 py-1 bg-severityCriticalBg text-severityCritical rounded-md text-sm font-medium">
                                        <Icon icon="mdi:alert-circle" class="text-base" />
                                        <span>Critical: {{ notification.content.severity_counts.CRITICAL }}</span>
                                    </div>
                                    <div
v-if="notification.content.severity_counts.HIGH && notification.content.severity_counts.HIGH > 0" 
                                         class="flex items-center gap-1 px-2.5 py-1 bg-severityHighBg text-severityHigh rounded-md text-sm font-medium">
                                        <Icon icon="mdi:alert" class="text-base" />
                                        <span>High: {{ notification.content.severity_counts.HIGH }}</span>
                                    </div>
                                    <div
v-if="notification.content.severity_counts.MEDIUM && notification.content.severity_counts.MEDIUM > 0" 
                                         class="flex items-center gap-1 px-2.5 py-1 bg-severityMediumBg text-severityMedium rounded-md text-sm font-medium">
                                        <Icon icon="mdi:alert-outline" class="text-base" />
                                        <span>Medium: {{ notification.content.severity_counts.MEDIUM }}</span>
                                    </div>
                                    <div
v-if="notification.content.severity_counts.LOW && notification.content.severity_counts.LOW > 0" 
                                         class="flex items-center gap-1 px-2.5 py-1 bg-severityLowBg text-severityLow rounded-md text-sm font-medium">
                                        <Icon icon="mdi:information-outline" class="text-base" />
                                        <span>Low: {{ notification.content.severity_counts.LOW }}</span>
                                    </div>
                                </div>
                                
                                <!-- Footer with total and actions -->
                                <div class="flex items-center justify-between pt-3 border-t border-gray-200">
                                    <span class="text-sm font-medium text-gray-700">
                                        Total: {{ notification.content?.total || 0 }} vulnerabilities
                                    </span>
                                    <div class="flex items-center gap-2">
                                        <RouterLink 
                                            v-if="notification.content && notification.content.analysis_id && notification.content.project_id"
                                            :to="{ name: 'results', query: { analysis_id: notification.content.analysis_id, project_id: notification.content.project_id } }"
                                            class="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                        >
                                            View Details
                                            <Icon icon="mdi:arrow-right" class="text-base" />
                                        </RouterLink>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            class="text-sm"
                                            @click="deleteNotification(notification.id)"
                                        >
                                            <Icon icon="mdi:close" class="text-base mr-1" />
                                            Dismiss
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else>
                            <div class="flex items-start justify-between">
                                <div>
                                    <span class="font-semibold">{{ notification.title }}</span>
                                    <br />
                                    <span>{{ notification.description }}</span>
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    class="ml-4"
                                    @click="deleteNotification(notification.id)"
                                >
                                    <Icon icon="mdi:close" class="text-base mr-1" />
                                    Dismiss
                                </Button>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
            <DialogFooter>
                <Button variant="ghost" class="text-sm" @click="deleteAllNotifications"
                    >Clear all</Button
                >
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

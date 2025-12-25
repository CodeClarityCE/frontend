<script setup lang="ts">
import {
    type Notification,
    NotificationContentType
} from '@/codeclarity_components/header/notification.entity';
import { NotificationRepository } from '@/codeclarity_components/header/notification.repository';
import router from '@/router';
import { Avatar, AvatarFallback, AvatarImage } from '@/shadcn/ui/avatar';
import Badge from '@/shadcn/ui/badge/Badge.vue';
import { Button } from '@/shadcn/ui/button';
import Dialog from '@/shadcn/ui/dialog/Dialog.vue';
import DialogContent from '@/shadcn/ui/dialog/DialogContent.vue';
import DialogDescription from '@/shadcn/ui/dialog/DialogDescription.vue';
import DialogFooter from '@/shadcn/ui/dialog/DialogFooter.vue';
import DialogTitle from '@/shadcn/ui/dialog/DialogTitle.vue';
import DialogTrigger from '@/shadcn/ui/dialog/DialogTrigger.vue';
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
import { Input } from '@/shadcn/ui/input';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import {
    isGreaterThan,
    isPrerelease as semverIsPrerelease,
    shouldRecommendUpgrade,
    getUpgradeType
} from '@/utils/semver';
import { Icon } from '@iconify/vue';
import { ref, type Ref, computed, watch } from 'vue';

const userStore = useUserStore();
const authStore = useAuthStore();

const allNotifications: Ref<Notification[]> = ref([]);
const total_notifications: Ref<number> = ref(0);
const currentPage: Ref<number> = ref(0);
const searchQuery: Ref<string> = ref('');
const selectedFilter: Ref<string> = ref('all');
const entriesPerPage = 10;
const isLoading: Ref<boolean> = ref(false);

// Repositories
const notificationRepository: NotificationRepository = new NotificationRepository();

async function logout(): Promise<void> {
    userStore.$reset();
    authStore.$reset();
    void router.push('/login');
}

// Priority mapping for sorting
const getPriority = (notification: Notification): number => {
    if (
        notification.content_type === NotificationContentType.VulnSummary ||
        notification.content_type === NotificationContentType.VulnerabilitySummary ||
        notification.content_type === NotificationContentType.FixAvailable
    ) {
        return 1; // Highest priority - vulnerabilities
    }
    if (
        notification.content_type === NotificationContentType.PackageUpdate &&
        notification.content?.dependency_type === 'production'
    ) {
        return 2; // High priority - production dependencies
    }
    if (
        notification.content_type === NotificationContentType.PackageUpdate &&
        notification.content?.dependency_type === 'development'
    ) {
        return 3; // Medium priority - dev dependencies
    }
    return 4; // Lowest priority - other updates
};

// Filter and sort notifications
const filteredNotifications = computed(() => {
    let filtered = allNotifications.value;

    // Filter out prerelease notifications
    filtered = filtered.filter((notification) => !shouldFilterNotification(notification));

    // Apply search filter
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(
            (notification) =>
                notification.title.toLowerCase().includes(query) ||
                notification.description.toLowerCase().includes(query) ||
                (notification.content.package_name?.toLowerCase().includes(query) ?? false) ||
                (notification.content.project_name?.toLowerCase().includes(query) ?? false)
        );
    }

    // Apply type filter
    if (selectedFilter.value !== 'all') {
        filtered = filtered.filter((notification) => {
            switch (selectedFilter.value) {
                case 'vulnerabilities':
                    return (
                        notification.content_type === NotificationContentType.VulnSummary ||
                        notification.content_type ===
                            NotificationContentType.VulnerabilitySummary ||
                        notification.content_type === NotificationContentType.FixAvailable
                    );
                case 'production':
                    return (
                        notification.content_type === NotificationContentType.PackageUpdate &&
                        notification.content?.dependency_type === 'production'
                    );
                case 'development':
                    return (
                        notification.content_type === NotificationContentType.PackageUpdate &&
                        notification.content?.dependency_type === 'development'
                    );
                case 'other':
                    return (
                        notification.content_type === NotificationContentType.NewVersion ||
                        (notification.content_type === NotificationContentType.PackageUpdate &&
                            !notification.content?.dependency_type)
                    );
                default:
                    return true;
            }
        });
    }

    // Sort by priority then by most recent
    return filtered.sort((a, b) => {
        const priorityDiff = getPriority(a) - getPriority(b);
        if (priorityDiff !== 0) return priorityDiff;
        // If same priority, sort by ID (assuming newer IDs are higher)
        return b.id.localeCompare(a.id);
    });
});

// Paginated notifications
const paginatedNotifications = computed(() => {
    const start = currentPage.value * entriesPerPage;
    const end = start + entriesPerPage;
    return filteredNotifications.value.slice(start, end);
});

// Notification counts by type (excluding filtered prerelease notifications)
const notificationCounts = computed(() => {
    const counts = {
        vulnerabilities: 0,
        production: 0,
        development: 0,
        other: 0
    };

    // Only count notifications that wouldn't be filtered out
    allNotifications.value
        .filter((notification) => !shouldFilterNotification(notification))
        .forEach((notification) => {
            if (
                notification.content_type === NotificationContentType.VulnSummary ||
                notification.content_type === NotificationContentType.VulnerabilitySummary ||
                notification.content_type === NotificationContentType.FixAvailable
            ) {
                counts.vulnerabilities++;
            } else if (
                notification.content_type === NotificationContentType.PackageUpdate &&
                notification.content?.dependency_type === 'production'
            ) {
                counts.production++;
            } else if (
                notification.content_type === NotificationContentType.PackageUpdate &&
                notification.content?.dependency_type === 'development'
            ) {
                counts.development++;
            } else {
                counts.other++;
            }
        });

    return counts;
});

// Total filtered notifications count
const totalFilteredCount = computed(() => filteredNotifications.value.length);

// Total count for display (excluding prerelease notifications)
const displayNotificationCount = computed(() => {
    return allNotifications.value.filter((notification) => !shouldFilterNotification(notification))
        .length;
});

// Total pages
const totalPages = computed(() => Math.ceil(totalFilteredCount.value / entriesPerPage));

// Helper function to determine if a notification should be filtered out
const shouldFilterNotification = (notification: Notification): boolean => {
    // Filter out package update notifications that shouldn't be recommended
    if (notification.content_type === NotificationContentType.PackageUpdate) {
        const currentVersion = notification.content.current_version;
        const newVersion = notification.content.new_version;

        if (currentVersion && newVersion) {
            // Use the semver utility to determine if this upgrade should be recommended
            return !shouldRecommendUpgrade(currentVersion, newVersion);
        }
    }
    return false;
};

// Helper function to get properly ordered versions with upgrade analysis
const getVersionInfo = (
    notification: Notification
): {
    fromVersion: string;
    toVersion: string;
    isUpgrade: boolean;
    isPrerelease: boolean;
    upgradeType: 'major' | 'minor' | 'patch' | 'prerelease' | 'downgrade' | 'same';
} => {
    const content = notification.content;
    if (!content.current_version || !content.new_version) {
        return {
            fromVersion: content.current_version ?? '',
            toVersion: content.new_version ?? '',
            isUpgrade: true,
            isPrerelease: false,
            upgradeType: 'minor' as const
        };
    }

    const currentVersion = content.current_version;
    const newVersion = content.new_version;
    const upgradeType = getUpgradeType(currentVersion, newVersion);
    const newVersionIsPrerelease = semverIsPrerelease(newVersion);

    // Check if current_version is actually newer than new_version (incorrect data)
    const currentIsNewer = isGreaterThan(currentVersion, newVersion);

    if (currentIsNewer) {
        // Data is backwards - swap them and mark as downgrade
        return {
            fromVersion: newVersion,
            toVersion: currentVersion,
            isUpgrade: false, // This would be a downgrade, which is unusual
            isPrerelease: newVersionIsPrerelease,
            upgradeType: 'downgrade' as const
        };
    } else {
        // Data is correct
        return {
            fromVersion: currentVersion,
            toVersion: newVersion,
            isUpgrade: upgradeType !== 'downgrade' && upgradeType !== 'same',
            isPrerelease: newVersionIsPrerelease,
            upgradeType
        };
    }
};

// Reset page when search or filter changes
watch([searchQuery, selectedFilter], () => {
    currentPage.value = 0;
});

async function fetchAllNotifications(): Promise<void> {
    isLoading.value = true;
    try {
        // Fetch a larger number to get all notifications for better sorting/filtering
        const resp = await notificationRepository.getNotifications({
            bearerToken: authStore.getToken!,
            handleBusinessErrors: true,
            page: 0,
            entries_per_page: 100 // Fetch more notifications for better overview
        });
        allNotifications.value = resp.data;
        total_notifications.value = resp.matching_count;
    } catch (_err) {
        if (_err instanceof BusinessLogicError) {
            console.error(_err);
        }
    } finally {
        isLoading.value = false;
    }
}

async function deleteNotification(notification_id: string): Promise<void> {
    try {
        await notificationRepository.deleteNotification({
            bearerToken: authStore.getToken!,
            handleBusinessErrors: true,
            notification_id: notification_id
        });
    } catch (_err) {
        if (_err instanceof BusinessLogicError) {
            console.error(_err);
        }
    }
    allNotifications.value = allNotifications.value.filter(
        (notification) => notification.id !== notification_id
    );
    total_notifications.value -= 1;
}

async function deleteAllNotifications(): Promise<void> {
    try {
        await notificationRepository.deleteAllNotifications({
            bearerToken: authStore.getToken!,
            handleBusinessErrors: true
        });
    } catch (_err) {
        if (_err instanceof BusinessLogicError) {
            console.error(_err);
        }
    }
    allNotifications.value = [];
    total_notifications.value = 0;
}

// Pagination functions
function nextPage(): void {
    if (currentPage.value < totalPages.value - 1) {
        currentPage.value++;
    }
}

function prevPage(): void {
    if (currentPage.value > 0) {
        currentPage.value--;
    }
}

function goToPage(page: number): void {
    if (page >= 0 && page < totalPages.value) {
        currentPage.value = page;
    }
}

void fetchAllNotifications();
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
    <Dialog v-if="displayNotificationCount > 0">
        <DialogTrigger>
            <Badge class="flex gap-1 items-center">
                <Icon class="text-lg" icon="line-md:bell-loop"></Icon>{{ displayNotificationCount }}
            </Badge>
        </DialogTrigger>
        <DialogContent class="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogTitle>Notifications</DialogTitle>
            <DialogDescription>
                <p class="text-sm text-muted-foreground">
                    You have {{ displayNotificationCount }} new notifications
                </p>
            </DialogDescription>

            <!-- Overview Summary -->
            <div class="grid grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border">
                <div class="text-center">
                    <div class="text-2xl font-bold text-red-600">
                        {{ notificationCounts.vulnerabilities }}
                    </div>
                    <div class="text-xs text-gray-600">Vulnerabilities</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-orange-600">
                        {{ notificationCounts.production }}
                    </div>
                    <div class="text-xs text-gray-600">Production Updates</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-blue-600">
                        {{ notificationCounts.development }}
                    </div>
                    <div class="text-xs text-gray-600">Dev Updates</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-gray-600">
                        {{ notificationCounts.other }}
                    </div>
                    <div class="text-xs text-gray-600">Other</div>
                </div>
            </div>

            <!-- Search and Filter Controls -->
            <div class="flex gap-3 items-center">
                <div class="flex-1">
                    <Input
                        v-model="searchQuery"
                        placeholder="Search notifications..."
                        class="w-full"
                    />
                </div>
                <select
                    v-model="selectedFilter"
                    class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All ({{ totalFilteredCount }})</option>
                    <option value="vulnerabilities">
                        Vulnerabilities ({{ notificationCounts.vulnerabilities }})
                    </option>
                    <option value="production">
                        Production ({{ notificationCounts.production }})
                    </option>
                    <option value="development">
                        Development ({{ notificationCounts.development }})
                    </option>
                    <option value="other">Other ({{ notificationCounts.other }})</option>
                </select>
            </div>

            <!-- Loading State -->
            <div v-if="isLoading" class="flex justify-center items-center py-8">
                <Icon icon="line-md:loading-loop" class="text-2xl text-gray-500" />
                <span class="ml-2 text-gray-500">Loading notifications...</span>
            </div>

            <!-- Notifications List -->
            <div v-else class="flex-1 overflow-y-auto">
                <div
                    v-if="paginatedNotifications.length === 0"
                    class="text-center py-8 text-gray-500"
                >
                    <Icon icon="mdi:bell-off" class="text-4xl mx-auto mb-2" />
                    <p>No notifications found</p>
                    <p class="text-sm">Try adjusting your search or filter criteria</p>
                </div>
                <ul v-else class="flex flex-col gap-4">
                    <li
                        v-for="notification in paginatedNotifications"
                        :key="notification.id"
                        class="border-b pb-4 last:border-b-0"
                    >
                        <div v-if="notification.content_type === 'new_version'">
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
                        <div v-else-if="notification.content_type === 'fix_available'">
                            <span class="font-semibold"
                                >Fix available for {{ notification.content['package'] }}</span
                            >
                            <br />
                            <span>{{ notification.description }}</span>
                            <br />
                            <span
                                >Update to {{ notification.content['fixed_version'] }} (current:
                                {{ notification.content['vulnerable_version'] }})</span
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
                                ]"
                            >
                                <!-- Header with icon and title -->
                                <div class="flex items-start gap-3 mb-3">
                                    <div
                                        :class="[
                                            'p-2 rounded-full',
                                            notification.content?.dependency_type === 'production'
                                                ? 'bg-orange-100'
                                                : notification.content?.dependency_type ===
                                                    'development'
                                                  ? 'bg-blue-100'
                                                  : 'bg-gray-100'
                                        ]"
                                    >
                                        <Icon
                                            :icon="
                                                notification.content?.dependency_type ===
                                                'production'
                                                    ? 'mdi:alert-decagram'
                                                    : 'mdi:package-up'
                                            "
                                            :class="[
                                                'text-xl',
                                                notification.content?.dependency_type ===
                                                'production'
                                                    ? 'text-orange-600'
                                                    : notification.content?.dependency_type ===
                                                        'development'
                                                      ? 'text-blue-600'
                                                      : 'text-gray-600'
                                            ]"
                                        />
                                    </div>
                                    <div class="flex-1">
                                        <div class="flex items-start gap-2">
                                            <h3
                                                class="font-semibold text-base text-gray-900 flex-1"
                                            >
                                                {{
                                                    notification.title ?? 'Package Update Available'
                                                }}
                                            </h3>
                                            <!-- Production/Dev badge -->
                                            <div
                                                v-if="notification.content?.dependency_type"
                                                :class="[
                                                    'px-2 py-1 rounded-full text-xs font-medium',
                                                    notification.content.dependency_type ===
                                                    'production'
                                                        ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                                        : notification.content.dependency_type ===
                                                            'development'
                                                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                                          : 'bg-gray-100 text-gray-800 border border-gray-300'
                                                ]"
                                            >
                                                {{
                                                    notification.content.dependency_type ===
                                                    'production'
                                                        ? 'PRODUCTION'
                                                        : 'DEVELOPMENT'
                                                }}
                                            </div>
                                        </div>
                                        <p
                                            v-if="
                                                notification.content &&
                                                notification.content.project_name
                                            "
                                            class="text-sm text-gray-500 mt-0.5"
                                        >
                                            Project:
                                            <span class="font-medium text-gray-700">{{
                                                notification.content.project_name
                                            }}</span>
                                        </p>
                                    </div>
                                </div>

                                <!-- Description -->
                                <p class="text-sm text-gray-600 mb-3 leading-relaxed">
                                    {{ notification.description }}
                                </p>

                                <!-- Version info -->
                                <div
                                    v-if="notification.content && notification.content.package_name"
                                    class="bg-white rounded-md p-3 mb-3 border"
                                >
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="font-medium text-gray-900">
                                                {{ notification.content.package_name }}
                                            </p>
                                            <div
                                                class="flex items-center gap-2 mt-1 text-sm text-gray-600"
                                            >
                                                <span
                                                    class="bg-gray-100 px-2 py-1 rounded text-xs font-mono"
                                                    >{{
                                                        getVersionInfo(notification).fromVersion
                                                    }}</span
                                                >
                                                <Icon
                                                    :icon="
                                                        getVersionInfo(notification).isUpgrade
                                                            ? 'mdi:arrow-right'
                                                            : 'mdi:arrow-down'
                                                    "
                                                    :class="
                                                        getVersionInfo(notification).isUpgrade
                                                            ? 'text-gray-400'
                                                            : 'text-orange-500'
                                                    "
                                                />
                                                <span
                                                    :class="
                                                        getVersionInfo(notification).isUpgrade
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-orange-100 text-orange-800'
                                                    "
                                                    class="px-2 py-1 rounded text-xs font-mono"
                                                >
                                                    {{ getVersionInfo(notification).toVersion }}
                                                </span>
                                            </div>
                                            <div class="flex gap-2 mt-1">
                                                <!-- Upgrade type badge -->
                                                <span
                                                    :class="{
                                                        'bg-red-100 text-red-800':
                                                            getVersionInfo(notification)
                                                                .upgradeType === 'major',
                                                        'bg-orange-100 text-orange-800':
                                                            getVersionInfo(notification)
                                                                .upgradeType === 'minor',
                                                        'bg-blue-100 text-blue-800':
                                                            getVersionInfo(notification)
                                                                .upgradeType === 'patch',
                                                        'bg-purple-100 text-purple-800':
                                                            getVersionInfo(notification)
                                                                .upgradeType === 'prerelease',
                                                        'bg-gray-100 text-gray-800':
                                                            getVersionInfo(notification)
                                                                .upgradeType === 'downgrade' ||
                                                            getVersionInfo(notification)
                                                                .upgradeType === 'same'
                                                    }"
                                                    class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium"
                                                >
                                                    <Icon
                                                        :icon="
                                                            (() => {
                                                                const type =
                                                                    getVersionInfo(
                                                                        notification
                                                                    ).upgradeType;
                                                                const iconMap: Record<
                                                                    string,
                                                                    string
                                                                > = {
                                                                    major: 'mdi:arrow-up-bold',
                                                                    minor: 'mdi:arrow-up',
                                                                    patch: 'mdi:arrow-up-thin',
                                                                    prerelease: 'mdi:flask-outline',
                                                                    downgrade: 'mdi:arrow-down',
                                                                    same: 'mdi:equal'
                                                                };
                                                                return (
                                                                    iconMap[type] || 'mdi:arrow-up'
                                                                );
                                                            })()
                                                        "
                                                        class="text-sm"
                                                    />
                                                    {{
                                                        getVersionInfo(notification)
                                                            .upgradeType.charAt(0)
                                                            .toUpperCase() +
                                                        getVersionInfo(
                                                            notification
                                                        ).upgradeType.slice(1)
                                                    }}
                                                </span>

                                                <!-- Prerelease badge if applicable -->
                                                <span
                                                    v-if="getVersionInfo(notification).isPrerelease"
                                                    class="inline-flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full"
                                                >
                                                    <Icon
                                                        icon="mdi:flask-outline"
                                                        class="text-sm"
                                                    />
                                                    Prerelease
                                                </span>
                                            </div>

                                            <!-- Data issue warning -->
                                            <div
                                                v-if="
                                                    !getVersionInfo(notification).isUpgrade &&
                                                    getVersionInfo(notification).upgradeType ===
                                                        'downgrade'
                                                "
                                                class="mt-1"
                                            >
                                                <span
                                                    class="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full"
                                                >
                                                    <Icon icon="mdi:alert-circle" class="text-sm" />
                                                    Potential version data issue detected
                                                </span>
                                            </div>
                                        </div>
                                        <div
                                            v-if="notification.content.release_notes_url"
                                            class="ml-3"
                                        >
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
                                            : notification.content?.dependency_type ===
                                                'development'
                                              ? 'border-blue-200'
                                              : 'border-gray-200'
                                    ]"
                                >
                                    <span
                                        :class="[
                                            'text-sm font-medium',
                                            notification.content?.dependency_type === 'production'
                                                ? 'text-orange-700'
                                                : notification.content?.dependency_type ===
                                                    'development'
                                                  ? 'text-blue-700'
                                                  : 'text-gray-700'
                                        ]"
                                    >
                                        {{
                                            notification.content?.dependency_type === 'production'
                                                ? 'Production dependency update - High Priority'
                                                : notification.content?.dependency_type ===
                                                    'development'
                                                  ? 'Development dependency update'
                                                  : 'Direct dependency update available'
                                        }}
                                    </span>
                                    <div class="flex items-center gap-2">
                                        <RouterLink
                                            v-if="
                                                notification.content &&
                                                notification.content.analysis_id &&
                                                notification.content.project_id
                                            "
                                            :to="{
                                                name: 'results',
                                                query: {
                                                    analysis_id: notification.content.analysis_id,
                                                    project_id: notification.content.project_id
                                                }
                                            }"
                                            :class="[
                                                'inline-flex items-center gap-1 text-sm font-medium transition-colors',
                                                notification.content?.dependency_type ===
                                                'production'
                                                    ? 'text-orange-600 hover:text-orange-700'
                                                    : notification.content?.dependency_type ===
                                                        'development'
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
                        <div
                            v-else-if="
                                notification.content_type === 'vuln_summary' ||
                                notification.content_type === 'vulnerability_summary'
                            "
                        >
                            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <!-- Header with icon and title -->
                                <div class="flex items-start gap-3 mb-3">
                                    <div
                                        :class="[
                                            'p-2 rounded-full',
                                            notification.content?.max_severity === 'CRITICAL'
                                                ? 'bg-severity-critical-bg'
                                                : notification.content?.max_severity === 'HIGH'
                                                  ? 'bg-severity-high-bg'
                                                  : notification.content?.max_severity === 'MEDIUM'
                                                    ? 'bg-severity-medium-bg'
                                                    : notification.content?.max_severity === 'LOW'
                                                      ? 'bg-severity-low-bg'
                                                      : 'bg-severity-none-bg'
                                        ]"
                                    >
                                        <Icon
                                            icon="mdi:shield-alert"
                                            :class="[
                                                'text-xl',
                                                notification.content?.max_severity === 'CRITICAL'
                                                    ? 'text-severity-critical'
                                                    : notification.content?.max_severity === 'HIGH'
                                                      ? 'text-severity-high'
                                                      : notification.content?.max_severity ===
                                                          'MEDIUM'
                                                        ? 'text-severity-medium'
                                                        : notification.content?.max_severity ===
                                                            'LOW'
                                                          ? 'text-severity-low'
                                                          : 'text-severity-none'
                                            ]"
                                        />
                                    </div>
                                    <div class="flex-1">
                                        <h3 class="font-semibold text-base text-gray-900">
                                            {{ notification.title ?? 'Vulnerability Summary' }}
                                        </h3>
                                        <p
                                            v-if="
                                                notification.content &&
                                                notification.content.project_name
                                            "
                                            class="text-sm text-gray-500 mt-0.5"
                                        >
                                            Project:
                                            <span class="font-medium text-gray-700">{{
                                                notification.content.project_name
                                            }}</span>
                                        </p>
                                    </div>
                                </div>

                                <!-- Description -->
                                <p class="text-sm text-gray-600 mb-3 leading-relaxed">
                                    {{ notification.description }}
                                </p>

                                <!-- Severity badges -->
                                <div
                                    v-if="
                                        notification.content && notification.content.severity_counts
                                    "
                                    class="flex flex-wrap gap-2 mb-3"
                                >
                                    <div
                                        v-if="
                                            notification.content.severity_counts.CRITICAL &&
                                            notification.content.severity_counts.CRITICAL > 0
                                        "
                                        class="flex items-center gap-1 px-2.5 py-1 bg-severity-critical-bg text-severity-critical rounded-md text-sm font-medium"
                                    >
                                        <Icon icon="mdi:alert-circle" class="text-base" />
                                        <span
                                            >Critical:
                                            {{
                                                notification.content.severity_counts.CRITICAL
                                            }}</span
                                        >
                                    </div>
                                    <div
                                        v-if="
                                            notification.content.severity_counts.HIGH &&
                                            notification.content.severity_counts.HIGH > 0
                                        "
                                        class="flex items-center gap-1 px-2.5 py-1 bg-severity-high-bg text-severity-high rounded-md text-sm font-medium"
                                    >
                                        <Icon icon="mdi:alert" class="text-base" />
                                        <span
                                            >High:
                                            {{ notification.content.severity_counts.HIGH }}</span
                                        >
                                    </div>
                                    <div
                                        v-if="
                                            notification.content.severity_counts.MEDIUM &&
                                            notification.content.severity_counts.MEDIUM > 0
                                        "
                                        class="flex items-center gap-1 px-2.5 py-1 bg-severity-medium-bg text-severity-medium rounded-md text-sm font-medium"
                                    >
                                        <Icon icon="mdi:alert-outline" class="text-base" />
                                        <span
                                            >Medium:
                                            {{ notification.content.severity_counts.MEDIUM }}</span
                                        >
                                    </div>
                                    <div
                                        v-if="
                                            notification.content.severity_counts.LOW &&
                                            notification.content.severity_counts.LOW > 0
                                        "
                                        class="flex items-center gap-1 px-2.5 py-1 bg-severity-low-bg text-severity-low rounded-md text-sm font-medium"
                                    >
                                        <Icon icon="mdi:information-outline" class="text-base" />
                                        <span
                                            >Low:
                                            {{ notification.content.severity_counts.LOW }}</span
                                        >
                                    </div>
                                </div>

                                <!-- Footer with total and actions -->
                                <div
                                    class="flex items-center justify-between pt-3 border-t border-gray-200"
                                >
                                    <span class="text-sm font-medium text-gray-700">
                                        Total:
                                        {{ notification.content?.total || 0 }} vulnerabilities
                                    </span>
                                    <div class="flex items-center gap-2">
                                        <RouterLink
                                            v-if="
                                                notification.content &&
                                                notification.content.analysis_id &&
                                                notification.content.project_id
                                            "
                                            :to="{
                                                name: 'results',
                                                query: {
                                                    analysis_id: notification.content.analysis_id,
                                                    project_id: notification.content.project_id
                                                }
                                            }"
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

            <!-- Pagination Controls -->
            <div v-if="totalPages > 1" class="flex items-center justify-between border-t pt-4">
                <div class="text-sm text-gray-600">
                    Showing {{ currentPage * entriesPerPage + 1 }}-{{
                        Math.min((currentPage + 1) * entriesPerPage, totalFilteredCount)
                    }}
                    of {{ totalFilteredCount }}
                </div>
                <div class="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        :disabled="currentPage === 0"
                        @click="prevPage"
                    >
                        <Icon icon="mdi:chevron-left" class="text-base" />
                    </Button>

                    <!-- Page numbers -->
                    <div class="flex gap-1">
                        <Button
                            v-for="page in Math.min(5, totalPages)"
                            :key="page - 1"
                            variant="outline"
                            size="sm"
                            :class="{
                                'bg-blue-50 border-blue-300 text-blue-700': currentPage === page - 1
                            }"
                            @click="goToPage(page - 1)"
                        >
                            {{ page }}
                        </Button>
                        <span v-if="totalPages > 5" class="px-2 text-gray-500">...</span>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        :disabled="currentPage === totalPages - 1"
                        @click="nextPage"
                    >
                        <Icon icon="mdi:chevron-right" class="text-base" />
                    </Button>
                </div>
            </div>

            <DialogFooter>
                <Button variant="ghost" class="text-sm" @click="deleteAllNotifications"
                    >Clear all</Button
                >
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

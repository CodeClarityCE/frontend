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
import { Icon } from '@iconify/vue/dist/iconify.js';
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
        // console.log(resp);
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
            <Button variant="ghost" class="relative h-8 w-8 rounded-full">
                <Avatar class="h-8 w-8">
                    <AvatarImage src="/avatars/01.png" alt="@shadcn" />
                    <AvatarFallback
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
                    :to="{ name: 'orgs', params: { page: 'list' } }"
                >
                    <DropdownMenuItem class="cursor-pointer">
                        Manage Organizations
                    </DropdownMenuItem>
                </RouterLink>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="logout" class="cursor-pointer">
                Log out
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
    <Dialog v-if="total_notifications > 0">
        <DialogTrigger
            ><Badge class="flex gap-1 items-center"
                ><Icon class="text-lg" icon="line-md:bell-loop"></Icon
                >{{ total_notifications }}</Badge
            ></DialogTrigger
        >
        <DialogContent>
            <DialogTitle>Notifications</DialogTitle>
            <DialogDescription>
                <p class="text-sm text-muted-foreground">
                    You have {{ total_notifications }} new notifications
                </p>
            </DialogDescription>
            <div>
                <ul class="flex flex-col gap-8">
                    <li
                        v-for="notification in notifications"
                        :key="notification.id"
                        class="grid grid-cols-2 items-center gap-2"
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
                        <div v-else>
                            <span class="font-semibold">{{ notification.title }}</span>
                            <br />
                            <span>{{ notification.description }}</span>
                        </div>
                        <div class="grid grid-cols-2 items-center gap-2">
                            <!-- <Button variant="ghost" class="text-sm">View</Button> -->
                            <span></span>
                            <Button
                                variant="destructive"
                                class="text-sm"
                                @click="deleteNotification(notification.id)"
                                >Dismiss</Button
                            >
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

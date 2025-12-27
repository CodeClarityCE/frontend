<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { CheckIcon } from "lucide-vue-next";
import { ref, watch } from "vue";
import { UserRepository } from "@/codeclarity_components/authentication/user.repository";
import { OrgRepository } from "@/codeclarity_components/organizations/organization.repository";
import router from "@/router";
import { cn } from "@/shadcn/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/shadcn/ui/avatar";
import { Button } from "@/shadcn/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/shadcn/ui/command";
import { Dialog, DialogTrigger } from "@/shadcn/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { errorToast, successToast } from "@/utils/toasts";

const userStore = useUserStore();
const authStore = useAuthStore();

interface TeamItem {
  label: string;
  value: string;
}

interface TeamGroup {
  label: string;
  teams: TeamItem[];
}

const groups: TeamGroup[] = [];

groups.push({
  label: "Activated",
  teams: [
    {
      label: "Empty",
      value: "empty",
    },
  ],
});

type Team = (typeof groups)[number]["teams"][number];

const open = ref(false);
const showNewTeamDialog = ref(false);
const selectedTeam = ref<Team | undefined>(groups[0]?.teams[0]);

const orgsRepository: OrgRepository = new OrgRepository();
const userRepo: UserRepository = new UserRepository();

async function fetch(): Promise<void> {
  if (authStore.getAuthenticated && authStore.getToken) {
    try {
      const _orgs = await orgsRepository.getMany({
        bearerToken: authStore.getToken,
        handleBusinessErrors: true,
        pagination: {
          page: 0,
          entries_per_page: 50,
        },
      });

      selectedTeam.value = {
        label:
          _orgs.data.find(
            (org) => org.organization.id === userStore.getUser?.default_org.id,
          )?.organization.name ?? "",
        value: userStore.getUser?.default_org.name ?? "",
      };

      groups.pop();
      const teams = _orgs.data.map((org) => {
        return {
          label: org.organization.name,
          value: org.organization.id,
        };
      });
      groups.push({
        label: "Teams",
        teams: teams,
      });
    } catch (_error) {
      console.error(_error);

      // error.value = true;
      // if (_error instanceof BusinessLogicError) {
      //     errorCode.value = _error.error_code;
      // }
    } finally {
      // if (!refresh) loading.value = false;
    }
  }
}

async function switchOrg(org: TeamItem): Promise<void> {
  if (!userStore.getDefaultOrg) return;
  if (org.value !== userStore.getDefaultOrg.id) {
    if (authStore.getAuthenticated && userStore.getUser) {
      try {
        await userRepo.setDefaultOrg({
          bearerToken: authStore.getToken!,
          userId: userStore.getUser.id,
          data: { default_org: org.value },
          handleBusinessErrors: true,
        });

        const _org = await orgsRepository.get({
          bearerToken: authStore.getToken!,
          handleBusinessErrors: true,
          orgId: org.value,
        });
        userStore.setDefaultOrg(_org);
        if (router.currentRoute.value.name === "home") {
          router.go(0);
        } else {
          void router.push({ name: "home" });
        }

        void successToast(`Succesfully switched to org ${org.label}`);
      } catch (error) {
        console.error(error);

        void errorToast("Failed to switch org");
      }
    }
  }
}

watch(
  () => userStore.getUser,
  () => {
    void fetch();
  },
);
void fetch();
</script>

<template>
  <div></div>
  <Dialog v-model:open="showNewTeamDialog">
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded="open"
          aria-label="Select an organization"
          :class="
            cn(
              'w-[220px] justify-between bg-gray-50 border-gray-300 hover:bg-gray-100 transition-colors duration-200 text-gray-700 hover:text-gray-900',
              $attrs['class'] ?? '',
            )
          "
        >
          <Avatar class="mr-2 h-5 w-5">
            <AvatarImage
              :src="`https://avatar.vercel.sh/${selectedTeam?.value}.png`"
              :alt="selectedTeam?.label"
            />
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
          {{ selectedTeam?.label }}
          <Icon
            icon="radix-icons:caret-sort"
            class="ml-auto h-4 w-4 shrink-0 opacity-50"
          ></Icon>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-[220px] p-0">
        <Command
          :filter-function="
            (list: any[], term: string) =>
              list.filter((i: any) => i.label?.toLowerCase()?.includes(term))
          "
        >
          <CommandList>
            <CommandInput placeholder="Search organization..." />
            <CommandEmpty>No organization found.</CommandEmpty>
            <CommandGroup
              v-for="group in groups"
              :key="group.label"
              :heading="group.label"
            >
              <CommandItem
                v-for="team in group.teams"
                :key="team.value"
                :value="team"
                class="text-sm"
                @select="
                  () => {
                    void switchOrg(team);
                    selectedTeam = team;
                    open = false;
                  }
                "
              >
                <Avatar class="mr-2 h-5 w-5">
                  <AvatarImage
                    :src="`https://avatar.vercel.sh/${team.value}.png`"
                    :alt="team.label"
                    class="grayscale"
                  />
                  <AvatarFallback>SC</AvatarFallback>
                </Avatar>
                {{ team.label }}
                <CheckIcon
                  :class="
                    cn(
                      'ml-auto h-4 w-4',
                      selectedTeam?.value === team.value
                        ? 'opacity-100'
                        : 'opacity-0',
                    )
                  "
                />
              </CommandItem>
            </CommandGroup>
          </CommandList>
          <CommandSeparator />
          <CommandList>
            <CommandGroup
              @click="router.push({ name: 'orgs', params: { action: 'add' } })"
            >
              <DialogTrigger as-child>
                <CommandItem
                  value="create-team"
                  @select="
                    () => {
                      open = false;
                      showNewTeamDialog = true;
                    }
                  "
                >
                  <Icon
                    icon="radix-icons:plus-circled"
                    class="mr-2 h-5 w-5"
                  ></Icon>
                  Create Organization
                </CommandItem>
              </DialogTrigger>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
    <!-- <DialogContent>
            <DialogHeader>
                <DialogTitle>Create organization</DialogTitle>
                <DialogDescription>
                    Add a new organization to manage products and customers.
                </DialogDescription>
            </DialogHeader>
            <div>
                <div class="space-y-4 py-2 pb-4">
                    <div class="space-y-2">
                        <Label for="name">Organization name</Label>
                        <Input id="name" placeholder="Acme Inc." />
                    </div>
                    <div class="space-y-2">
                        <Label for="plan">Subscription plan</Label>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a plan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="free">
                                    <span class="font-medium">Free</span> -
                                    <span class="text-muted-foreground"> Trial for two weeks </span>
                                </SelectItem>
                                <SelectItem value="pro">
                                    <span class="font-medium">Pro</span> -
                                    <span class="text-muted-foreground"> $9/month per user </span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" @click="showNewTeamDialog = false"> Cancel </Button>
                <Button type="submit"> Continue </Button>
            </DialogFooter>
        </DialogContent> -->
  </Dialog>
</template>

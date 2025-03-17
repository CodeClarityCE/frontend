<script setup lang="ts">
import { ref, type Ref } from 'vue';
import LoadingContainer from '@/base_components/LoadingContainer.vue';
import { LicensePolicy } from '@/codeclarity_components/organizations/policy/license_policy.entity';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import type { PaginatedResponse } from '@/utils/api/responses/PaginatedResponse';
import PaginationComponent from '@/base_components/PaginationComponent.vue';
import { LicensePolicyRepository } from '@/codeclarity_components/organizations/policy/license_policy.repository';
import Button from '@/shadcn/ui/button/Button.vue';
import Badge from '@/shadcn/ui/badge/Badge.vue';
const user = useUserStore();
const auth = useAuthStore();

const selected_license_policy = defineModel<Array<String>>('selected_license_policy', {
    default: ['']
});

const selected_license_policy_object = ref<LicensePolicy>();

const projectRepository: LicensePolicyRepository = new LicensePolicyRepository();

const license_policies_list: Ref<Array<LicensePolicy>> = ref([]);
const license_policies_list_loading_ref: Ref<typeof LoadingContainer | undefined> = ref();
const license_policies_list_loading_error: Ref<any> = ref(null);

const currentPage: Ref<number> = ref(0);
const defaultEntriesPerPage: Ref<number> = ref(3);
const totalPages: Ref<number> = ref(Math.ceil(license_policies_list.value.length / 10));

function retrieveDefaultPolicy() {
    return license_policies_list.value.find((policy) => policy.default === true);
}

// Fetch projects
async function fetchLicensePolicies() {
    if (auth.getAuthenticated && auth.getToken) {
        if (user.defaultOrg?.id === undefined) {
            return;
        }
        let res: PaginatedResponse<LicensePolicy>;
        try {
            res = await projectRepository.getLicensePolicies({
                orgId: user.defaultOrg?.id,
                page: 0,
                entries_per_page: 0,
                search_key: '',
                bearerToken: auth.getToken,
                handleBusinessErrors: true
            });
            console.error(res);
            license_policies_list.value = res.data;
            selected_license_policy_object.value = retrieveDefaultPolicy();
            if (selected_license_policy_object.value)
                selected_license_policy.value = selected_license_policy_object.value?.content;
        } catch (err) {
            license_policies_list_loading_error.value = err;
            license_policies_list_loading_ref.value?.showError();
        } finally {
            license_policies_list_loading_ref.value?.showContent();
        }
    }
}

fetchLicensePolicies();
</script>
<template>
    <div>
        <div class="text-2xl font-medium mb-8">
            Select the license policy to use for the selected analyzers.
            <div class="text-sm text-gray-500 mt-1">
                Using a license policy you can tell our analyzers which licenses are not allowed to
                appear within your projects. If we find such a license, we prioritize them so you
                can quickly see if any forbidden licenses were found during the analysis.
            </div>
        </div>
        <LoadingContainer ref="license_policies_list_loading_ref">
            <template #content>
                <div v-if="license_policies_list.length > 0" class="license-policies-list-wrapper">
                    <div
                        v-if="selected_license_policy_object != null"
                        class="license-policy license-policy-selected"
                    >
                        <div class="license-policy-header">
                            <div>
                                <div>
                                    {{ selected_license_policy_object.name }}
                                    <Badge class="ml-2">Selected</Badge>
                                    <Badge
                                        class="ml-2"
                                        v-if="selected_license_policy_object.default == true"
                                        >Default
                                    </Badge>
                                </div>
                                <div class="text-muted-foreground text-base">
                                    {{ selected_license_policy_object.description }}
                                </div>
                                <div class="text-muted-foreground text-base">
                                    Disallowed licenses:
                                    <span>{{
                                        selected_license_policy_object.content.join(', ')
                                    }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        v-for="license_policy in license_policies_list"
                        :key="license_policy.name"
                        @click="
                            selected_license_policy = license_policy.content;
                            selected_license_policy_object = license_policy;
                        "
                    >
                        <div
                            class="license-policy cursor-pointer"
                            v-if="license_policy.id != selected_license_policy_object?.id"
                        >
                            <div class="license-policy-header">
                                <div>
                                    <div>
                                        {{ license_policy.name }}
                                        <Badge class="ml-2" v-if="license_policy.default == true"
                                            >Default</Badge
                                        >
                                    </div>
                                    <div class="text-muted-foreground text-base">
                                        {{ license_policy.description }}
                                    </div>
                                    <div class="text-muted-foreground text-base">
                                        Disallowed licenses:
                                        <span>{{ license_policy.content.join(', ') }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="text-grayTitle font-normal flex justify-between mt-10">
                        <PaginationComponent
                            v-model:page="currentPage"
                            v-model:nmbEntriesShowing="defaultEntriesPerPage"
                            v-model:nmbEntriesTotal="license_policies_list.length"
                            v-model:totalPages="totalPages"
                        />
                    </div>
                </div>
                <div v-else class="font-semibold text-muted-foreground">
                    You have no license policies. You can create one - if you want -
                    <RouterLink
                        :to="{
                            name: 'org',
                            params: { action: 'add', page: 'policy', orgId: user.getDefaultOrg!.id }
                        }"
                    >
                        <Button variant="link" class="px-0">here</Button> </RouterLink
                    >. A license policy is however not a requirement.
                </div>
            </template>

            <template #error>
                {{ license_policies_list_loading_error }}
            </template>
        </LoadingContainer>
    </div>
</template>

<style scoped lang="scss">
@use '@/assets/colors.scss';

.license-policies-list-wrapper {
    display: flex;
    flex-direction: column;
    row-gap: 10px;
    // font-size: 0.9em;
}

.license-policy {
    border: 1px solid #dfdfdf;
    border-radius: 5px;
}

.license-policy-selected {
    border: 3px solid colors.$accent;
}

.license-policy-header {
    padding: 15px;
    background-color: #fff;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    border-radius: 5px;
    position: relative;
}
</style>

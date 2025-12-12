<script setup lang="ts">
import { ref, type Ref } from 'vue';
import LoadingContainer from '@/base_components/ui/loaders/LoadingContainer.vue';
import { LicensePolicy } from '@/codeclarity_components/organizations/policy/license_policy.entity';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import type { PaginatedResponse } from '@/utils/api/responses/PaginatedResponse';
import PaginationComponent from '@/base_components/utilities/PaginationComponent.vue';
import { LicensePolicyRepository } from '@/codeclarity_components/organizations/policy/license_policy.repository';
import Badge from '@/shadcn/ui/badge/Badge.vue';
import { RouterLink } from 'vue-router';
const user = useUserStore();
const auth = useAuthStore();

const selected_license_policy = defineModel<Array<string>>('selected_license_policy', {
    default: []
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
                    <!-- No Policy Option -->
                    <div
                        v-if="selected_license_policy_object == null"
                        class="license-policy license-policy-selected"
                    >
                        <div class="license-policy-header">
                            <div>
                                <div>
                                    No Policy
                                    <Badge class="ml-2">Selected</Badge>
                                </div>
                                <div class="text-muted-foreground text-base">
                                    Analysis will run without license filtering
                                </div>
                                <div class="text-muted-foreground text-base">
                                    All licenses will be reported without policy restrictions
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        v-else
                        class="license-policy cursor-pointer"
                        @click="
                            selected_license_policy = [];
                            selected_license_policy_object = undefined;
                        "
                    >
                        <div class="license-policy-header">
                            <div>
                                <div>No Policy</div>
                                <div class="text-muted-foreground text-base">
                                    Analysis will run without license filtering
                                </div>
                                <div class="text-muted-foreground text-base">
                                    All licenses will be reported without policy restrictions
                                </div>
                            </div>
                        </div>
                    </div>

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
                                        v-if="selected_license_policy_object.default == true"
                                        class="ml-2"
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
                            v-if="license_policy.id != selected_license_policy_object?.id"
                            class="license-policy cursor-pointer"
                        >
                            <div class="license-policy-header">
                                <div>
                                    <div>
                                        {{ license_policy.name }}
                                        <Badge v-if="license_policy.default == true" class="ml-2"
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
                    <div class="text-gray-700 font-normal flex justify-between mt-10">
                        <PaginationComponent
                            v-model:page="currentPage"
                            v-model:nmb-entries-showing="defaultEntriesPerPage"
                            v-model:nmb-entries-total="license_policies_list.length"
                            v-model:total-pages="totalPages"
                        />
                    </div>
                </div>
                <div v-else class="license-policies-list-wrapper">
                    <!-- No Policy Option - shown when no policies exist -->
                    <div class="license-policy license-policy-selected">
                        <div class="license-policy-header">
                            <div>
                                <div>
                                    No Policy
                                    <Badge class="ml-2">Selected</Badge>
                                </div>
                                <div class="text-muted-foreground text-base">
                                    Analysis will run without license filtering
                                </div>
                                <div class="text-muted-foreground text-base">
                                    All licenses will be reported without policy restrictions
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        class="font-semibold text-muted-foreground mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
                    >
                        <div class="text-blue-800">💡 You have no license policies configured.</div>
                        <div class="text-sm text-blue-700 mt-2">
                            You can create one
                            <RouterLink
                                :to="{
                                    name: 'orgs',
                                    params: {
                                        action: 'add',
                                        page: 'policy',
                                        orgId: user.defaultOrg?.id
                                    }
                                }"
                                class="text-blue-600 hover:text-blue-800 underline font-medium"
                            >
                                here
                            </RouterLink>
                            if you want to restrict specific licenses, but it's completely optional.
                        </div>
                    </div>
                </div>
            </template>

            <template #error>
                {{ license_policies_list_loading_error }}
            </template>
        </LoadingContainer>
    </div>
</template>

<style scoped lang="scss">
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
    border: 3px solid var(--color-accent);
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

<script lang="ts" setup>
import { type AccessTokenBasedIntegration } from '@/codeclarity_components/organizations/integrations/Integrations';
import router from '@/router';
import { Icon } from '@iconify/vue';
import { ref, type Ref } from 'vue';
import { formatDate, formatRelativeTime, getDaysUntilExpiry } from '@/utils/dateUtils';
import FaqBox from '@/base_components/layout/FaqBox.vue';
import { APIErrors } from '@/utils/api/ApiErrors';
import { IntegrationProvider } from '@/codeclarity_components/organizations/integrations/Integrations';
import type { RouteLocationRaw } from 'vue-router';
import SortableTable, {
    type TableHeader
} from '@/base_components/data-display/tables/SortableTable.vue';
import { SortDirection } from '@/utils/api/PaginatedRequestOptions';
import Button from '@/shadcn/ui/button/Button.vue';
import { Alert, AlertDescription } from '@/shadcn/ui/alert';
import { Badge } from '@/shadcn/ui/badge';

// Props
const props = defineProps<{
    provider: IntegrationProvider;
    integration: AccessTokenBasedIntegration;
    updateRoute: RouteLocationRaw;
}>();

const headers: TableHeader[] = [
    {
        label: 'Case',
        key: null
    },
    {
        label: 'Remediation',
        key: null
    }
];

const sortKey: Ref<string> = ref('');
const sortDirection: Ref<SortDirection> = ref(SortDirection.DESC);

// Constants
const EXPIRES_IN_DAYS_RISK = 14;

// State
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref('');

function isAtRisk() {
    if (props.integration && props.integration.expiry_date)
        return getDaysUntilExpiry(props.integration.expiry_date) <= EXPIRES_IN_DAYS_RISK;
    else return false;
}

const emit = defineEmits<{
    (e: 'refresh'): void;
    (e: 'delete'): void;
}>();
</script>
<template>
    <div v-if="error">
        <div class="flex flex-col gap-5 w-fit" style="font-size: 1.5em">
            <div class="flex flex-row gap-2">
                <Icon
                    class="icon user-icon text-5xl w-fit"
                    icon="solar:confounded-square-outline"
                ></Icon>
                <div>
                    <div class="flex flex-col gap-5">
                        <div class="flex flex-col gap-2">
                            <div>We failed to retrieve information on the integration</div>
                            <div v-if="errorCode" style="font-size: 0.7em">
                                <div v-if="errorCode == APIErrors.EntityNotFound">
                                    This integration does not exist.
                                </div>
                                <div v-if="errorCode == APIErrors.NotAuthorized">
                                    You do not have the correct permissions to view this page.
                                </div>
                                <div v-else>
                                    We encountered an error while retrieving the integration
                                    information.
                                </div>
                            </div>
                            <div v-else style="font-size: 0.7em">
                                <div>
                                    We encountered an error while retrieving the integration
                                    information.
                                </div>
                            </div>
                        </div>
                        <div class="flex flex-row gap-2 items-center flex-wrap">
                            <Button
                                v-if="errorCode != APIErrors.NotAuthorized"
                                @click="emit('refresh')"
                            >
                                Try again
                            </Button>
                            <Button @click="router.back()"> Go back </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div v-else class="flex-column flex-column-2rem org-manage-integration-wrapper">
        <div class="flex flex-row gap-8">
            <div class="flex flex-column gap-5">
                <div v-if="isAtRisk()" class="mb-5">
                    <Alert variant="destructive">
                        <AlertDescription>
                            <span class="font-semibold"> Expiry : </span>
                            <span>
                                Your integration token is about to expire. Please use the action
                                'Update/Replace integration token' before the token expires.
                            </span>
                        </AlertDescription>
                    </Alert>
                </div>
                <div class="flex flex-col gap-1">
                    <div class="flex flex-row gap-2 items-center" style="font-size: 2em">
                        <slot name="header-integration-icon"></slot>
                        <slot name="header-integration-name"></slot>
                    </div>
                    <div class="flex flex-col gap-1">
                        <div>
                            <slot name="header-integration-description"></slot>
                        </div>
                        <div>Added on: {{ formatDate(integration.added_on, 'LL') }}</div>
                        <div>
                            Expiry date:
                            <span v-if="integration.expiry_date">
                                {{ formatDate(integration.expiry_date, 'LL') }}
                                <span
                                    v-if="getDaysUntilExpiry(integration.expiry_date) > 0"
                                    :style="{
                                        color: isAtRisk() ? 'red' : 'unset',
                                        'font-weight': isAtRisk() ? 900 : 'unset'
                                    }"
                                >
                                    (expires {{ formatRelativeTime(integration.expiry_date) }})
                                </span>
                                <span v-else style="color: red; font-weight: 900">(Expired)</span>
                            </span>
                            <span v-else>No expiry</span>
                        </div>
                        <div class="flex flex-row gap-1 items-center">
                            <div>Token type:</div>
                            <Badge class="rounded-full gap-1" variant="secondary">
                                <Icon class="icon" icon="solar:key-minimalistic-bold"></Icon>
                                <slot name="token-type"></slot>
                            </Badge>
                        </div>
                        <div class="flex flex-row gap-1 items-center">
                            <div>Status:</div>
                            <div
                                v-if="integration.invalid == false && isAtRisk()"
                                class="general-bubble general-bubble-slim general-bubble-orange"
                                title="Integration token is about to expire. Please use the action 'Update/Replace integration token'."
                            >
                                At Risk
                            </div>
                            <div
                                v-else-if="integration.invalid == true"
                                class="general-bubble general-bubble-slim general-bubble-red"
                                title="Integration token expired or permissions have been modified."
                            >
                                Unhealthy
                            </div>
                            <div
                                v-else-if="integration.invalid == false"
                                class="general-bubble general-bubble-slim general-bubble-green"
                                title="Integration token is healthy."
                            >
                                Healthy
                            </div>
                        </div>
                        <div>
                            <slot name="extra-header-item"></slot>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div>
            <h2 class="text-2xl font-semibold mb-2">Actions</h2>
            <div class="flex flex-row gap-5 flex-wrap faq-wrapper">
                <Button variant="outline" @click="emit('delete')">Delete integration</Button>

                <RouterLink :to="props.updateRoute">
                    <Button variant="outline">Update/Replace integration token</Button>
                </RouterLink>
                <slot name="extra-action"></slot>
            </div>
        </div>
        <div>
            <h2 class="text-2xl font-semibold mb-2">Faq</h2>
            <div class="flex flex-row gap-5 flex-wrap faq-wrapper">
                <FaqBox>
                    <template #question>
                        What does it mean that an integration status is unhealty?
                    </template>
                    <template #answer>
                        An integration becomes unhealthy, in the following circumstances:
                        <ul>
                            <li>
                                The permissions of the token were changed after the initial
                                integration into our platform.
                            </li>
                            <li>The token is invalid or expired.</li>
                            <li>
                                The required permissions of our platform have changed since this
                                token was integrated.
                            </li>
                        </ul>
                    </template>
                </FaqBox>
                <FaqBox>
                    <template #question>
                        What to do when an integration status is unhealty?
                    </template>
                    <template #answer>
                        <SortableTable
                            class="w-full"
                            :headers="headers"
                            :sort-key="sortKey"
                            :sort-direction="sortDirection"
                        >
                            <template #data>
                                <tr>
                                    <td>
                                        <div>The token is invalid or expired.</div>
                                    </td>
                                    <td>
                                        <div>
                                            If the token has expired, you will need to create a new
                                            one. Please use the action 'Update/Replace integration
                                            token' to update the integration with the new token.
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <div>
                                            The permissions of the token were changed after the
                                            initial integration into our platform
                                        </div>
                                    </td>
                                    <td>
                                        <div>
                                            Set the permissions of the token to include these
                                            scopes: <span class="code-bubble">repo</span> and
                                            <span class="code-bubble">write:org</span> scopes.
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <div>
                                            The required permissions of our platform have changed
                                            since this token was integrated.
                                        </div>
                                    </td>
                                    <td>
                                        <div>
                                            No permission changes have been made. Placeholder for
                                            the future.
                                        </div>
                                    </td>
                                </tr>
                            </template>
                        </SortableTable>
                    </template>
                </FaqBox>
                <slot name="extra-faq-item"></slot>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
</style>

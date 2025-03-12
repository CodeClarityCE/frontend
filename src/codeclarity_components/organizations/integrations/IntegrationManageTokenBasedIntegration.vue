<script lang="ts" setup>
import { type AccessTokenBasedIntegration } from '@/codeclarity_components/organizations/integrations/Integrations';
import router from '@/router';
import { Icon } from '@iconify/vue';
import { ref, type Ref } from 'vue';
import moment from 'moment';
import FaqBox from '@/base_components/FaqBox.vue';
import CenteredModal from '@/base_components/CenteredModal.vue';
import { APIErrors } from '@/utils/api/ApiErrors';
import { IntegrationProvider } from '@/codeclarity_components/organizations/integrations/Integrations';
import type { RouteLocationRaw } from 'vue-router';
import BorderCard from '@/base_components/cards/BorderCard.vue';
import SortableTable, { type TableHeader } from '@/base_components/tables/SortableTable.vue';
import { SortDirection } from '@/utils/api/PaginatedRequestOptions';
import InfoBoxRed from '@/base_components/info_box/InfoBoxRed.vue';
import Button from '@/shadcn/ui/button/Button.vue';

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

enum ModalAction {
    DELETE = 'DELETE',
    NONE = ''
}

// Constants
const EXPIRES_IN_DAYS_RISK = 14;

// State
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref('');
const centeredModalRef: any = ref(null);
const centeredModalAction: Ref<ModalAction> = ref(ModalAction.NONE);

function openModalAction(action: ModalAction) {
    centeredModalAction.value = action;
    if (centeredModalRef.value) centeredModalRef.value.toggle();
}

async function performModalAction() {
    try {
        if (centeredModalAction.value == ModalAction.DELETE) {
            emit('delete');
        }
    } finally {
        centeredModalAction.value = ModalAction.NONE;
        if (centeredModalRef.value) centeredModalRef.value.toggle();
    }
}

function isAtRisk() {
    if (props.integration && props.integration.expiry_date)
        return (
            moment.duration(moment(props.integration.expiry_date).diff(new Date())).asDays() <=
            EXPIRES_IN_DAYS_RISK
        );
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
                <Icon class="icon user-icon" icon="solar:confounded-square-outline"
                    style="font-size: 3rem; height: fit-content"></Icon>
                <div>
                    <div class="flex flex-col gap-5">
                        <div class="flex flex-col gap-2">
                            <div>We failed to retrieve information on the integration</div>
                            <div style="font-size: 0.7em" v-if="errorCode">
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
                            <div style="font-size: 0.7em" v-else>
                                <div>
                                    We encountered an error while retrieving the integration
                                    information.
                                </div>
                            </div>
                        </div>
                        <div class="flex flex-row gap-2 items-center flex-wrap">
                            <Button v-if="errorCode != APIErrors.NotAuthorized" @click="emit('refresh')">
                                Try again
                            </Button>
                            <Button @click="router.back()">
                                Go back
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="flex-column flex-column-2rem org-manage-integration-wrapper" v-else>
        <div class="flex flex-row gap-8">
            <div class="flex flex-column gap-5">
                <div v-if="isAtRisk()" class="mb-5">
                    <InfoBoxRed>
                        <template #content>
                            <span class="font-semibold"> Expiry : </span>
                            <span>
                                Your integration token is about to expire. Please use the action
                                'Update/Replace integration token' before the token expires.
                            </span>
                        </template>
                    </InfoBoxRed>
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
                        <div>Added on: {{ moment(integration.added_on).format('LL') }}</div>
                        <div>
                            Expiry date:
                            <span v-if="integration.expiry_date">
                                {{ moment(integration.expiry_date).format('LL') }}
                                <span v-if="
                                    moment
                                        .duration(
                                            moment(integration.expiry_date).diff(new Date())
                                        )
                                        .asDays() > 0
                                " :style="{
                                    color: isAtRisk() ? 'red' : 'unset',
                                    'font-weight': isAtRisk() ? 900 : 'unset'
                                }">
                                    (expires {{ moment(integration.expiry_date).fromNow() }})
                                </span>
                                <span v-else style="color: red; font-weight: 900">(Expired)</span>
                            </span>
                            <span v-else>No expiry</span>
                        </div>
                        <div class="flex flex-row gap-1 items-center">
                            <div>Token type:</div>
                            <div class="general-bubble general-bubble-slim">
                                <Icon class="icon" icon="solar:key-minimalistic-bold"></Icon>
                                <slot name="token-type"></slot>
                            </div>
                        </div>
                        <div class="flex flex-row gap-1 items-center">
                            <div>Status:</div>
                            <div v-if="integration.invalid == false && isAtRisk()"
                                class="general-bubble general-bubble-slim general-bubble-orange"
                                title="Integration token is about to expire. Please use the action 'Update/Replace integration token'.">
                                At Risk
                            </div>
                            <div v-else-if="integration.invalid == true"
                                class="general-bubble general-bubble-slim general-bubble-red"
                                title="Integration token expired or permissions have been modified.">
                                Unhealthy
                            </div>
                            <div v-else-if="integration.invalid == false"
                                class="general-bubble general-bubble-slim general-bubble-green"
                                title="Integration token is healthy.">
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
                <div title="Delete the integration">
                    <BorderCard :slim="true" :hover="true" @click="openModalAction(ModalAction.DELETE)">
                        <template #title>Delete integration</template>
                    </BorderCard>
                </div>

                <RouterLink title="Update/Replace the integration token" :to="props.updateRoute">
                    <BorderCard :hover="true" :slim="true">
                        <template #title> Update/Replace integration token </template>
                    </BorderCard>
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
                        <SortableTable class="w-full" :headers="headers" :sortKey="sortKey"
                            :sortDirection="sortDirection">
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
    <CenteredModal ref="centeredModalRef">
        <template #title>
            <div>
                <div v-if="centeredModalAction == ModalAction.DELETE">Delete the integration?</div>
            </div>
        </template>
        <template #content>
            <div class="flex flex-col gap-4" style="max-width: 400px; width: 100vw">
                <template v-if="centeredModalAction == ModalAction.DELETE">
                    <div>Are you sure you want to delete the integration?</div>
                    <InfoBoxRed>
                        <template #content>
                            <div>
                                This might cause currently running analyses to fail. And other side
                                effects are also expected!
                            </div>
                        </template>
                    </InfoBoxRed>
                    <div>You can always add a new integration.</div>
                </template>
            </div>
        </template>
        <template #buttons>
            <Button v-if="centeredModalAction == ModalAction.DELETE" variant="destructive"
                @click="performModalAction()">
                <Icon icon="solar:trash-bin-trash-bold"></Icon>
            </Button>
            <Button variant="outline" @click="centeredModalRef.toggle()">
                Cancel
            </Button>
        </template>
    </CenteredModal>
</template>

<style scoped lang="scss">
@use '@/assets/colors.scss';
</style>

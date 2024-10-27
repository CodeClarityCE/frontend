<script lang="ts" setup>
import { ActionSeverity, AuditLog } from '@/repositories/types/entities/AuditLog';
import type { Organization } from '@/repositories/types/entities/Organization';
import { MemberRole } from '@/repositories/types/entities/Organization';
import moment from 'moment';

defineProps<{
    log: AuditLog;
    orgInfo: Organization;
}>();
</script>
<template>
    <tr>
        <td>
            <div>
                <div class="log-severity-wrapper">
                    <div
                        class="log-severity-critical"
                        v-if="log.action_severity == ActionSeverity.Critical"
                    ></div>
                    <div
                        class="log-severity-high"
                        v-if="log.action_severity == ActionSeverity.High"
                    ></div>
                    <div
                        class="log-severity-medium"
                        v-if="log.action_severity == ActionSeverity.Medium"
                    ></div>
                    <div
                        class="log-severity-low"
                        v-if="log.action_severity == ActionSeverity.Low"
                    ></div>
                </div>
            </div>
        </td>
        <td>
            <div>
                {{ log.action_class }}
            </div>
        </td>
        <td>
            <div>
                {{ log.action }}
            </div>
        </td>
        <td>
            <div>
                {{ log.description }}
            </div>
        </td>
        <td>
            <div v-if="log.blame_on" class="flex flex-row gap-2 items-center flex-aic">
                <div>
                    <div
                        class="org-membership membership-owner"
                        v-if="log.blame_on.role == MemberRole.OWNER"
                    >
                        Owner
                    </div>
                    <div
                        class="org-membership membership-admin"
                        v-if="log.blame_on.role == MemberRole.ADMIN"
                    >
                        Admin
                    </div>
                    <div
                        class="org-membership membership-moderator"
                        v-if="log.blame_on.role == MemberRole.MODERATOR"
                    >
                        Moderator
                    </div>
                    <div
                        class="org-membership membership-user"
                        v-if="log.blame_on.role == MemberRole.USER"
                    >
                        User
                    </div>
                </div>
                <div>
                    {{ log.blame_on.email }}
                </div>
            </div>
            <div v-else>
                <div title="This user is no longer part of the org.">{{ log.blame_on_email }}</div>
            </div>
        </td>
        <td>
            <div>
                {{ moment(log.created_on).fromNow() }}
            </div>
        </td>
    </tr>
</template>
<style scoped lang="scss">
@import '@/assets/colors.scss';

.org-membership {
    border-radius: 15px;
    padding: 3px;
    padding-left: 8px;
    padding-right: 8px;
    background-color: gray;
    color: #fff;
    width: fit-content;
    font-weight: 900;
    font-size: 0.9em;
}

.membership-owner {
    background-color: #dab909;
}

.membership-admin {
    background-color: #e63434;
}

.membership-moderator {
    background-color: $accent;
}

.membership-user {
    background-color: #808e64;
}

.log-severity-wrapper {
    * {
        border-radius: 50%;
        width: 12px;
        height: 12px;
        background-color: gray;
        margin-left: 10px;
    }

    .log-severity-critical {
        background-color: $severity-critical;
    }

    .log-severity-high {
        background-color: $severity-high;
    }

    .log-severity-medium {
        background-color: $severity-medium;
    }

    .log-severity-low {
        background-color: $severity-low;
    }
}
</style>

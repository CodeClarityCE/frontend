<script lang="ts" setup>
import {
    ActionSeverity,
    type AuditLog
} from '@/codeclarity_components/organizations/audit_logs/AuditLog';
import { MemberRole, type Organization } from '@/codeclarity_components/organizations/organization.entity';
import { formatRelativeTime } from '@/utils/dateUtils';

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
                        v-if="log.action_severity === ActionSeverity.Critical"
                        class="log-severity-critical"
                    ></div>
                    <div
                        v-if="log.action_severity === ActionSeverity.High"
                        class="log-severity-high"
                    ></div>
                    <div
                        v-if="log.action_severity === ActionSeverity.Medium"
                        class="log-severity-medium"
                    ></div>
                    <div
                        v-if="log.action_severity === ActionSeverity.Low"
                        class="log-severity-low"
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
                        v-if="log.blame_on.role === MemberRole.OWNER"
                        class="org-membership membership-owner"
                    >
                        Owner
                    </div>
                    <div
                        v-if="log.blame_on.role === MemberRole.ADMIN"
                        class="org-membership membership-admin"
                    >
                        Admin
                    </div>
                    <div
                        v-if="log.blame_on.role === MemberRole.MODERATOR"
                        class="org-membership membership-moderator"
                    >
                        Moderator
                    </div>
                    <div
                        v-if="log.blame_on.role === MemberRole.USER"
                        class="org-membership membership-user"
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
                {{ formatRelativeTime(log.created_on) }}
            </div>
        </td>
    </tr>
</template>
<style scoped lang="scss">
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
    background-color: var(--color-accent);
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
        background-color: var(--color-severity-critical);
    }

    .log-severity-high {
        background-color: var(--color-severity-high);
    }

    .log-severity-medium {
        background-color: var(--color-severity-medium);
    }

    .log-severity-low {
        background-color: var(--color-severity-low);
    }
}
</style>

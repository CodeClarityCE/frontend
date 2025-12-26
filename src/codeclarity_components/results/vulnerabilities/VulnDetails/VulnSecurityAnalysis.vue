<script setup lang="ts">
import Badge from '@/shadcn/ui/badge/Badge.vue';
import { Icon } from '@iconify/vue';
import type { VulnerabilityDetails } from './VulnDetails.ts';

defineProps<{
    finding: VulnerabilityDetails;
    getSeverityLevel: (
        finding: VulnerabilityDetails
    ) => 'critical' | 'high' | 'medium' | 'low' | 'none';
    getCriticalHighCount: (finding: VulnerabilityDetails) => number;
    getMediumLowCount: (finding: VulnerabilityDetails) => string;
}>();
</script>
<template>
    <div class="vulnerability-content">
        <!-- Severity Distribution -->
        <div class="severity-breakdown">
            <h3 class="breakdown-title">Severity Distribution</h3>
            <div class="severity-grid">
                <div class="severity-item critical">
                    <Icon icon="solar:danger-triangle-bold" class="severity-icon" />
                    <span class="severity-count">{{
                        getSeverityLevel(finding) === 'critical' ? 1 : 0
                    }}</span>
                    <span class="severity-label">Critical</span>
                </div>
                <div class="severity-item high">
                    <Icon icon="solar:shield-warning-bold" class="severity-icon" />
                    <span class="severity-count">{{
                        getSeverityLevel(finding) === 'high' ? 1 : 0
                    }}</span>
                    <span class="severity-label">High</span>
                </div>
                <div class="severity-item medium">
                    <Icon icon="solar:shield-check-bold" class="severity-icon" />
                    <span class="severity-count">{{
                        getSeverityLevel(finding) === 'medium' ? 1 : 0
                    }}</span>
                    <span class="severity-label">Medium</span>
                </div>
                <div class="severity-item low">
                    <Icon icon="solar:shield-bold" class="severity-icon" />
                    <span class="severity-count">{{
                        getSeverityLevel(finding) === 'low' ? 1 : 0
                    }}</span>
                    <span class="severity-label">Low</span>
                </div>
            </div>
        </div>
        <!-- Security Recommendations -->
        <div class="security-recommendations">
            <h3 class="breakdown-title">Recommendations</h3>
            <div class="recommendation-list">
                <div v-if="getCriticalHighCount(finding) > 0" class="recommendation-item critical">
                    <Icon icon="solar:danger-triangle-bold" class="recommendation-icon" />
                    <div class="recommendation-content">
                        <span class="recommendation-title">Immediate Attention Required</span>
                        <span class="recommendation-desc"
                            >{{ getCriticalHighCount(finding) }} critical/high severity
                            vulnerabilities need immediate remediation</span
                        >
                    </div>
                </div>
            </div>
        </div>
        <!-- Vulnerability List -->
        <div class="vulnerability-list">
            <h3 class="breakdown-title">Vulnerability Identifier</h3>
            <div class="vulnerability-items">
                <Badge
                    v-if="finding?.vulnerability_info?.vulnerability_id !== undefined"
                    :key="finding.vulnerability_info.vulnerability_id"
                    variant="destructive"
                    class="vulnerability-badge"
                    :title="`Click to view details for ${finding.vulnerability_info.vulnerability_id}`"
                >
                    {{ finding.vulnerability_info.vulnerability_id }}
                </Badge>
            </div>
        </div>
    </div>
</template>
<style scoped lang="scss">
.vulnerability-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}
.breakdown-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #222;
    margin-bottom: 1rem;
}
.severity-breakdown {
    .severity-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 1rem;
    }
    .severity-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        background: white;
        transition: all 0.2s ease-in-out;
        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        &.critical {
            border-left: 4px solid #dc2626;
            .severity-icon {
                color: #dc2626;
            }
        }
        &.high {
            border-left: 4px solid #ea580c;
            .severity-icon {
                color: #ea580c;
            }
        }
        &.medium {
            border-left: 4px solid #d97706;
            .severity-icon {
                color: #d97706;
            }
        }
        &.low {
            border-left: 4px solid #1dce79;
            .severity-icon {
                color: #1dce79;
            }
        }
    }
    .severity-icon {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
    }
    .severity-count {
        font-size: 1.5rem;
        font-weight: 700;
        color: #222;
        margin-bottom: 0.25rem;
    }
    .severity-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
}
.vulnerability-list {
    .vulnerability-items {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }
    .vulnerability-badge {
        font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
        font-size: 0.8rem;
        font-weight: 500;
        transition: all 0.2s ease-in-out;
        &:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
    }
}
.security-recommendations {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}
.recommendation-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
.recommendation-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem;
    border-radius: 8px;
    border: 2px solid transparent;
    transition: all 0.2s ease-in-out;
    &.critical {
        background: #fef2f2;
        border-color: rgba(220, 38, 38, 0.2);
        .recommendation-icon {
            color: #dc2626;
        }
    }
}
.recommendation-icon {
    font-size: 1.25rem;
    margin-top: 0.125rem;
    flex-shrink: 0;
}
.recommendation-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}
.recommendation-title {
    font-weight: 600;
    font-size: 0.95rem;
    color: #222;
}
.recommendation-desc {
    font-size: 0.875rem;
    color: #666;
    line-height: 1.4;
}
</style>

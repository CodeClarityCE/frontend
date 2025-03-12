<script setup lang="ts">
defineProps({
    critical: {
        type: Boolean,
        required: false
    },
    high: {
        type: Boolean,
        required: false
    },
    medium: {
        type: Boolean,
        required: false
    },
    low: {
        type: Boolean,
        required: false
    },
    none: {
        type: Boolean,
        required: false
    },
    deactivated: {
        type: Boolean,
        required: false
    }
});
</script>
<template>
    <div class="severity-bar severity-bar-slim">
        <div class="severity-box" v-if="critical">
            <div class="severity-class" :class="{ 'severity-class-critical': !deactivated }">C</div>
            <div class="severity-value" :class="{ 'severity-value-critical': !deactivated }">
                <slot name="critical"></slot>
                <slot name="content"></slot>
            </div>
        </div>
        <div class="severity-box" v-if="high">
            <div class="severity-class" :class="{ 'severity-class-high': !deactivated }">H</div>
            <div class="severity-value" :class="{ 'severity-value-high': !deactivated }">
                <slot name="high"></slot>
                <slot name="content"></slot>
            </div>
        </div>
        <div class="severity-box" v-if="medium">
            <div class="severity-class" :class="{ 'severity-class-medium': !deactivated }">M</div>
            <div class="severity-value" :class="{ 'severity-value-medium': !deactivated }">
                <slot name="medium"></slot>
                <slot name="content"></slot>
            </div>
        </div>
        <div class="severity-box" v-if="low">
            <div class="severity-class" :class="{ 'severity-class-low': !deactivated }">L</div>
            <div class="severity-value" :class="{ 'severity-value-low': !deactivated }">
                <slot name="low"></slot>
                <slot name="content"></slot>
            </div>
        </div>
        <div class="severity-box" v-if="none">
            <div class="severity-class" :class="{ 'severity-class-none': !deactivated }">N</div>
            <div class="severity-value" :class="{ 'severity-value-none': !deactivated }">
                <slot name="none"></slot>
                <slot name="content"></slot>
            </div>
        </div>
    </div>
</template>


<style scoped lang="scss">
@use '@/assets/colors.scss';

.severity-bar {
    display: flex;
    flex-direction: row;
    column-gap: 3px;
}

.severity-box {
    display: flex;
    flex-direction: row;
}

.severity-bar .severity-box .severity-class {
    width: 25px;
    border-radius: 5px;
    background-color: #acacac;
    color: white;
    padding: 5px;
    text-align: center;
    z-index: 1;
}

.severity-grid .severity-box .severity-class {
    flex-shrink: 0;
}

.severity-bar-slim .severity-box .severity-class {
    padding: 2px;
    padding-left: 6px;
    padding-right: 6px;
    width: unset;
}

.severity-bar .severity-box .severity-value {
    align-self: center;
    padding: 5px;
    padding-left: 15px;
    padding-right: 10px;
    background-color: #d3d3d3;
    margin-left: -5px;
    z-index: 0;
    border-radius: 5px;
    color: #605e5e;
}

.severity-bar-slim .severity-box .severity-value {
    padding: 2px;
    padding-left: 10px;
    padding-right: 5px;
}

.severity-bar .severity-box .severity-class-disabled {
    background-color: colors.$severity-bar-class-disabled !important;
}

.severity-bar .severity-box .severity-value-disabled {
    background-color: colors.$severity-bar-value-disabled !important;
}

.severity-bar .severity-box .severity-class-critical {
    background-color: colors.$severity-bar-class-critical;
}

.severity-bar .severity-box .severity-value-critical {
    background-color: colors.$severity-bar-value-critical;
}

.severity-bar .severity-box .severity-class-high {
    background-color: colors.$severity-bar-class-high;
}

.severity-bar .severity-box .severity-value-high {
    background-color: colors.$severity-bar-value-high;
}

.severity-bar .severity-box .severity-class-medium {
    background-color: colors.$severity-bar-class-medium;
}

.severity-bar .severity-box .severity-value-medium {
    background-color: colors.$severity-bar-value-medium;
}

.severity-bar .severity-box .severity-class-low {
    background-color: colors.$severity-bar-class-low;
}

.severity-bar .severity-box .severity-value-low {
    background-color: colors.$severity-bar-value-low;
}

.severity-bar .severity-box .severity-class-none {
    background-color: colors.$severity-bar-class-none;
}

.severity-bar .severity-box .severity-value-none {
    background-color: colors.$severity-bar-value-none;
}

#summary-findings-severity-bar .severity-box .severity-class {
    width: 75px;
}
</style>

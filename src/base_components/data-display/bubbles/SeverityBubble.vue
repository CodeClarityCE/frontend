<script setup lang="ts">
defineProps({
  critical: {
    type: Boolean,
    required: false,
  },
  high: {
    type: Boolean,
    required: false,
  },
  medium: {
    type: Boolean,
    required: false,
  },
  low: {
    type: Boolean,
    required: false,
  },
  none: {
    type: Boolean,
    required: false,
  },
  deactivated: {
    type: Boolean,
    required: false,
  },
});
</script>
<template>
  <div class="flex flex-row gap-1">
    <div v-if="critical" class="flex flex-row">
      <div
        class="px-1.5 py-0.5 text-white text-center z-10 rounded-md"
        :class="{
          'severity-class-critical': !deactivated,
          'bg-gray-400': deactivated,
        }"
      >
        C
      </div>
      <div
        class="px-2 py-0.5 pl-2.5 pr-1.5 -ml-1.5 z-0 rounded-md text-gray-600"
        :class="{
          'severity-value-critical': !deactivated,
          'bg-gray-200': deactivated,
        }"
      >
        <slot name="critical"></slot>
        <slot name="content"></slot>
      </div>
    </div>
    <div v-if="high" class="flex flex-row">
      <div
        class="px-1.5 py-0.5 text-white text-center z-10 rounded-md"
        :class="{
          'severity-class-high': !deactivated,
          'bg-gray-400': deactivated,
        }"
      >
        H
      </div>
      <div
        class="severity-value"
        :class="{ 'severity-value-high': !deactivated }"
      >
        <slot name="high"></slot>
        <slot name="content"></slot>
      </div>
    </div>
    <div v-if="medium" class="flex flex-row">
      <div
        class="px-1.5 py-0.5 text-white text-center z-10 rounded-md"
        :class="{
          'severity-class-medium': !deactivated,
          'bg-gray-400': deactivated,
        }"
      >
        M
      </div>
      <div
        class="severity-value"
        :class="{ 'severity-value-medium': !deactivated }"
      >
        <slot name="medium"></slot>
        <slot name="content"></slot>
      </div>
    </div>
    <div v-if="low" class="flex flex-row">
      <div
        class="px-1.5 py-0.5 text-white text-center z-10 rounded-md"
        :class="{
          'severity-class-low': !deactivated,
          'bg-gray-400': deactivated,
        }"
      >
        L
      </div>
      <div
        class="severity-value"
        :class="{ 'severity-value-low': !deactivated }"
      >
        <slot name="low"></slot>
        <slot name="content"></slot>
      </div>
    </div>
    <div v-if="none" class="flex flex-row">
      <div
        class="px-1.5 py-0.5 text-white text-center z-10 rounded-md"
        :class="{
          'severity-class-none': !deactivated,
          'bg-gray-400': deactivated,
        }"
      >
        N
      </div>
      <div
        class="severity-value"
        :class="{ 'severity-value-none': !deactivated }"
      >
        <slot name="none"></slot>
        <slot name="content"></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Severity color classes using CSS variables from theme */
.severity-class-disabled {
  background-color: var(--color-severity-bar-class-disabled) !important;
}

.severity-value-disabled {
  background-color: var(--color-severity-bar-value-disabled) !important;
}

.severity-class-critical {
  background-color: var(--color-severity-bar-class-critical);
}

.severity-value-critical {
  background-color: var(--color-severity-bar-value-critical);
}

.severity-class-high {
  background-color: var(--color-severity-bar-class-high);
}

.severity-value-high {
  background-color: var(--color-severity-bar-value-high);
}

.severity-class-medium {
  background-color: var(--color-severity-bar-class-medium);
}

.severity-value-medium {
  background-color: var(--color-severity-bar-value-medium);
}

.severity-class-low {
  background-color: var(--color-severity-bar-class-low);
}

.severity-value-low {
  background-color: var(--color-severity-bar-value-low);
}

.severity-class-none {
  background-color: var(--color-severity-bar-class-none);
}

.severity-value-none {
  background-color: var(--color-severity-bar-value-none);
}

/* For wider severity displays */
#summary-findings-severity-bar .severity-class-critical,
#summary-findings-severity-bar .severity-class-high,
#summary-findings-severity-bar .severity-class-medium,
#summary-findings-severity-bar .severity-class-low,
#summary-findings-severity-bar .severity-class-none {
  width: 75px;
}
</style>

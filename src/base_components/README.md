# Reusable Card Components

This directory contains two reusable card components that can be used across different pages in the application.

## StatCard

A reusable card component for displaying statistics with an icon, label, value, and optional subtitle.

### Props

- `label` (string, required): The label/title for the statistic
- `value` (string | number, required): The main value to display
- `icon` (string, required): Iconify icon name
- `subtitle` (string, optional): Additional information text
- `subtitleIcon` (string, optional): Icon for the subtitle
- `variant` ('default' | 'primary' | 'danger' | 'success', optional): Visual variant

### Usage Example

```vue
<template>
    <StatCard
        label="Critical Issues"
        :value="14"
        icon="solar:danger-triangle-bold"
        subtitle-icon="solar:arrow-up-linear"
        subtitle="+2 this week"
        variant="default"
    />

    <StatCard
        label="Security Score"
        :value="7.8"
        icon="solar:shield-check-bold"
        subtitle-icon="solar:shield-check-linear"
        subtitle="Good standing"
        variant="primary"
    />
</template>

<script setup>
import StatCard from '@/base_components/StatCard.vue';
</script>
```

### Slots

- `subtitle`: Custom content for subtitle area (alternative to `subtitle` prop)

## InfoCard

A versatile, reusable card component for displaying any type of information with a header and body content. Perfect for dashboards, reports, data displays, content sections, or any structured information presentation across different pages.

### Props

- `title` (string, required): The card title
- `description` (string, optional): Description text under the title
- `icon` (string, required): Iconify icon name for the header
- `variant` ('default' | 'primary' | 'danger' | 'success' | 'warning', optional): Visual variant

### Usage Example

```vue
<template>
    <InfoCard
        title="Vulnerability Exposure Overview"
        description="Total severity of vulnerabilities across all your projects"
        icon="solar:chart-square-bold"
        variant="primary"
    >
        <!-- Your content goes here -->
        <ExposureOverview :integration-ids="activeIntegrationIds" />
    </InfoCard>

    <InfoCard title="Recent Activity" icon="solar:history-bold" variant="default">
        <template #actions>
            <Button variant="outline" size="sm">
                <Icon icon="solar:refresh-linear" class="h-4 w-4" />
                Refresh
            </Button>
        </template>

        <!-- Activity list content -->
        <div class="space-y-4">
            <!-- Activity items -->
        </div>
    </InfoCard>
</template>

<script setup>
import InfoCard from '@/base_components/InfoCard.vue';
import { Icon } from '@iconify/vue';
import Button from '@/shadcn/ui/button/Button.vue';
</script>
```

### Slots

- `default`: Main content area
- `actions`: Action buttons/controls in the header (optional)

## Variants

Both components support different visual variants:

- `default`: Standard appearance with black accents
- `primary`: Theme primary color accents
- `danger`: Red color scheme for critical/error states
- `success`: Green color scheme for positive states
- `warning`: Amber color scheme for warning states (InfoCard only)

## Features

- Responsive design
- Hover animations and transitions
- Consistent styling across the application
- Flexible content through slots
- Multiple visual variants
- Accessibility considerations
- TypeScript support

# Base Components Library

This directory contains a well-organized collection of reusable components that can be used across different pages in the application.

## Directory Structure

```
base_components/
├── ui/                     # Basic UI components
│   ├── cards/             # Card components
│   ├── loaders/           # Loading components
│   ├── modals/            # Modal components
│   └── buttons/           # Button components
├── data-display/          # Data visualization components
│   ├── charts/           # Chart components
│   ├── tables/           # Table components
│   └── bubbles/          # Bubble components
├── forms/                 # Form-related components
├── filters/               # Filter and search components
├── layout/                # Layout and container components
├── utilities/             # Utility components
└── markdown/              # Markdown components
```

## Component Categories

### 🎨 UI Components (`ui/`)

#### Cards (`ui/cards/`)

- **StatCard**: Display statistics with icons and values
- **InfoCard**: Versatile information display card

#### Loaders (`ui/loaders/`)

- **LoadingComponent**: General loading indicator
- **LoadingButton**: Button with loading state
- **LoadingSubmitButton**: Submit button with loading state
- **LoadingContainer**: Container with loading overlay
- **BoxLoader**: Box-style loading animation
- **DonutLoader**: Donut-style loading animation
- **TextLoader**: Text placeholder loading

#### Modals (`ui/modals/`)

- **CenteredModal**: Centered modal dialog
- **PositionedModal**: Positioned modal with custom placement

### 📊 Data Display (`data-display/`)

#### Charts (`data-display/charts/`)

- **BarChart**: Bar chart visualization
- **DoughnutChart**: Doughnut chart
- **LineChart**: Line chart
- **RadarChart**: Radar/spider chart
- **TreeChart**: Tree structure chart
- **TreeChartLegend**: Legend for tree charts
- **WaffleChart**: Waffle chart visualization

#### Tables (`data-display/tables/`)

- **SortableTable**: Table with sorting capabilities
- **SortSelector**: Sort control component

#### Bubbles (`data-display/bubbles/`)

- **BubbleComponent**: General bubble component
- **SeverityBubble**: Severity level bubble

### 📝 Forms (`forms/`)

- **FormTextField**: Text input field
- **FormSelectField**: Select dropdown field
- **FormSelectLicense**: License selection field
- **FormInlineCheckboxField**: Inline checkbox field

### 🔍 Filters (`filters/`)

- **SearchBar**: Search input component
- **ActiveFilterBar**: Display active filters
- **UtilitiesFilters**: Filter utility functions

### 📐 Layout (`layout/`)

- **ExpandableBox**: Collapsible content container
- **FaqBox**: FAQ-style expandable box

### 🛠️ Utilities (`utilities/`)

- **ErrorComponent**: Error display component
- **PaginationComponent**: Pagination controls
- **SemverToString**: Semantic version formatter
- **UtilitiesSort**: Sorting utilities

### 📖 Markdown (`markdown/`)

- **InfoMarkdown**: Markdown content renderer

## Icons

Lucide (`@lucide/vue`) is the only general icon set. Use it for every icon that is not a logo.

Brand and language logos are the only exception. Use `simple-icons:<name>` (brands) or `devicon:<name>` (languages and tools) with Iconify's `<Icon>`. `vite-plugin-logo-icons.ts` bundles every logo id it finds in `src/`, so they are never fetched at runtime. Write the id as a full string literal, or the plugin cannot find it.

## Usage Examples

### Using Card Components

```vue
<template>
  <!-- Statistics Card -->
  <StatCard
    label="Critical Issues"
    :value="14"
    icon="solar:danger-triangle-bold"
    subtitle-icon="solar:arrow-up-linear"
    subtitle="+2 this week"
    variant="default"
  />

  <!-- Information Card -->
  <InfoCard
    title="Vulnerability Overview"
    description="Security analysis results"
    icon="solar:chart-square-bold"
    variant="primary"
  >
    <YourContent />
  </InfoCard>
</template>

<script setup>
import { StatCard, InfoCard } from "@/base_components";
</script>
```

### Using Data Display Components

```vue
<template>
  <!-- Chart -->
  <BarChart :data="chartData" :options="chartOptions" />

  <!-- Table -->
  <SortableTable :data="tableData" :columns="columns" />
</template>

<script setup>
import { BarChart, SortableTable } from "@/base_components";
</script>
```

### Using Form Components

```vue
<template>
  <FormTextField
    v-model="inputValue"
    label="Username"
    placeholder="Enter username"
  />

  <FormSelectField
    v-model="selectedOption"
    label="Category"
    :options="categoryOptions"
  />
</template>

<script setup>
import { FormTextField, FormSelectField } from "@/base_components";
</script>
```

## Component Variants

Many components support visual variants:

- **default**: Standard appearance
- **primary**: Theme primary color
- **danger**: Red color scheme for errors/critical states
- **success**: Green color scheme for positive states
- **warning**: Amber color scheme for warnings

## Import Methods

### Individual Imports

```javascript
import { StatCard, InfoCard, BarChart } from "@/base_components";
```

### Direct Path Imports

```javascript
import StatCard from "@/base_components/ui/cards/StatCard.vue";
import BarChart from "@/base_components/data-display/charts/BarChart.vue";
```

## Features

- 🎨 **Consistent Design**: All components follow the same design system
- 📱 **Responsive**: Mobile-first responsive design
- ♿ **Accessible**: Built with accessibility in mind
- 🎭 **Themeable**: Support for multiple visual variants
- 📝 **TypeScript**: Full TypeScript support
- 🔧 **Flexible**: Extensive customization through props and slots
- ⚡ **Performance**: Optimized for performance
- 🧪 **Tested**: Thoroughly tested components

## Contributing

When adding new components:

1. Place them in the appropriate category directory
2. Update the exports in `index.ts`
3. Update this README with component documentation
4. Follow the existing naming conventions
5. Include TypeScript interfaces for props

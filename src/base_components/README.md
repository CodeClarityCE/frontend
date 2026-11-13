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
├── charts/                # The shared chart layer (the only chart system)
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

### Page building blocks (`page/`, `data-table/`)

Shared pieces for migrated pages. Build new screens from these and the shadcn components in `@/shadcn/ui`.

- **PageHeading** (`@/base_components/page`): the page `<h1>`. Default slot is the title; slots `badge` (next to the title), `description` (or the `description` prop) and `actions` (buttons on the right).
- **BrandEmphasis**: wrap the key word of a title to give it the green mark: `<PageHeading>New <BrandEmphasis>Dataset</BrandEmphasis></PageHeading>`.
- **StatTile**: one number with a `label`, a `value` and an optional `hint`. It renders an `<li>`, so put tiles in a `<ul aria-label="...">`.
- **StatusBadge**: a status in words with the shared status colours. Props `tone` (`success`, `warning`, `danger`, `neutral`), `label`, and `busy` for a spinner.
- **SeverityBadge**: a severity in words ("Critical", "High", ...) on the severity ramp, never brand green. Pass a CVSS `score` (also shown) or a `level`; `severityLevel()` in `@/utils/severity` gives the band of a score.
- **OwlEmptyState**: the owl, a `title`, a `description` (prop or slot) and the next step in the default slot, usually `<Button :as="RouterLink" to="..." arrow>`.
- **DataTable** (`@/base_components/data-table`): tanstack table on the shadcn `Table`, with sorting, an optional filter box and pagination, all on the rows it is given (load every row first). Props:
  - `columns` (tanstack `ColumnDef[]`; the `header` string labels the sort button; `enableSorting: false` or `enableGlobalFilter: false` opt a column out), `data`, `caption` (screen reader name);
  - `filterLabel` shows the filter box, `pageSize` (20), `initialSorting`, `emptyText`, `rowKey`;
  - `loading` shows a `Skeleton` table in a `status` named "Loading <caption>".
  - Render a cell with a `#cell-<column id>="{ row, value }"` slot, or with the column's `cell` function.
  - Server-side mode, for lists too long to load at once: pass `total` (the number of matching rows on the server) and `data` becomes one page. Bind `v-model:page-index`, listen to `@update:sorting` (column ids are the sort keys) and, with `filterLabel`, bind `v-model:filter`; then load the page they describe. Pass `loading` only for the first load, so the table stays in place while later pages load. The vulnerability table is the example.

`Skeleton` (`@/shadcn/ui/skeleton`) is the only loader for new code: shape it like the content it replaces and wrap it in `role="status"` with an `aria-label`.

### Button (`@/shadcn/ui/button`)

The landing page's shape: pill radius and a green shadow on the primary variant. Variants are unchanged (`default`, `destructive` in red, `outline`, `secondary`, `ghost`, `link`). The `arrow` prop adds the sliding arrow; keep it for a page's primary call to action. To make a link look like a button, pass `:as="RouterLink"` and `to`; `arrow` does not work with `as-child`.

### Charts (`charts/`)

The shared chart layer. New charts are built on it, and the older charts in `data-display/charts/` are rebuilt on it and then deleted.

- **ChartExport**: wraps a chart with its generated caption (which names the chart for screen readers) and SVG, PNG, PDF, CSV and caption downloads
- **ChartTable**: the data-table fallback behind "Show table"
- **ChartTooltip**: hover label over a chart
- **GridLineChart**, **ColumnChart**, **StepChart**: line, grouped column and step charts. A ColumnChart series can colour each column with `colors` (for example `var(--viz-severity-high)`)
- `chart.css`: the colour roles charts draw with (`--viz-series-*`, `--viz-severity-*`, `--viz-status-*`, text, grid), taken from the tokens in `assets/main.css`. Never use raw colours in a chart.
- `chart-caption.ts`, `chart-export.ts`, `chart-format.ts`, `chart-layout.ts`: captions, export, formatting and layout width

In UI copy only a saved definition is a "Figure"; everything else is a "chart".

### 📊 Data Display (`data-display/`)

#### Charts (`data-display/charts/`, being replaced by `charts/`)

- **LineChart**: Line chart
- **RadarChart**: Radar/spider chart
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
  <!-- Table -->
  <SortableTable :data="tableData" :columns="columns" />
</template>

<script setup>
import { SortableTable } from "@/base_components";
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
import { StatCard, InfoCard } from "@/base_components";
```

### Direct Path Imports

```javascript
import StatCard from "@/base_components/ui/cards/StatCard.vue";
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

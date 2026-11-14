# Base Components Library

Shared components for every page. Build new screens from these and the shadcn components in `@/shadcn/ui`. Import each one from its own path; there is no barrel.

## Directory Structure

```
base_components/
├── page/        # Page building blocks: heading, stat tile, badges, empty state
├── data-table/  # The shared DataTable
├── charts/      # The shared chart layer (the only chart system)
├── filters/     # filterTypes.ts: filter state for the vulnerability filters
└── ui/          # EcosystemBadge, InfoMarkdown, flow/ (vue-flow nodes)
```

## Component Categories

### Page building blocks (`page/`, `data-table/`)

Shared pieces for migrated pages. Build new screens from these and the shadcn components in `@/shadcn/ui`.

- **PageHeading** (`@/base_components/page`): the page `<h1>`. Default slot is the title; slots `badge` (next to the title), `description` (or the `description` prop) and `actions` (buttons on the right).
- **BrandEmphasis**: wrap the key word of a title to give it the green mark: `<PageHeading>New <BrandEmphasis>Dataset</BrandEmphasis></PageHeading>`.
- **StatTile**: one number with a `label`, a `value` and an optional `hint`. It renders an `<li>`, so put tiles in a `<ul aria-label="...">`.
- **StatusBadge**: a status in words with the shared status colours. Props `tone` (`success`, `warning`, `danger`, `neutral`), `label`, and `busy` for a spinner.
- **SeverityBadge**: a severity in words ("Critical", "High", ...) on the severity ramp (red to yellow), never brand green; each level has its own text colour (`text-severity-<level>-foreground`). Pass a CVSS `score` (also shown) or a `level`; `severityLevel()` in `@/utils/severity` gives the band of a score.
- **FrozenBadge**: the neutral "Frozen" pill with a lock, for published results that no longer change.
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

The shared chart layer and the only chart system; the older generic charts were rebuilt on it and deleted.

- **ChartExport**: wraps a chart with its generated caption (which names the chart for screen readers) and SVG, PNG, PDF, CSV and caption downloads
- **ChartTable**: the data-table fallback behind "Show table"
- **ChartTooltip**: hover label over a chart
- **GridLineChart**, **ColumnChart**, **StepChart**: line, grouped column and step charts. A ColumnChart series can colour each column with `colors` (for example `var(--viz-severity-high)`) and outline them with `strokes`; medium and low columns need `var(--viz-severity-medium-stroke)` and `var(--viz-severity-low-stroke)` to stand out from white
- `chart.css`: the colour roles charts draw with (`--viz-series-*`, `--viz-severity-*`, `--viz-status-*`, text, grid), taken from the tokens in `assets/main.css`. Never use raw colours in a chart.
- `chart-caption.ts`, `chart-export.ts`, `chart-format.ts`, `chart-layout.ts`: captions, export, formatting and layout width

In UI copy only a saved definition is a "Figure"; everything else is a "chart".

### Other components (`ui/`)

- **EcosystemBadge**: an ecosystem's logo and name, from `@/utils/packageEcosystem`
- **InfoMarkdown**: renders a markdown string, such as a vulnerability description
- **flow/**: the analyzer and dependency graph nodes for vue-flow

## Icons

Lucide (`@lucide/vue`) is the only general icon set. Use it for every icon that is not a logo.

Brand and language logos are the only exception. Use `simple-icons:<name>` (brands) or `devicon:<name>` (languages and tools) with Iconify's `<Icon>`. `vite-plugin-logo-icons.ts` bundles every logo id it finds in `src/`, so they are never fetched at runtime. Write the id as a full string literal, or the plugin cannot find it.

## Removed components

The old home-grown cards, modals, loaders, form fields, sortable table, pagination, filters and generic charts are deleted. The `local/design-system` lint rule lists them in `removedComponents` (`eslint.config.js`) and flags any import. Use the shadcn component or the shared piece above instead.

## Contributing

When adding a component:

1. Put it in the folder for its kind and document it here
2. Use design tokens and Lucide icons; the lint rule has no allowlist
3. Test what the user sees and does, not class names

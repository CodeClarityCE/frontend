// =============================================================================
// BASE COMPONENTS EXPORTS
// =============================================================================

// UI Components
// -----------------------------------------------------------------------------
// Cards
export { default as StatCard } from './ui/cards/StatCard.vue';
export { default as InfoCard } from './ui/cards/InfoCard.vue';

// Loaders
export { default as BoxLoader } from './ui/loaders/BoxLoader.vue';
export { default as DonutLoader } from './ui/loaders/DonutLoader.vue';
export { default as LoadingButton } from './ui/loaders/LoadingButton.vue';
export { default as LoadingComponent } from './ui/loaders/LoadingComponent.vue';
export { default as LoadingContainer } from './ui/loaders/LoadingContainer.vue';
export { default as LoadingSubmitButton } from './ui/loaders/LoadingSubmitButton.vue';
export { default as TextLoader } from './ui/loaders/TextLoader.vue';

// Modals
export { default as CenteredModal } from './ui/modals/CenteredModal.vue';
export { default as PositionedModal } from './ui/modals/PositionedModal.vue';

// Data Display Components
// -----------------------------------------------------------------------------
// Charts
export { default as BarChart } from './data-display/charts/BarChart.vue';
export { default as DoughnutChart } from './data-display/charts/DoughnutChart.vue';
export { default as LineChart } from './data-display/charts/LineChart.vue';
export { default as RadarChart } from './data-display/charts/RadarChart.vue';
export { default as TreeChart } from './data-display/charts/TreeChart.vue';
export { default as TreeChartLegend } from './data-display/charts/TreeChartLegend.vue';
export { default as WaffleChart } from './data-display/charts/WaffleChart.vue';

// Bubbles
export { default as BubbleComponent } from './data-display/bubbles/BubbleComponent.vue';
export { default as SeverityBubble } from './data-display/bubbles/SeverityBubble.vue';

// Tables
export { default as SortSelector } from './data-display/tables/SortSelector.vue';
export { default as SortableTable } from './data-display/tables/SortableTable.vue';

// Form Components
// -----------------------------------------------------------------------------
export { default as FormInlineCheckboxField } from './forms/FormInlineCheckboxField.vue';
export { default as FormSelectField } from './forms/FormSelectField.vue';
export { default as FormSelectLicense } from './forms/FormSelectLicense.vue';
export { default as FormTextField } from './forms/FormTextField.vue';

// Filter Components
// -----------------------------------------------------------------------------
export { default as ActiveFilterBar } from './filters/ActiveFilterBar.vue';
export { default as SearchBar } from './filters/SearchBar.vue';
export { default as UtilitiesFilters } from './filters/UtilitiesFilters.vue';

// Layout Components
// -----------------------------------------------------------------------------
export { default as ExpandableBox } from './layout/ExpandableBox.vue';
export { default as FaqBox } from './layout/FaqBox.vue';
export { default as PageHeader } from './layout/PageHeader.vue';

// Utility Components
// -----------------------------------------------------------------------------
export { default as ErrorComponent } from './utilities/ErrorComponent.vue';
export { default as PaginationComponent } from './utilities/PaginationComponent.vue';
export { default as SemverToString } from './utilities/SemverToString.vue';
export { default as UtilitiesSort } from './utilities/UtilitiesSort.vue';

// Markdown Components
// -----------------------------------------------------------------------------
export { default as InfoMarkdown } from './ui/InfoMarkdown.vue';

// =============================================================================
// TYPE EXPORTS
// =============================================================================
export type { ActiveFilter, FilterCategory, FilterState } from './filters/UtilitiesFilters.vue';

// =============================================================================
// UTILITY EXPORTS
// =============================================================================
export { createNewFilterState, FilterType } from './filters/UtilitiesFilters.vue';

// Chart utilities
export * from './data-display/charts/barChart';
export * from './data-display/charts/colors-waffle';
export * from './data-display/charts/doughnutChart';
export * from './data-display/charts/radarChart';

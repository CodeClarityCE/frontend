# Dashboard

The home page (`/`). Research comes first, then the project overview.

- `DashboardView.vue`: the page heading, the Research section and the project overview.
- `sections/DashboardResearch.vue`: Experiments in progress with their snapshot progress, recently finished Experiments and recent Published results. An organisation with no Datasets sees the owl and "Create a Dataset".
- `composables/useResearchOverview.ts`: loads the Research data from the Datasets, Experiments and Published results endpoints (the Dashboard endpoint has none of it) and refreshes progress while an Experiment is in progress.
- `composables/useDashboardData.ts`: decides whether the project overview has data or shows `layout/DashboardEmptyState.vue`.
- `sections/DashboardQuickStats.vue` and `sections/DashboardCharts.vue`: the project numbers and cards. The cards in `charts/` draw on the shared chart layer (`@/base_components/charts`) and use `layout/CardState.vue` for loading, failed and empty states.
- `dashboard.repository.ts`: the `/org/:org/dashboard/*` endpoints.

The e2e spec is `e2e/dashboard.spec.mts`, with its page object and fixtures in `e2e/pages/dashboard.page.mts`.

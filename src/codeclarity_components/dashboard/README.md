# Dashboard

The home page (`/`). Research comes first, then the project overview.

- `DashboardView.vue`: the page heading, the Research section and the project overview.
- `sections/DashboardResearch.vue`: Experiments in progress with their snapshot progress, recently finished Experiments and recent Published results. An organisation with no Datasets sees the owl and "Create a Dataset".
- `composables/useResearchOverview.ts`: loads the Research data from the Datasets, Experiments and Published results endpoints (the Dashboard endpoint has none of it) and refreshes progress while an Experiment is in progress.
- `composables/useDashboardData.ts`: decides whether the project overview has data or shows `layout/DashboardEmptyState.vue`, and sends the trend (`GET /org/:org/vulnerabilities/trend`) and vulnerability list requests once, shared through `composables/useDashboardRequest.ts` by the cards that need them.
- `charts/FixNext.vue`: "Fix next", the first card of the project overview: remediations across the organisation (`GET /org/:org/remediations/fix-next`), one entry per kind, package and target version, most urgent first. Each shows its reasons as chips (severity, Exploited, High EPSS, Prod or Dev only), how many vulnerabilities and projects it resolves, and its ticket state; the title links to the worst vulnerability's page and a single ticket links to the ticket.
- `sections/DashboardOverviewFilters.vue`: narrows the project numbers and the trend to one project, and picks weeks or months.
- `sections/DashboardQuickStats.vue`: the project numbers (critical and high vulnerabilities, projects scanned, security score), read from the trend's last period and compared with the one before.
- `sections/DashboardCharts.vue`: the cards. The cards in `charts/` draw on the shared chart layer (`@/base_components/charts`) and use `layout/CardState.vue` for loading, failed and empty states.
- `charts/OpenVulnerabilitiesTrend.vue`: "Open vulnerabilities over time": open vulnerability instances per period stacked by severity, and how many were introduced and fixed. Between two analyses a project counts as its earlier one.
- `charts/StaleProjects.vue`: projects whose current analysis is older than the organisation's freshness threshold (`GET /org/:org/freshness`), each with a re-analyse button (`vulnerabilities/ReanalyseButton.vue`). The threshold is set on the organisation's manage page. `vulnerabilities/NotYetCheckedProjects.vue` is the matching notice for the organisation vulnerability page.
- `dashboard.repository.ts`: the `/org/:org/dashboard/*` endpoints left (licenses and impact analysis).

The e2e spec is `e2e/dashboard.spec.mts`, with its page object and fixtures in `e2e/pages/dashboard.page.mts`.

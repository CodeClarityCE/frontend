# Dashboard Module 📊 (SIMPLIFIED FOR CONTRIBUTORS)

Welcome to the CodeClarity Dashboard module! This folder contains all components and logic for the main security dashboard view.

## � **SIMPLIFIED ARCHITECTURE**

This dashboard has been specifically designed to be **contributor-friendly** with these key simplifications:

### ✅ **What Makes This Easy to Contribute To:**

- **📁 Clear folder structure** - Components grouped by purpose (layout/sections/charts)
- **🔧 Composables pattern** - Business logic separated from UI components
- **📝 Mock data available** - Easy development without backend dependencies
- **🧩 Small, focused components** - Each component has one clear responsibility
- **📖 Comprehensive documentation** - Every file and function is documented

## �🏗️ Folder Structure

```
dashboard/
├── DashboardView.vue           # Main entry point - loaded by the router
├── dashboard.entity.ts         # TypeScript types and interfaces
├── dashboard.repository.ts     # Data fetching and API logic
├── composables/                # Reusable business logic
│   ├── useDashboardData.ts    # Main data management composable
│   └── useMockData.ts         # Sample data for development
├── layout/                     # Layout and container components
│   ├── DashboardStats.vue     # Main orchestrator component (SIMPLIFIED)
│   ├── DashboardHeader.vue    # Title, description, refresh controls
│   ├── DashboardSidebar.vue   # Activity feed and quick navigation (SIMPLIFIED)
│   └── DashboardEmptyState.vue # Loading, error, and onboarding states
├── sections/                   # Major dashboard sections
│   ├── DashboardQuickStats.vue # Key metrics overview (SIMPLIFIED)
│   └── DashboardCharts.vue    # Main data visualizations container
└── charts/                     # Individual chart components
    ├── ExposureOverview.vue   # Vulnerability exposure chart
    ├── CurrentVulns.vue       # Current vulnerabilities summary
    ├── LicenseDist.vue        # License distribution chart
    └── VulnerabilityImpact.vue # Vulnerability impact analysis
```

## 🚀 **CONTRIBUTOR QUICK START**

### Want to add a new metric?

1. Edit `sections/DashboardQuickStats.vue`
2. Add your metric to the `stats` computed property
3. That's it! The StatCard component handles the rest.

### Want to add a new chart?

1. Create your component in `charts/`
2. Add it to `sections/DashboardCharts.vue`
3. Wrap it in an InfoCard for consistency

### Want to modify data fetching?

1. Edit `composables/useDashboardData.ts`
2. All API calls and state management are centralized here

### Need sample data for testing?

- Use `composables/useMockData.ts`
- Already provides realistic dashboard data
- Easy to extend with new mock scenarios

## 🎯 Component Responsibilities

### 📄 Entry Point

- **`DashboardView.vue`** - Router entry point, async loads the main dashboard

### 🏗️ Layout Components (`layout/`)

- **`DashboardStats.vue`** - Main orchestrator that manages state and coordinates all subcomponents
- **`DashboardHeader.vue`** - Dashboard title, description, and refresh functionality
- **`DashboardSidebar.vue`** - Recent activity feed, recommended actions, quick navigation
- **`DashboardEmptyState.vue`** - Handles loading states, errors, and onboarding flow

### 📊 Section Components (`sections/`)

- **`DashboardQuickStats.vue`** - Overview of key security metrics using StatCard components
- **`DashboardCharts.vue`** - Container for all main data visualizations

### 📈 Chart Components (`charts/`)

- **`ExposureOverview.vue`** - Main vulnerability exposure visualization
- **`CurrentVulns.vue`** - Current vulnerability summary and counts
- **`LicenseDist.vue`** - Open source license distribution analysis
- **`VulnerabilityImpact.vue`** - Vulnerability impact and severity analysis

## 🚀 Getting Started

### Adding a New Chart

1. Create your chart component in the `charts/` folder
2. Add it to `DashboardCharts.vue` as an async component
3. Include it in the template with appropriate InfoCard wrapper

### Modifying Layout

- Layout changes go in the `layout/` folder
- Section-level changes go in the `sections/` folder
- Individual charts stay in the `charts/` folder

### Data Flow

```
DashboardView.vue
    ↓ (async loads)
DashboardStats.vue (orchestrator)
    ↓ (passes data to)
┌─ DashboardHeader.vue
├─ DashboardQuickStats.vue
├─ DashboardCharts.vue
│      ↓ (loads charts)
│  ┌─ ExposureOverview.vue
│  ├─ CurrentVulns.vue
│  ├─ LicenseDist.vue
│  └─ VulnerabilityImpact.vue
└─ DashboardSidebar.vue
```

## 💡 Contributor Guidelines

### 🎨 Styling

- Use Tailwind CSS classes for consistency
- Leverage the InfoCard and StatCard base components
- Follow the existing grid layouts (responsive design)

### 📦 Components

- Keep components focused on a single responsibility
- Use Vue 3 Composition API with `<script setup>`
- Add TypeScript interfaces for props
- Include JSDoc comments for complex logic

### 🔄 State Management

- Use Pinia stores (`useStateStore`, `useUserStore`, `useAuthStore`)
- Keep local state minimal - prefer computed properties
- Use async components for better performance

### 🧪 Testing

- Add unit tests for new chart components
- Test error states and loading scenarios
- Verify responsive behavior

## 🛠️ Common Tasks

### Adding a New Metric

1. Add the metric to `DashboardQuickStats.vue`
2. Use the `StatCard` component for consistency
3. Fetch data in `DashboardStats.vue` if needed

### Creating a New Visualization

1. Create component in `charts/` folder
2. Add async import to `DashboardCharts.vue`
3. Wrap in `InfoCard` with appropriate title/description

### Modifying the Layout

1. Update `DashboardStats.vue` for major structural changes
2. Modify individual layout components for specific areas
3. Update grid classes for responsive behavior

## 🏆 Best Practices

- **Performance**: Use async components for charts and heavy visualizations
- **Accessibility**: Include proper ARIA labels and keyboard navigation
- **Responsiveness**: Test on mobile, tablet, and desktop viewports
- **Error Handling**: Always provide meaningful error states
- **Loading States**: Show appropriate loading indicators
- **Documentation**: Comment complex business logic and data transformations

## 🔗 Related Components

- `@/base_components/ui/cards/InfoCard.vue` - Card wrapper for content sections
- `@/base_components/ui/cards/StatCard.vue` - Metric display component
- `@/base_components/filters/UtilitiesFilters.vue` - Filter components
- `@/stores/state.js` - Global application state
- `@/stores/user.js` - User-specific state
- `@/stores/auth.js` - Authentication state

---

Happy coding! 🎉 If you have questions about the dashboard architecture, check the component comments or reach out to the team.

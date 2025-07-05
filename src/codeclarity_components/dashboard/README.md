# Dashboard Components

Simple, well-organized dashboard components for CodeClarity.

## Structure

```
dashboard/
├── DashboardView.vue           # Main entry point
├── layout/                     # Layout components
│   ├── DashboardHeader.vue     # Title + refresh button
│   ├── DashboardStats.vue      # Main orchestrator
│   ├── DashboardEmptyState.vue # Loading/error states
│   └── DashboardSidebar.vue    # Activity + navigation
├── sections/                   # Content sections
│   ├── DashboardQuickStats.vue # Key metrics
│   └── DashboardCharts.vue     # Chart grid
├── charts/                     # Individual charts
│   ├── CurrentVulns.vue        # Current vulnerabilities
│   ├── ExposureOverview.vue    # Exposure chart
│   ├── LicenseDist.vue         # License distribution
│   └── VulnerabilityImpact.vue # Impact analysis
└── composables/                # Data management
    ├── useDashboardData.ts     # Real API data
    └── useMockData.ts          # Mock data for dev
```

## Key Principles

### 1. Simple Component Hierarchy
- `DashboardView` → `DashboardStats` → sections
- Each component has a single responsibility
- No deep nesting or complex dependencies

### 2. Clear Data Flow
- `useDashboardData` handles all API calls
- `useMockData` provides development data
- Props flow down, events bubble up

### 3. Easy Collaboration
- Minimal complexity in each component
- Clear TypeScript interfaces
- Good comments and documentation
- No async component loading complexity

## Working with the Dashboard

### Adding New Stats
Edit `useMockData.ts` and add to the `stats` object:

```typescript
const stats = {
    critical: 14,
    high: 10,
    projects: 24,
    score: 7.8,
    newMetric: 42  // Add here
};
```

### Adding New Charts
1. Create chart component in `charts/`
2. Import in `DashboardCharts.vue`
3. Add to the grid layout

### Modifying Layout
The main layout is in `DashboardStats.vue`:
- Header (title, refresh)
- Quick stats (4 metrics)
- Charts (2x2 grid)
- Sidebar (activity, actions, nav)

### Data Sources
- **Development**: Uses `useMockData` for testing
- **Production**: Uses `useDashboardData` for real API calls
- Switch by changing imports in components

## Development Tips

1. **Start with mock data** - Use `useMockData` to prototype
2. **Keep components small** - Each should fit on one screen
3. **Use TypeScript** - Define interfaces for all props
4. **Test empty states** - Ensure good UX when no data
5. **Mobile first** - Use responsive grid classes

## Common Tasks

### Update Dashboard Title
Edit props in `DashboardHeader.vue`:

```vue
withDefaults(defineProps<Props>(), {
    title: 'Your New Title',
    description: 'Your new description'
});
```

### Add Activity Item
Edit `useMockData.ts` activities array:

```typescript
const activities = [
    {
        id: 4,
        title: 'New activity',
        description: 'Description here',
        time: 'Just now',
        variant: 'primary',
        icon: 'solar:star-bold'
    }
];
```

### Connect Real Data
Replace mock data import with real data:

```typescript
// From this:
import { useMockData } from '../composables/useMockData';
const { stats } = useMockData();

// To this:
import { useDashboardData } from '../composables/useDashboardData';
const { realStats } = useDashboardData();
```
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

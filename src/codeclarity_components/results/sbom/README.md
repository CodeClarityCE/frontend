# SBOM Component Documentation

## Overview

The SBOM (Software Bill of Materials) component provides a comprehensive view of project dependencies with multi-format export capabilities and package manager-specific update commands.

## Component Architecture

### Main Components

- **SbomContent.vue** - Main container component
- **PackageJsonUpdatesModal.vue** - Modal for showing package update commands
- **SbomExportMenu.vue** - Export functionality dropdown
- **SelectWorkspace.vue** - Workspace selector with package manager detection

### Utility Modules

#### `/utils/sbomUtils.ts`

Core SBOM data processing utilities:

- `calculateHealthScore()` - Health score calculation based on dependency issues
- `calculateSecurityIssues()` - Count of security-related dependency issues
- `getDirectDependenciesNeedingUpdates()` - Filter actionable dependencies
- `convertToPackageUpdates()` - Transform data for the modal

#### `/utils/packageManagerUtils.ts`

Package manager-specific operations:

- `generateUpdateCommands()` - Generate commands for npm/yarn/pnpm/bun
- `getPackageManagerIcon()` - Get appropriate logo icons
- `getLockfileName()` - Get correct lockfile name
- `getInstallCommand()` - Get install command for package manager

#### `/exports/sbomExportUtils.ts`

Export functionality:

- `convertToCSV()` - CSV export format
- `convertToHTML()` - HTML report with highlighting
- `convertToCycloneDX()` - Industry standard SBOM format
- `sortDependenciesByPriority()` - Sort by actionable priority

## Key Features

### 1. Package Manager Detection

- Automatically detects package manager from workspace data
- Supports npm, yarn, pnpm, and bun
- Shows only relevant commands for detected package manager

### 2. Smart Dependency Updates

- Focuses on "actionable" dependencies (direct dependencies only)
- Calculates package.json updates needed vs transitive updates
- Provides appropriate commands for forcing updates

### 3. Multi-Format Export

- **CSV**: Focused on actionable updates
- **HTML**: Interactive report with highlighting
- **JSON**: Raw dependency data
- **CycloneDX**: Industry standard SBOM format

### 4. Health Metrics

- Health score based on outdated/deprecated/unlicensed dependencies
- Security issues count
- Direct vs transitive dependency breakdown

## Usage Examples

### Using SBOM Utilities

```typescript
import {
  calculateHealthScore,
  getDirectDependenciesNeedingUpdates,
} from "./utils/sbomUtils";

const healthScore = calculateHealthScore(stats);
const actionableDeps = getDirectDependenciesNeedingUpdates(dependencies);
```

### Using Package Manager Utilities

```typescript
import {
  generateUpdateCommands,
  getPackageManagerIcon,
} from "./utils/packageManagerUtils";

const commands = generateUpdateCommands("yarn", updates);
const icon = getPackageManagerIcon("npm");
```

## Data Flow

1. **SelectWorkspace** detects package manager and emits event
2. **SbomContent** receives package manager info and fetches SBOM data
3. **Utilities** process raw data into actionable insights
4. **PackageJsonUpdatesModal** displays relevant commands for detected package manager
5. **Export utilities** generate appropriate formats for download

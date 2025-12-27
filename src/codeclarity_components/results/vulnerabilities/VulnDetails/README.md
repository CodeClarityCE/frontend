# VulnDetails Components

This folder contains modular Vue components and types for displaying vulnerability details in the results view.

## Components

- `VulnSecurityAnalysis.vue`: Shows severity breakdown and recommendations.
- `VulnReferences.vue`: Displays references for a vulnerability.
- `VulnerabilitySeverities.vue`: Renders severity details and charts.
- `VulnDetailsHeader.vue`: Header for vulnerability details.
- `VulnDetailsLoader.vue`: Loader/skeleton for details view.
- `VulnSummaryContent.vue`: Summary and content for a vulnerability.

## Types

- `VulnDetails.types.ts`: TypeScript types for vulnerability details.

## Usage

Import components or types from the index:

```ts
import { VulnSecurityAnalysis, VulnDetailsHeader } from "./VulnDetails";
```

## Contribution

- Keep components focused and modular.
- Add new components/types to the index.
- Update this README with any changes.

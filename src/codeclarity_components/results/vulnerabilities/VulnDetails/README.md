# VulnDetails

The pieces of the vulnerability detail page. The page itself is `../VulnDetails.vue`.

## Components

- `VulnDetailsHeader.vue`: affected versions of the dependency, and what each source says when they disagree.
- `VulnDetailsLoader.vue`: skeleton shown while the vulnerability loads.
- `VulnSummaryContent.vue`: description and weaknesses (CWE).
- `VulnerabilitySeverities.vue`: CVSS scores and metrics, one tab per CVSS version.
- `VulnReferences.vue`: links to advisories and other references.

## Types

- `VulnDetails.types.ts`: the `VulnerabilityDetails` model and its parts.
- `VulnDetails.ts`: re-exports those types, with `VulnerabilityDetails` as the default export.

## Usage

`index.ts` exports the components and types:

```ts
import {
  VulnDetailsHeader,
  type VulnerabilityDetails,
} from "@/codeclarity_components/results/vulnerabilities/VulnDetails";
```

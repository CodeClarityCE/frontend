/**
 * Utility functions for exporting SBOM data in various formats
 */

import { lightTokens } from "@/utils/light-tokens";

import { hasUpdate } from "../utils/sbomUtils";

export type ExportFormat = "csv" | "json" | "cyclonedx" | "html";

export interface ExportDependency {
  name: string;
  version: string;
  newest_release?: string;
  is_direct?: boolean;
  is_direct_count: number;
  prod?: boolean;
  dev?: boolean;
  outdated?: boolean;
  deprecated?: boolean;
  purl?: string;
  // An SPDX expression, e.g. "MIT" or "(BSD-3-Clause OR GPL-2.0)"
  license?: string;
  ecosystem?: string;
}

export interface ExportOptions {
  projectName: string;
  projectId: string;
}

const EXPORT_TOKENS = [
  "background",
  "foreground",
  "foreground-strong",
  "muted",
  "muted-foreground",
  "border",
  "success",
  "success-subtle",
  "warning-subtle",
  "danger",
  "neutral",
  "neutral-subtle",
];

// The light colour tokens, copied into the report so it prints the same in any theme.
function exportPalette(): string {
  const tokens = lightTokens();
  return EXPORT_TOKENS.map(
    (name) => `            --${name}: ${tokens.get(`--${name}`) ?? "inherit"};`,
  ).join("\n");
}

/**
 * Sorts dependencies by priority:
 * 1. Direct + Production
 * 2. Direct + Development
 * 3. Transitive + Production
 * 4. Other transitive dependencies
 */
export function sortDependenciesByPriority(
  dependencies: ExportDependency[],
): ExportDependency[] {
  return [...dependencies].sort((a, b) => {
    // Use is_direct_count > 0 to determine if direct, matching the table logic
    const aDirect = a.is_direct_count > 0 || a.is_direct;
    const bDirect = b.is_direct_count > 0 || b.is_direct;

    // Priority 1: Direct + Production
    const aDirectProd = aDirect && a.prod;
    const bDirectProd = bDirect && b.prod;
    if (aDirectProd && !bDirectProd) return -1;
    if (!aDirectProd && bDirectProd) return 1;

    // Priority 2: Direct + Dev
    const aDirectDev = aDirect && a.dev;
    const bDirectDev = bDirect && b.dev;
    if (aDirectDev && !bDirectDev) return -1;
    if (!aDirectDev && bDirectDev) return 1;

    // Priority 3: Transitive + Production
    const aTransitiveProd = !aDirect && a.prod;
    const bTransitiveProd = !bDirect && b.prod;
    if (aTransitiveProd && !bTransitiveProd) return -1;
    if (!aTransitiveProd && bTransitiveProd) return 1;

    // Within same priority, sort by name
    return (a.name ?? "").localeCompare(b.name ?? "");
  });
}

/**
 * Converts dependencies to CSV format focused on package.json updates
 */
export function convertToCSV(dependencies: ExportDependency[]): string {
  const sortedDeps = sortDependenciesByPriority(dependencies);
  const headers = [
    "Package Name",
    "Current Version",
    "Latest Version",
    "Dependency Type",
    "Update Available",
    "Package.json Update Needed",
  ];

  const rows = sortedDeps.map((dep) => {
    const isDirect = dep.is_direct_count > 0 || dep.is_direct;
    const hasUpdate =
      dep.outdated ??
      !!(dep.newest_release && dep.version !== dep.newest_release);
    let dependencyType: string;
    if (isDirect) {
      if (dep.prod) {
        dependencyType = "Direct Production";
      } else if (dep.dev) {
        dependencyType = "Direct Development";
      } else {
        dependencyType = "Direct";
      }
    } else {
      if (dep.prod) {
        dependencyType = "Transitive Production";
      } else {
        dependencyType = "Transitive Development";
      }
    }
    const needsPackageJsonUpdate = isDirect && hasUpdate;

    return [
      dep.name ?? "",
      dep.version ?? "",
      dep.newest_release ?? dep.version ?? "",
      dependencyType,
      hasUpdate ? "Yes" : "No",
      needsPackageJsonUpdate
        ? "YES - Update package.json"
        : "No - Transitive dependency",
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csvContent;
}

/**
 * Converts dependencies to HTML report format (optimized for large datasets)
 */
export function convertToHTML(
  dependencies: ExportDependency[],
  options: ExportOptions,
): string {
  const sortedDeps = sortDependenciesByPriority(dependencies);
  const projectName = options.projectName ?? options.projectId;
  const date = new Date().toLocaleDateString();
  const totalDeps = sortedDeps.length;

  // Pre-calculate statistics for better performance
  let directCount = 0;
  let prodCount = 0;
  let packageJsonUpdatesCount = 0;
  let totalUpdatesCount = 0;

  // Pre-process dependencies to avoid repeated calculations
  const processedDeps = sortedDeps.map((dep) => {
    const isDirect = dep.is_direct_count > 0 || dep.is_direct;
    const hasUpdate: boolean =
      dep.outdated ??
      !!(dep.newest_release && dep.version !== dep.newest_release);
    const needsPackageJsonUpdate = !!(isDirect && hasUpdate);

    // Update counters
    if (isDirect) directCount++;
    if (dep.prod) prodCount++;
    if (needsPackageJsonUpdate) packageJsonUpdatesCount++;
    if (hasUpdate) totalUpdatesCount++;

    let dependencyType: string;
    if (isDirect) {
      if (dep.prod) {
        dependencyType = "Direct Production";
      } else if (dep.dev) {
        dependencyType = "Direct Development";
      } else {
        dependencyType = "Direct";
      }
    } else {
      if (dep.prod) {
        dependencyType = "Transitive Production";
      } else {
        dependencyType = "Transitive Development";
      }
    }

    let currentGroup: string;
    if (isDirect && dep.prod) {
      currentGroup = "Direct Production Dependencies (Update package.json)";
    } else if (isDirect && dep.dev) {
      currentGroup = "Direct Development Dependencies (Update package.json)";
    } else if (!isDirect && dep.prod) {
      currentGroup = "Transitive Production Dependencies (Auto-updated)";
    } else {
      currentGroup = "Other Transitive Dependencies (Auto-updated)";
    }

    return {
      name: dep.name ?? "",
      version: dep.version ?? "",
      latestVersion: dep.newest_release ?? dep.version ?? "",
      isDirect,
      hasUpdate,
      needsPackageJsonUpdate,
      dependencyType,
      currentGroup,
    };
  });

  // Use array-based approach for much better performance
  const htmlParts = [];

  // Add header and styles
  htmlParts.push(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SBOM Report - ${projectName}</title>
    <style>
        :root {
${exportPalette()}
        }
        body {
            font-family: system-ui, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: var(--muted);
            color: var(--foreground);
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: var(--background);
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: var(--foreground-strong);
            margin-bottom: 10px;
        }
        .meta {
            color: var(--muted-foreground);
            margin-bottom: 20px;
        }
        .summary {
            background-color: var(--muted);
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
        }
        .summary-stat {
            display: inline-block;
            margin-right: 30px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th {
            background-color: var(--muted);
            text-align: left;
            padding: 12px;
            font-weight: 600;
            border-bottom: 2px solid var(--border);
        }
        td {
            padding: 10px 12px;
            border-bottom: 1px solid var(--border);
        }
        tr:hover {
            background-color: var(--muted);
        }
        .highlight {
            background-color: var(--warning-subtle);
            font-weight: 500;
        }
        .version-mismatch {
            color: var(--danger);
            font-weight: 600;
        }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
        }
        .badge-yes {
            background-color: var(--success-subtle);
            color: var(--success);
        }
        .badge-no {
            background-color: var(--neutral-subtle);
            color: var(--neutral);
        }
        .legend {
            margin-top: 20px;
            padding: 10px;
            background-color: var(--muted);
            border-radius: 5px;
            font-size: 14px;
        }
        .legend-item {
            display: inline-block;
            margin-right: 20px;
        }
        .legend-box {
            display: inline-block;
            width: 20px;
            height: 12px;
            margin-right: 5px;
            vertical-align: middle;
            border: 1px solid var(--border);
        }
        .group-header {
            background-color: var(--muted);
            font-weight: 600;
            font-size: 14px;
            color: var(--foreground);
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Software Bill of Materials (SBOM) Report</h1>
        <div class="meta">
            <strong>Project:</strong> ${projectName} | 
            <strong>Generated:</strong> ${date} | 
            <strong>Total Dependencies:</strong> ${totalDeps}
        </div>
        
        <div class="summary">
            <div class="summary-stat">
                <strong>Direct Dependencies:</strong> ${directCount}
            </div>
            <div class="summary-stat">
                <strong>Production Dependencies:</strong> ${prodCount}
            </div>
            <div class="summary-stat">
                <strong>Package.json Updates Needed:</strong> <span style="color: var(--danger); font-weight: bold;">${packageJsonUpdatesCount}</span>
            </div>
            <div class="summary-stat">
                <strong>Total Updates Available:</strong> ${totalUpdatesCount}
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Package Name</th>
                    <th>Current Version</th>
                    <th>Latest Version</th>
                    <th>Dependency Type</th>
                    <th>Package.json Update</th>
                    <th>Action Required</th>
                </tr>
            </thead>
            <tbody>`);

  // Generate table rows efficiently
  let lastGroup = "";
  for (const dep of processedDeps) {
    // Add group header if group changed
    if (dep.currentGroup !== lastGroup) {
      htmlParts.push(
        `<tr class="group-header"><td colspan="6">${dep.currentGroup}</td></tr>`,
      );
      lastGroup = dep.currentGroup;
    }

    // Add dependency row
    htmlParts.push(
      `<tr class="${dep.needsPackageJsonUpdate ? "highlight" : ""}">`,
      `<td><strong>${dep.name}</strong></td>`,
      `<td>${dep.version}</td>`,
      `<td class="${dep.hasUpdate ? "version-mismatch" : ""}">${dep.latestVersion}</td>`,
      `<td><span class="badge ${dep.isDirect ? "badge-yes" : "badge-no"}">${dep.dependencyType}</span></td>`,
      `<td><span class="badge ${dep.needsPackageJsonUpdate ? "badge-yes" : "badge-no"}">${dep.needsPackageJsonUpdate ? "Required" : "Not Needed"}</span></td>`,
      `<td>${getUpdateInstructions(dep.needsPackageJsonUpdate, dep.hasUpdate)}</td>`,
      "</tr>",
    );
  }

  // Add footer
  htmlParts.push(`            </tbody>
        </table>
        
        <div class="legend">
            <strong>Legend:</strong>
            <div class="legend-item">
                <span class="legend-box" style="background-color: var(--warning-subtle);"></span>
                Highlighted rows = Direct dependencies requiring package.json updates
            </div>
            <div class="legend-item" style="margin-top: 5px;">
                <strong>Note:</strong> Only direct dependencies need manual updates in package.json. Transitive dependencies update automatically when their parent dependencies are updated.
            </div>
        </div>
    </div>
</body>
</html>`);

  return htmlParts.join("");
}

function getUpdateInstructions(
  needsPackageJsonUpdate: boolean,
  hasUpdate: boolean,
): string {
  if (needsPackageJsonUpdate) {
    return '<strong style="color: var(--danger);">Update package.json</strong>';
  }
  if (hasUpdate) {
    return "Transitive - will update automatically";
  }
  return "Up to date";
}

const PURL_TYPES: Record<string, string> = {
  npm: "npm",
  packagist: "composer",
  pypi: "pypi",
  cargo: "cargo",
};

// The dependency's package URL, built from its name when the API sent none.
function packageUrl(dep: ExportDependency): string {
  if (dep.purl) return dep.purl;
  const type = PURL_TYPES[dep.ecosystem ?? "npm"] ?? "generic";
  const path = dep.name.split("/").map(encodeURIComponent).join("/");
  return `pkg:${type}/${path}@${encodeURIComponent(dep.version)}`;
}

const SPDX_ID = /^[A-Za-z0-9.+-]+$/;

// Whether the text reads as an SPDX expression: ids joined by AND, OR or WITH.
function isSpdxExpression(text: string): boolean {
  const tokens = text.replace(/[()]/g, " $& ").trim().split(/\s+/);
  let depth = 0;
  let wantId = true;
  for (const token of tokens) {
    switch (token) {
      case "(":
        if (!wantId) return false;
        depth++;
        break;
      case ")":
        if (wantId || --depth < 0) return false;
        break;
      case "AND":
      case "OR":
      case "WITH":
        if (wantId) return false;
        wantId = true;
        break;
      default:
        if (!wantId || !SPDX_ID.test(token)) return false;
        wantId = false;
    }
  }
  return depth === 0 && !wantId;
}

function cycloneDxLicenses(license: string | undefined): object[] | undefined {
  const text = license?.trim();
  if (!text) return undefined;
  return isSpdxExpression(text)
    ? [{ expression: text }]
    : [{ license: { name: text } }];
}

/**
 * Converts dependencies to CycloneDX 1.4 JSON
 */
export function convertToCycloneDX(
  dependencies: ExportDependency[],
  options: ExportOptions,
): string {
  const sortedDeps = sortDependenciesByPriority(dependencies);
  const cycloneDX = {
    bomFormat: "CycloneDX",
    specVersion: "1.4",
    serialNumber: `urn:uuid:${crypto.randomUUID()}`,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: [{ vendor: "CodeClarity", name: "CodeClarity" }],
      component: {
        type: "application",
        name: options.projectName || options.projectId,
      },
    },
    components: sortedDeps.map((dep) => {
      const purl = packageUrl(dep);
      return {
        type: "library",
        "bom-ref": purl,
        name: dep.name,
        version: dep.version,
        purl,
        licenses: cycloneDxLicenses(dep.license),
        properties: [
          {
            name: "codeclarity:is_direct",
            value: String(dep.is_direct_count > 0 || !!dep.is_direct),
          },
          {
            name: "codeclarity:is_deprecated",
            value: String(!!dep.deprecated),
          },
          { name: "codeclarity:is_outdated", value: String(hasUpdate(dep)) },
        ],
      };
    }),
  };

  return JSON.stringify(cycloneDX, null, 2);
}

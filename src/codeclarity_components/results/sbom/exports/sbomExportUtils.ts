/**
 * Utility functions for exporting SBOM data in various formats
 */

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
    licenses?: string[];
}

export interface ExportOptions {
    projectName: string;
    projectId: string;
}

/**
 * Sorts dependencies by priority:
 * 1. Direct + Production
 * 2. Direct + Development
 * 3. Transitive + Production
 * 4. Other transitive dependencies
 */
export function sortDependenciesByPriority(dependencies: ExportDependency[]): ExportDependency[] {
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
        return (a.name || '').localeCompare(b.name || '');
    });
}

/**
 * Converts dependencies to CSV format focused on package.json updates
 */
export function convertToCSV(dependencies: ExportDependency[]): string {
    const sortedDeps = sortDependenciesByPriority(dependencies);
    const headers = [
        'Package Name', 
        'Current Version', 
        'Latest Version', 
        'Dependency Type', 
        'Update Available', 
        'Package.json Update Needed'
    ];
    
    const rows = sortedDeps.map(dep => {
        const isDirect = dep.is_direct_count > 0 || dep.is_direct;
        const hasUpdate = dep.outdated || (dep.newest_release && dep.version !== dep.newest_release);
        const dependencyType = isDirect 
            ? (dep.prod ? 'Direct Production' : dep.dev ? 'Direct Development' : 'Direct')
            : (dep.prod ? 'Transitive Production' : 'Transitive Development');
        const needsPackageJsonUpdate = isDirect && hasUpdate;
        
        return [
            dep.name || '',
            dep.version || '',
            dep.newest_release || dep.version || '',
            dependencyType,
            hasUpdate ? 'Yes' : 'No',
            needsPackageJsonUpdate ? 'YES - Update package.json' : 'No - Transitive dependency'
        ];
    });

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
}

/**
 * Converts dependencies to HTML report format
 */
export function convertToHTML(dependencies: ExportDependency[], options: ExportOptions): string {
    const sortedDeps = sortDependenciesByPriority(dependencies);
    const projectName = options.projectName || options.projectId;
    const date = new Date().toLocaleDateString();
    const totalDeps = sortedDeps.length;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SBOM Report - ${projectName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .meta {
            color: #666;
            margin-bottom: 20px;
        }
        .summary {
            background-color: #f8f9fa;
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
            background-color: #f0f0f0;
            text-align: left;
            padding: 12px;
            font-weight: 600;
            border-bottom: 2px solid #ddd;
        }
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #eee;
        }
        tr:hover {
            background-color: #f9f9f9;
        }
        .highlight {
            background-color: #fff3cd;
            font-weight: 500;
        }
        .version-mismatch {
            color: #d73502;
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
            background-color: #d4edda;
            color: #155724;
        }
        .badge-no {
            background-color: #f8f9fa;
            color: #6c757d;
        }
        .legend {
            margin-top: 20px;
            padding: 10px;
            background-color: #f8f9fa;
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
            border: 1px solid #ddd;
        }
        .group-header {
            background-color: #e9ecef;
            font-weight: 600;
            font-size: 14px;
            color: #495057;
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
                <strong>Direct Dependencies:</strong> ${sortedDeps.filter(d => d.is_direct_count > 0 || d.is_direct).length}
            </div>
            <div class="summary-stat">
                <strong>Production Dependencies:</strong> ${sortedDeps.filter(d => d.prod).length}
            </div>
            <div class="summary-stat">
                <strong>Package.json Updates Needed:</strong> <span style="color: #d73502; font-weight: bold;">${sortedDeps.filter(d => {
                    const isDirect = d.is_direct_count > 0 || d.is_direct;
                    const hasUpdate = d.outdated || (d.newest_release && d.version !== d.newest_release);
                    return isDirect && hasUpdate;
                }).length}</span>
            </div>
            <div class="summary-stat">
                <strong>Total Updates Available:</strong> ${sortedDeps.filter(d => d.outdated || (d.newest_release && d.version !== d.newest_release)).length}
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
            <tbody>
                ${(() => {
                    let html = '';
                    let lastGroup = '';
                    
                    sortedDeps.forEach(dep => {
                        // Determine current group
                        const isDirect = dep.is_direct_count > 0 || dep.is_direct;
                        let currentGroup = '';
                        if (isDirect && dep.prod) currentGroup = 'Direct Production Dependencies (Update package.json)';
                        else if (isDirect && dep.dev) currentGroup = 'Direct Development Dependencies (Update package.json)';
                        else if (!isDirect && dep.prod) currentGroup = 'Transitive Production Dependencies (Auto-updated)';
                        else currentGroup = 'Other Transitive Dependencies (Auto-updated)';
                        
                        // Add group header if group changed
                        if (currentGroup !== lastGroup) {
                            html += `<tr class="group-header"><td colspan="6">${currentGroup}</td></tr>`;
                            lastGroup = currentGroup;
                        }
                        
                        const hasUpdate = dep.outdated || (dep.newest_release && dep.version !== dep.newest_release);
                        const needsPackageJsonUpdate = isDirect && hasUpdate;
                        const dependencyType = isDirect 
                            ? (dep.prod ? 'Direct Production' : dep.dev ? 'Direct Development' : 'Direct')
                            : (dep.prod ? 'Transitive Production' : 'Transitive Development');
                        
                        html += `
                        <tr class="${needsPackageJsonUpdate ? 'highlight' : ''}">
                            <td><strong>${dep.name || ''}</strong></td>
                            <td>${dep.version || ''}</td>
                            <td class="${hasUpdate ? 'version-mismatch' : ''}">${dep.newest_release || dep.version || ''}</td>
                            <td><span class="badge ${isDirect ? 'badge-yes' : 'badge-no'}">${dependencyType}</span></td>
                            <td><span class="badge ${needsPackageJsonUpdate ? 'badge-yes' : 'badge-no'}">${needsPackageJsonUpdate ? 'Required' : 'Not Needed'}</span></td>
                            <td>${needsPackageJsonUpdate ? '<strong style="color: #d73502;">Update package.json</strong>' : hasUpdate ? 'Transitive - will update automatically' : 'Up to date'}</td>
                        </tr>`;
                    });
                    
                    return html;
                })()}
            </tbody>
        </table>
        
        <div class="legend">
            <strong>Legend:</strong>
            <div class="legend-item">
                <span class="legend-box" style="background-color: #fff3cd;"></span>
                Highlighted rows = Direct dependencies requiring package.json updates
            </div>
            <div class="legend-item" style="margin-top: 5px;">
                <strong>Note:</strong> Only direct dependencies need manual updates in package.json. Transitive dependencies update automatically when their parent dependencies are updated.
            </div>
        </div>
    </div>
</body>
</html>`;

    return html;
}

/**
 * Converts dependencies to CycloneDX format
 */
export function convertToCycloneDX(dependencies: ExportDependency[], options: ExportOptions): string {
    const sortedDeps = sortDependenciesByPriority(dependencies);
    const cycloneDX = {
        bomFormat: 'CycloneDX',
        specVersion: '1.4',
        serialNumber: `urn:uuid:${crypto.randomUUID()}`,
        version: 1,
        metadata: {
            timestamp: new Date().toISOString(),
            tools: [{
                vendor: 'CodeClarity',
                name: 'CodeClarity SBOM Generator',
                version: '1.0.0'
            }],
            component: {
                type: 'application',
                name: options.projectName || options.projectId,
                version: '1.0.0'
            }
        },
        components: sortedDeps.map(dep => ({
            type: 'library',
            'bom-ref': dep.purl || `pkg:generic/${dep.name}@${dep.version}`,
            name: dep.name,
            version: dep.version,
            purl: dep.purl,
            licenses: dep.licenses && dep.licenses.length > 0 ? dep.licenses.map((license: string) => ({
                license: {
                    id: license
                }
            })) : [],
            properties: [
                { name: 'codeclarity:is_direct', value: String(dep.is_direct_count > 0 || dep.is_direct) },
                { name: 'codeclarity:is_deprecated', value: String(dep.deprecated) },
                { name: 'codeclarity:is_outdated', value: String(dep.outdated) }
            ]
        }))
    };

    return JSON.stringify(cycloneDX, null, 2);
}
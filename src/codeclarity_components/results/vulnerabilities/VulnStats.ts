export interface Output {
    workspaces: { [key: string]: WorkSpaceData };
    analysis_info: AnalysisInfo;
}

export enum Status {
    Success = 'success',
    Failure = 'failure'
}

export interface AnalysisInfo {
    status: Status;
    private_errors: any[];
    public_errors: any[];
    analysis_start_time: string;
    analysis_end_time: string;
    analysis_delta_time: number;
    version_seperator: string;
    import_path_seperator: string;
    default_workspace_name: string;
    self_managed_workspace_name: string;
    stats: Stats;
}

export interface Stats {
    number_of_vulnerable_dependencies: number;
    number_of_vulnerabilities: number;
    number_of_transitive_vulnerabilites: number;
    number_of_direct_vulnerabilities: number;
    mean_severity: number;
    max_severity: number;
    severity_dist: SeverityDist;
}

export interface SeverityDist {
    critical: number;
    high: number;
    medium: number;
    low: number;
    none: number;
}

export interface WorkSpaceData {
    Vulnerabilities: Vulnerability[];
    DependencyInfo: { [key: string]: DependencyInfo };
}

export interface DependencyInfo {
    SeverityDist: SeverityDist | null;
    Vulnerable: boolean;
    Vulnerabilities: DependencyInfoVulnerability[];
}

export interface DependencyInfoVulnerability {
    Vulnerability: string;
    Severity: Severity;
    Weaknesses: WeaknessInfo[];
}

export interface WeaknessInfo {
    WeaknessId: string;
    WeaknessName: string;
    WeaknessDescription: string;
    WeaknessExtendedDescription: string;
    OWASPTop10Id: string;
    OWASPTop10Name: string;
}

export interface Severity {
    Severity: number;
    SeverityType: SeverityType;
    Vector: string;
    Impact: number;
    Exploitability: number;
    ConfidentialityImpact: string;
    IntegrityImpact: string;
    AvailabilityImpact: string;
}

export enum SeverityType {
    CvssV2 = 'CVSS_V2',
    CvssV3 = 'CVSS_V3',
    CvssV31 = 'CVSS_V31'
}

export enum PatchType {
    Full = 'FULL',
    Partial = 'PARTIAL',
    None = 'NONE'
}

interface Conflict {
    ConflictWinner: string;
    ConflictFlag: string;
}

export interface Vulnerability {
    Id: string;
    Sources: Source[];
    Affected: { [key: string]: AffectedInfo };
    AffectedDependencyName: string;
    AffectedDependencyVersion: string;
    AffectedDependency: string;
    AffectedDependencyFilePath: string;
    AffectedDependencyObject?: any;
    Vulnerability: string;
    Severity: Severity;
    Weaknesses?: WeaknessInfo[];
    PatchType: PatchType;
    Description: string;
    Conflict: Conflict;
}

export interface VulnerabilityMerged {
    Id: string;
    Sources: Source[];
    Affected: AffectedDeps[];
    Vulnerability: string;
    Severity: Severity;
    Weaknesses: WeaknessInfo[];
    Description: string;
    WinningSource: string;
    Conflict: Conflict;
    VLAI: VLAI[];
}

export interface VLAI {
    Source: Source;
    Score: string;
    Confidence: number;
}

export interface AffectedDeps {
    Affected: { [key: string]: AffectedInfo };
    AffectedDependencyName: string;
    AffectedVersion: string;
    AffectedDependency: string;
    AffectedDependencyFilePath: string;
    AffectedDependencyImportPaths: string[];
    AffectedDependencyObject?: any;
    PatchType: PatchType;
}

export declare interface AffectedRange {
    IntroducedString: string;
    FixedString: string;
}

export declare interface AffectedInfo {
    Exact: string[];
    Ranges: AffectedRange[];
    Universal: boolean;
}

export enum Source {
    Nvd = 'NVD',
    Osv = 'OSV'
}

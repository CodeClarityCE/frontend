export interface CodeQLResult {
    ruleId: string;
    ruleIndex: number;
    message: Message;
    locations: Location[];
}

export interface Message {
    text: string;
}

export interface Location {
    physicalLocation: PhysicalLocation;
}

interface PhysicalLocation {
    artifactLocation: ArtifactLocation;
    region: Region;
}

interface ArtifactLocation {
    uri: string;
    uriBaseId: string;
    index: number;
}

interface Region {
    startLine: number;
    endLine: number;
    startColumn: number;
    endColumn: number;
}

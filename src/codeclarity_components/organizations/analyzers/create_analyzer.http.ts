export interface CreateAnalyzer {
    name: string;
    description: string;
    steps: Record<string, unknown>[];
    supported_languages?: string[];
    language_config?: {
        javascript?: { plugins: string[] };
        php?: { plugins: string[] };
        [key: string]: { plugins: string[] } | undefined;
    };
    logo?: string;
}

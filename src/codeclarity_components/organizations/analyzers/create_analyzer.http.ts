export interface CreateAnalyzer {
    name: string;
    description: string;
    steps: Array<any>;
    supported_languages?: string[];
    language_config?: {
        javascript?: { plugins: string[] };
        php?: { plugins: string[] };
        [key: string]: { plugins: string[] } | undefined;
    };
    logo?: string;
}

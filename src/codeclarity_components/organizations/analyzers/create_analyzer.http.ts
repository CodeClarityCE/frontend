import type { WorkflowStep } from '@/utils/vueFlow';

export interface CreateAnalyzer {
    name: string;
    description: string;
    steps: WorkflowStep[][];
    supported_languages?: string[];
    language_config?: {
        javascript?: { plugins: string[] };
        php?: { plugins: string[] };
        [key: string]: { plugins: string[] } | undefined;
    };
    logo?: string;
}

/**
 * Shared type definitions for test utilities
 */

/**
 * Memory information interface matching Performance.memory API
 */
export interface MemoryInfo {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
}

/**
 * Performance metrics collected during tests
 */
export interface TestPerformanceMetrics {
    duration: number;
    memoryUsage?: MemoryInfo;
    timestamp: Date;
}

/**
 * Test result with analytics
 */
export interface TestResultAnalytics {
    testName: string;
    suiteName: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error?: string;
}

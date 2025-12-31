/**
 * Test Analytics and Monitoring Utilities
 *
 * Tools for collecting, analyzing, and reporting test execution metrics
 */

import { performance } from 'perf_hooks';

import type { MemoryInfo } from './types';

/**
 * Test execution metrics interface
 */
export interface TestMetrics {
  testName: string;
  suiteName: string;
  filePath: string;
  duration: number;
  status: 'passed' | 'failed' | 'skipped';
  retryCount: number;
  memoryUsage?: MemoryInfo;
  timestamp: number;
  error?: string;
  tags?: string[];
}

/**
 * Test suite analytics
 */
export interface SuiteAnalytics {
  suiteName: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  totalDuration: number;
  averageDuration: number;
  slowestTest: string;
  fastestTest: string;
  flakyTests: string[];
  memoryUsage: {
    min: number;
    max: number;
    average: number;
  };
}

/**
 * Flaky test detection
 */
export interface FlakyTestData {
  testName: string;
  suiteName: string;
  filePath: string;
  failureRate: number;
  totalRuns: number;
  failures: number;
  lastFailure: number;
  errorPatterns: string[];
}

/**
 * Test analytics collector
 */
export class TestAnalyticsCollector {
  private metrics: TestMetrics[] = [];
  private suiteStartTimes = new Map<string, number>();
  private testStartTimes = new Map<string, number>();
  private flakyTestHistory = new Map<string, FlakyTestData>();
  
  constructor(private persistentStorage = false) {
    if (this.persistentStorage) {
      this.loadPersistedData();
    }
  }

  /**
   * Start tracking a test suite
   */
  startSuite(suiteName: string): void {
    this.suiteStartTimes.set(suiteName, performance.now());
  }

  /**
   * Start tracking a test
   */
  startTest(testName: string, suiteName: string): void {
    const key = `${suiteName}:${testName}`;
    this.testStartTimes.set(key, performance.now());
  }

  /**
   * Record test completion
   */
  endTest(
    testName: string,
    suiteName: string,
    filePath: string,
    status: TestMetrics['status'],
    error?: string,
    retryCount = 0,
    tags: string[] = []
  ): void {
    const key = `${suiteName}:${testName}`;
    const startTime = this.testStartTimes.get(key);
    const endTime = performance.now();
    
    if (!startTime) {
      console.warn(`No start time recorded for test: ${key}`);
      return;
    }

    const duration = endTime - startTime;
    const memoryUsage = this.getMemoryUsage();

    const metric: TestMetrics = {
      testName,
      suiteName,
      filePath,
      duration,
      status,
      retryCount,
      memoryUsage,
      timestamp: Date.now(),
      error,
      tags
    };

    this.metrics.push(metric);
    this.testStartTimes.delete(key);

    // Track flaky test patterns
    this.updateFlakyTestData(testName, suiteName, filePath, status, error);

    if (this.persistentStorage) {
      this.persistData();
    }
  }

  /**
   * Get analytics for a specific suite
   */
  getSuiteAnalytics(suiteName: string): SuiteAnalytics {
    const suiteMetrics = this.metrics.filter(m => m.suiteName === suiteName);
    
    if (suiteMetrics.length === 0) {
      throw new Error(`No metrics found for suite: ${suiteName}`);
    }

    const totalTests = suiteMetrics.length;
    const passed = suiteMetrics.filter(m => m.status === 'passed').length;
    const failed = suiteMetrics.filter(m => m.status === 'failed').length;
    const skipped = suiteMetrics.filter(m => m.status === 'skipped').length;
    
    const durations = suiteMetrics.map(m => m.duration);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const averageDuration = totalDuration / totalTests;
    
    const sortedByDuration = [...suiteMetrics].sort((a, b) => b.duration - a.duration);
    const slowestTest = sortedByDuration[0]?.testName ?? '';
    const fastestTest = sortedByDuration[sortedByDuration.length - 1]?.testName ?? '';
    
    const memoryUsages = suiteMetrics
      .map(m => m.memoryUsage?.usedJSHeapSize ?? 0)
      .filter(u => u > 0);
    
    const flakyTests = this.getFlakyTestsForSuite(suiteName);

    return {
      suiteName,
      totalTests,
      passed,
      failed,
      skipped,
      totalDuration,
      averageDuration,
      slowestTest,
      fastestTest,
      flakyTests,
      memoryUsage: {
        min: Math.min(...memoryUsages),
        max: Math.max(...memoryUsages),
        average: memoryUsages.reduce((sum, u) => sum + u, 0) / memoryUsages.length || 0
      }
    };
  }

  /**
   * Get overall test analytics
   */
  getOverallAnalytics(): {
    totalSuites: number;
    totalTests: number;
    successRate: number;
    averageTestDuration: number;
    slowestSuite: string;
    fastestSuite: string;
    mostFlakyTests: FlakyTestData[];
    trendData: {
      date: string;
      successRate: number;
      averageDuration: number;
      testCount: number;
    }[];
  } {
    const suiteNames = [...new Set(this.metrics.map(m => m.suiteName))];
    const totalSuites = suiteNames.length;
    const totalTests = this.metrics.length;
    const passed = this.metrics.filter(m => m.status === 'passed').length;
    const successRate = (passed / totalTests) * 100;
    
    const durations = this.metrics.map(m => m.duration);
    const averageTestDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    
    // Suite performance analysis
    const suiteAnalytics = suiteNames.map(name => ({
      name,
      analytics: this.getSuiteAnalytics(name)
    }));
    
    const sortedSuites = suiteAnalytics.sort((a, b) => b.analytics.averageDuration - a.analytics.averageDuration);
    const slowestSuite = sortedSuites[0]?.name ?? '';
    const fastestSuite = sortedSuites[sortedSuites.length - 1]?.name ?? '';
    
    // Flaky test ranking
    const mostFlakyTests = Array.from(this.flakyTestHistory.values())
      .sort((a, b) => b.failureRate - a.failureRate)
      .slice(0, 10);
    
    // Trend data (last 30 days)
    const trendData = this.generateTrendData();

    return {
      totalSuites,
      totalTests,
      successRate,
      averageTestDuration,
      slowestSuite,
      fastestSuite,
      mostFlakyTests,
      trendData
    };
  }

  /**
   * Identify slow tests across all suites
   */
  getSlowTests(threshold = 1000): TestMetrics[] {
    return this.metrics
      .filter(m => m.duration > threshold)
      .sort((a, b) => b.duration - a.duration);
  }

  /**
   * Identify frequently failing tests
   */
  getFailurePatterns(): {
    testName: string;
    suiteName: string;
    failureCount: number;
    errorPatterns: string[];
    lastFailure: Date;
  }[] {
    const failures = this.metrics.filter(m => m.status === 'failed');
    const grouped = new Map<string, TestMetrics[]>();
    
    failures.forEach(metric => {
      const key = `${metric.suiteName}:${metric.testName}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(metric);
    });
    
    return Array.from(grouped.entries())
      .map(([key, metrics]) => {
        const parts = key.split(':');
        const suiteName = parts[0] ?? '';
        const testName = parts[1] ?? '';
        const errorPatterns = [...new Set(metrics.map(m => m.error ?? '').filter(e => e))];
        const lastFailure = new Date(Math.max(...metrics.map(m => m.timestamp)));

        return {
          testName,
          suiteName,
          failureCount: metrics.length,
          errorPatterns,
          lastFailure
        };
      })
      .sort((a, b) => b.failureCount - a.failureCount);
  }

  /**
   * Generate test coverage trend report
   */
  generateTrendReport(days = 30): {
    date: string;
    metrics: {
      totalTests: number;
      successRate: number;
      averageDuration: number;
      memoryUsage: number;
    };
  }[] {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const trends = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = now - (i * dayMs);
      const dayEnd = dayStart + dayMs;
      
      const dayMetrics = this.metrics.filter(
        m => m.timestamp >= dayStart && m.timestamp < dayEnd
      );
      
      if (dayMetrics.length === 0) continue;
      
      const totalTests = dayMetrics.length;
      const passed = dayMetrics.filter(m => m.status === 'passed').length;
      const successRate = (passed / totalTests) * 100;
      const averageDuration = dayMetrics.reduce((sum, m) => sum + m.duration, 0) / totalTests;
      const memoryUsage = dayMetrics
        .map(m => m.memoryUsage?.usedJSHeapSize ?? 0)
        .reduce((sum, u) => sum + u, 0) / totalTests;

      trends.push({
        date: new Date(dayStart).toISOString().split('T')[0] ?? '',
        metrics: {
          totalTests,
          successRate,
          averageDuration,
          memoryUsage
        }
      });
    }

    return trends;
  }

  /**
   * Export analytics data
   */
  exportData(): {
    metrics: TestMetrics[];
    flakyTests: FlakyTestData[];
    analytics: ReturnType<TestAnalyticsCollector['getOverallAnalytics']>;
  } {
    return {
      metrics: [...this.metrics],
      flakyTests: Array.from(this.flakyTestHistory.values()),
      analytics: this.getOverallAnalytics()
    };
  }

  /**
   * Generate test quality score
   */
  getTestQualityScore(): {
    score: number;
    breakdown: {
      successRate: number;
      performance: number;
      stability: number;
      coverage: number;
    };
    recommendations: string[];
  } {
    const analytics = this.getOverallAnalytics();
    const slowTests = this.getSlowTests();
    const flakyTests = analytics.mostFlakyTests;
    
    // Success rate score (0-40 points)
    const successRateScore = Math.min(40, (analytics.successRate / 100) * 40);
    
    // Performance score (0-25 points)
    const avgDuration = analytics.averageTestDuration;
    const performanceScore = Math.max(0, 25 - (avgDuration / 100)); // Penalize slow tests
    
    // Stability score (0-25 points) - fewer flaky tests = higher score
    const flakyTestCount = flakyTests.length;
    const stabilityScore = Math.max(0, 25 - (flakyTestCount * 2.5));
    
    // Coverage score (0-10 points) - based on mutation testing if available
    const coverageScore = 10; // Placeholder - would integrate with actual coverage data
    
    const totalScore = successRateScore + performanceScore + stabilityScore + coverageScore;
    
    const recommendations = [];
    if (analytics.successRate < 95) {
      recommendations.push('Improve test reliability - success rate is below 95%');
    }
    if (slowTests.length > 10) {
      recommendations.push('Optimize slow tests - consider mocking or reducing test scope');
    }
    if (flakyTests.length > 0) {
      recommendations.push('Fix flaky tests to improve test stability');
    }
    if (analytics.averageTestDuration > 500) {
      recommendations.push('Consider parallelization or test optimization');
    }
    
    return {
      score: Math.round(totalScore),
      breakdown: {
        successRate: successRateScore,
        performance: performanceScore,
        stability: stabilityScore,
        coverage: coverageScore
      },
      recommendations
    };
  }

  private updateFlakyTestData(
    testName: string,
    suiteName: string,
    filePath: string,
    status: TestMetrics['status'],
    error?: string
  ): void {
    const key = `${suiteName}:${testName}`;

    if (!this.flakyTestHistory.has(key)) {
      this.flakyTestHistory.set(key, {
        testName,
        suiteName,
        filePath,
        failureRate: 0,
        totalRuns: 0,
        failures: 0,
        lastFailure: 0,
        errorPatterns: []
      });
    }

    const data = this.flakyTestHistory.get(key)!;
    data.totalRuns++;

    if (status === 'failed') {
      data.failures++;
      data.lastFailure = Date.now();

      if (error && !data.errorPatterns.includes(error)) {
        data.errorPatterns.push(error);
      }
    }

    data.failureRate = (data.failures / data.totalRuns) * 100;
  }

  private getFlakyTestsForSuite(suiteName: string): string[] {
    return Array.from(this.flakyTestHistory.values())
      .filter((data): boolean => data.suiteName === suiteName && data.failureRate > 10)
      .map((data): string => data.testName);
  }

  private generateTrendData(): {
    date: string;
    successRate: number;
    averageDuration: number;
    testCount: number;
  }[] {
    // Generate mock trend data - in real implementation, would use historical data
    return [];
  }

  private getMemoryUsage(): MemoryInfo | undefined {
    if (typeof window !== 'undefined') {
      const perfWithMemory = window.performance as unknown as { memory?: MemoryInfo };
      return perfWithMemory.memory;
    }
    return undefined;
  }

  private loadPersistedData(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('test-analytics-data');
        if (stored) {
          const data = JSON.parse(stored) as {
            metrics?: TestMetrics[];
            flakyTests?: [string, FlakyTestData][];
          };
          this.metrics = data.metrics ?? [];
          this.flakyTestHistory = new Map(data.flakyTests ?? []);
        }
      } catch (error) {
        console.warn('Failed to load persisted analytics data:', error);
      }
    }
  }

  private persistData(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const data = {
          metrics: this.metrics.slice(-1000), // Keep last 1000 entries
          flakyTests: Array.from(this.flakyTestHistory.entries())
        };
        localStorage.setItem('test-analytics-data', JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to persist analytics data:', error);
      }
    }
  }
}

/**
 * Global analytics collector instance
 */
export const testAnalytics = new TestAnalyticsCollector(true);

/**
 * Vitest reporter for analytics collection
 */
export class AnalyticsReporter {
  constructor(private collector: TestAnalyticsCollector) {}

  onSuiteStart(suite: { name: string }): void {
    this.collector.startSuite(suite.name);
  }

  onTestStart(test: { name: string; suite?: { name: string } }): void {
    this.collector.startTest(test.name, test.suite?.name ?? 'unknown');
  }

  onTestFinished(test: {
    name: string;
    suite?: { name: string };
    file?: string;
    passed?: boolean;
    skipped?: boolean;
    error?: { message?: string; stack?: string };
    retryCount?: number;
  }): void {
    let status: 'passed' | 'failed' | 'skipped';
    if (test.passed) {
      status = 'passed';
    } else if (test.skipped) {
      status = 'skipped';
    } else {
      status = 'failed';
    }
    const error = test.error?.message ?? test.error?.stack;
    
    this.collector.endTest(
      test.name,
      test.suite?.name ?? 'unknown',
      test.file ?? '',
      status,
      error,
      test.retryCount ?? 0
    );
  }
}

/**
 * CI/CD integration utilities
 */
export class CIAnalyticsIntegration {
  static generateJUnitReport(metrics: TestMetrics[]): string {
    const suites = this.groupBySuite(metrics);
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<testsuites>\n';
    
    for (const [suiteName, tests] of suites) {
      const totalTime = tests.reduce((sum, test) => sum + test.duration, 0) / 1000; // Convert to seconds
      const failures = tests.filter(test => test.status === 'failed').length;
      const skipped = tests.filter(test => test.status === 'skipped').length;
      
      xml += `  <testsuite name="${this.escapeXml(suiteName)}" tests="${tests.length}" failures="${failures}" skipped="${skipped}" time="${totalTime.toFixed(3)}">\n`;
      
      for (const test of tests) {
        const time = (test.duration / 1000).toFixed(3);
        xml += `    <testcase name="${this.escapeXml(test.testName)}" classname="${this.escapeXml(suiteName)}" time="${time}">`;
        
        if (test.status === 'failed') {
          xml += `\n      <failure message="${this.escapeXml(test.error ?? 'Test failed')}">${this.escapeXml(test.error ?? '')}</failure>\n    `;
        } else if (test.status === 'skipped') {
          xml += '\n      <skipped/>\n    ';
        }
        
        xml += '</testcase>\n';
      }
      
      xml += '  </testsuite>\n';
    }
    
    xml += '</testsuites>';
    return xml;
  }

  static generateSlackReport(analytics: ReturnType<TestAnalyticsCollector['getOverallAnalytics']>): object {
    let color: string;
    if (analytics.successRate > 95) {
      color = 'good';
    } else if (analytics.successRate > 80) {
      color = 'warning';
    } else {
      color = 'danger';
    }
    
    return {
      attachments: [
        {
          color,
          title: 'Test Execution Report',
          fields: [
            {
              title: 'Success Rate',
              value: `${analytics.successRate.toFixed(1)}%`,
              short: true
            },
            {
              title: 'Total Tests',
              value: analytics.totalTests.toString(),
              short: true
            },
            {
              title: 'Average Duration',
              value: `${analytics.averageTestDuration.toFixed(0)}ms`,
              short: true
            },
            {
              title: 'Flaky Tests',
              value: analytics.mostFlakyTests.length.toString(),
              short: true
            }
          ],
          footer: 'Test Analytics',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };
  }

  private static groupBySuite(metrics: TestMetrics[]): Map<string, TestMetrics[]> {
    const suites = new Map<string, TestMetrics[]>();

    for (const metric of metrics) {
      if (!suites.has(metric.suiteName)) {
        suites.set(metric.suiteName, []);
      }
      suites.get(metric.suiteName)!.push(metric);
    }

    return suites;
  }

  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
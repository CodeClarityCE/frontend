/**
 * Performance Testing Utilities
 *
 * Utilities for measuring and testing frontend performance
 */

import type { VueWrapper } from '@vue/test-utils';
import type { MemoryInfo } from './types';

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  renderTime: number;
  mountTime: number;
  updateTime?: number;
  memoryUsage?: MemoryInfo;
  bundleSize?: BundleMetrics;
  lighthouse?: LighthouseMetrics;
}

/**
 * Bundle size metrics
 */
export interface BundleMetrics {
  totalSize: number;
  gzipSize: number;
  assets: {
    name: string;
    size: number;
    gzipSize?: number;
  }[];
  chunks: {
    name: string;
    size: number;
    modules: number;
  }[];
}

/**
 * Lighthouse performance metrics
 */
export interface LighthouseMetrics {
  performanceScore: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
  speedIndex: number;
}

/**
 * Component performance benchmarks
 */
export const PERFORMANCE_BENCHMARKS = {
  renderTime: {
    excellent: 16, // 60fps
    good: 33,      // 30fps
    fair: 50,
    poor: 100
  },
  mountTime: {
    excellent: 50,
    good: 100,
    fair: 200,
    poor: 500
  },
  updateTime: {
    excellent: 10,
    good: 20,
    fair: 40,
    poor: 100
  },
  bundleSize: {
    excellent: 100 * 1024,      // 100KB
    good: 250 * 1024,           // 250KB
    fair: 500 * 1024,           // 500KB
    poor: 1024 * 1024           // 1MB
  }
} as const;

/**
 * Measure component render performance
 */
export async function measureComponentPerformance(
  renderComponent: () => VueWrapper<any>,
  iterations = 10
): Promise<PerformanceMetrics> {
  const renderTimes: number[] = [];
  const mountTimes: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    // Measure render time
    const renderStart = performance.now();
    const wrapper = renderComponent();
    const renderEnd = performance.now();
    renderTimes.push(renderEnd - renderStart);
    
    // Measure mount time (time to DOM)
    const mountStart = performance.now();
    await wrapper.vm.$nextTick();
    const mountEnd = performance.now();
    mountTimes.push(mountEnd - mountStart);
    
    // Cleanup
    wrapper.unmount();
    
    // Small delay to prevent interference
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  return {
    renderTime: calculateAverage(renderTimes),
    mountTime: calculateAverage(mountTimes),
    memoryUsage: getMemoryUsage()
  };
}

/**
 * Measure component update performance
 */
export async function measureUpdatePerformance(
  wrapper: VueWrapper<any>,
  updateFn: () => void | Promise<void>,
  iterations = 10
): Promise<number> {
  const updateTimes: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const updateStart = performance.now();
    
    if (typeof updateFn === 'function') {
      await updateFn();
    }
    
    await wrapper.vm.$nextTick();
    const updateEnd = performance.now();
    
    updateTimes.push(updateEnd - updateStart);
    
    // Small delay between iterations
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  
  return calculateAverage(updateTimes);
}

/**
 * Stress test component with large datasets
 */
export async function stressTestComponent(
  renderComponent: (dataSize: number) => VueWrapper<any>,
  dataSizes: number[] = [10, 50, 100, 500, 1000]
): Promise<{
  dataSize: number;
  metrics: PerformanceMetrics;
  rating: 'excellent' | 'good' | 'fair' | 'poor';
}[]> {
  const results = [];
  
  for (const size of dataSizes) {
    console.log(`Testing with ${size} items...`);
    
    const metrics = await measureComponentPerformance(
      () => renderComponent(size),
      5 // Fewer iterations for stress testing
    );
    
    const rating = getRenderPerformanceRating(metrics.renderTime);
    
    results.push({
      dataSize: size,
      metrics,
      rating
    });
  }
  
  return results;
}

/**
 * Memory leak detection
 */
export async function detectMemoryLeaks(
  renderComponent: () => VueWrapper<any>,
  iterations = 20
): Promise<{
  hasLeak: boolean;
  memoryGrowth: number;
  initialMemory: MemoryInfo;
  finalMemory: MemoryInfo;
  samples: MemoryInfo[];
}> {
  const memorySamples: MemoryInfo[] = [];
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  const initialMemory = getMemoryUsage();
  memorySamples.push(initialMemory);
  
  for (let i = 0; i < iterations; i++) {
    const wrapper = renderComponent();
    await wrapper.vm.$nextTick();
    wrapper.unmount();
    
    // Collect memory sample every 5 iterations
    if (i % 5 === 0) {
      memorySamples.push(getMemoryUsage());
    }
  }
  
  const finalMemory = getMemoryUsage();
  memorySamples.push(finalMemory);
  
  // Calculate memory growth
  const memoryGrowth = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
  const threshold = 5 * 1024 * 1024; // 5MB threshold
  const hasLeak = memoryGrowth > threshold;
  
  return {
    hasLeak,
    memoryGrowth,
    initialMemory,
    finalMemory,
    samples: memorySamples
  };
}

/**
 * Bundle size analysis
 */
export async function analyzeBundleSize(): Promise<BundleMetrics> {
  // This would integrate with webpack-bundle-analyzer or similar
  // For now, return mock data structure
  return {
    totalSize: 0,
    gzipSize: 0,
    assets: [],
    chunks: []
  };
}

/**
 * Lighthouse performance audit
 */
export async function runLighthouseAudit(): Promise<LighthouseMetrics> {
  // This would run actual Lighthouse audit
  // For now, return mock data structure
  return {
    performanceScore: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    cumulativeLayoutShift: 0,
    firstInputDelay: 0,
    timeToInteractive: 0,
    speedIndex: 0
  };
}

/**
 * FPS (Frames Per Second) monitoring
 */
export class FPSMonitor {
  private frames: number[] = [];
  private startTime = 0;
  private rafId = 0;
  private isRunning = false;

  start(): void {
    this.frames = [];
    this.startTime = performance.now();
    this.isRunning = true;
    this.requestFrame();
  }

  stop(): number {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    
    return this.calculateAverageFPS();
  }

  private requestFrame(): void {
    if (!this.isRunning) return;
    
    this.rafId = requestAnimationFrame((timestamp) => {
      this.frames.push(timestamp);
      this.requestFrame();
    });
  }

  private calculateAverageFPS(): number {
    if (this.frames.length < 2) return 0;
    
    const totalTime = this.frames[this.frames.length - 1]! - this.frames[0]!;
    const frameCount = this.frames.length - 1;
    
    return Math.round((frameCount / totalTime) * 1000);
  }
}

/**
 * Component rerender counting
 */
export class RerenderCounter {
  private count = 0;
  private originalUpdate: any;

  constructor(private wrapper: VueWrapper<any>) {}

  start(): void {
    this.count = 0;
    // Hook into Vue's update lifecycle
    const vm = this.wrapper.vm;
    this.originalUpdate = vm.$options.updated;
    
    vm.$options.updated = [
      ...(Array.isArray(this.originalUpdate) ? this.originalUpdate : 
          this.originalUpdate ? [this.originalUpdate] : []),
      () => this.count++
    ];
  }

  stop(): number {
    // Restore original update hook
    if (this.originalUpdate) {
      this.wrapper.vm.$options.updated = this.originalUpdate;
    }
    
    return this.count;
  }

  getCount(): number {
    return this.count;
  }
}

/**
 * Performance test suite runner
 */
export class PerformanceTestSuite {
  private results: {
    component: string;
    test: string;
    metrics: PerformanceMetrics;
    passed: boolean;
    issues: string[];
  }[] = [];

  async runTest(
    componentName: string,
    testName: string,
    renderComponent: () => VueWrapper<any>
  ): Promise<void> {
    const metrics = await measureComponentPerformance(renderComponent);
    const issues: string[] = [];
    
    // Check render time
    if (metrics.renderTime > PERFORMANCE_BENCHMARKS.renderTime.poor) {
      issues.push(`Slow render time: ${metrics.renderTime.toFixed(2)}ms`);
    }
    
    // Check mount time
    if (metrics.mountTime > PERFORMANCE_BENCHMARKS.mountTime.poor) {
      issues.push(`Slow mount time: ${metrics.mountTime.toFixed(2)}ms`);
    }
    
    // Check memory usage
    if (metrics.memoryUsage && metrics.memoryUsage.usedJSHeapSize > 50 * 1024 * 1024) {
      issues.push(`High memory usage: ${(metrics.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    }
    
    this.results.push({
      component: componentName,
      test: testName,
      metrics,
      passed: issues.length === 0,
      issues
    });
  }

  async runMemoryLeakTest(
    componentName: string,
    renderComponent: () => VueWrapper<any>
  ): Promise<void> {
    const leakTest = await detectMemoryLeaks(renderComponent);
    
    this.results.push({
      component: componentName,
      test: 'Memory Leak Detection',
      metrics: {
        renderTime: 0,
        mountTime: 0,
        memoryUsage: leakTest.finalMemory
      },
      passed: !leakTest.hasLeak,
      issues: leakTest.hasLeak ? 
        [`Memory leak detected: ${(leakTest.memoryGrowth / 1024 / 1024).toFixed(2)}MB growth`] : 
        []
    });
  }

  generateReport(): {
    summary: {
      total: number;
      passed: number;
      failed: number;
      averageRenderTime: number;
      averageMountTime: number;
    };
    results: PerformanceTestSuite['results'];
    recommendations: string[];
  } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;
    
    const renderTimes = this.results.map(r => r.metrics.renderTime);
    const mountTimes = this.results.map(r => r.metrics.mountTime);
    
    const averageRenderTime = calculateAverage(renderTimes);
    const averageMountTime = calculateAverage(mountTimes);
    
    const recommendations: string[] = [];
    
    if (averageRenderTime > PERFORMANCE_BENCHMARKS.renderTime.good) {
      recommendations.push('Consider implementing virtualization for large lists');
      recommendations.push('Use React.memo() or computed properties to prevent unnecessary re-renders');
    }
    
    if (averageMountTime > PERFORMANCE_BENCHMARKS.mountTime.good) {
      recommendations.push('Consider lazy loading heavy components');
      recommendations.push('Optimize component initialization logic');
    }
    
    const failedTests = this.results.filter(r => !r.passed);
    if (failedTests.some(t => t.issues.some(i => i.includes('memory')))) {
      recommendations.push('Review component cleanup and event listener removal');
      recommendations.push('Use weak references where appropriate');
    }
    
    return {
      summary: {
        total,
        passed,
        failed,
        averageRenderTime,
        averageMountTime
      },
      results: this.results,
      recommendations
    };
  }

  printReport(): void {
    const report = this.generateReport();
    
    console.log('\n⚡ Performance Test Report');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Average Render Time: ${report.summary.averageRenderTime.toFixed(2)}ms`);
    console.log(`Average Mount Time: ${report.summary.averageMountTime.toFixed(2)}ms`);
    
    if (report.summary.failed > 0) {
      console.log('\n❌ Failed Tests:');
      report.results
        .filter((r: PerformanceTestSuite['results'][0]) => !r.passed)
        .forEach((result: PerformanceTestSuite['results'][0]) => {
          console.log(`  ${result.component} - ${result.test}:`);
          result.issues.forEach((issue: string) => {
            console.log(`    • ${issue}`);
          });
        });
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }
  }
}

/**
 * Helper functions
 */
function calculateAverage(numbers: number[]): number {
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
}

function getMemoryUsage(): MemoryInfo {
  return (performance as any).memory || {
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0
  };
}

function getRenderPerformanceRating(renderTime: number): 'excellent' | 'good' | 'fair' | 'poor' {
  const benchmarks = PERFORMANCE_BENCHMARKS.renderTime;
  
  if (renderTime <= benchmarks.excellent) return 'excellent';
  if (renderTime <= benchmarks.good) return 'good';
  if (renderTime <= benchmarks.fair) return 'fair';
  return 'poor';
}

/**
 * Real User Monitoring (RUM) utilities
 */
export class RUMCollector {
  private metrics: {
    timestamp: number;
    type: string;
    value: number;
    metadata?: any;
  }[] = [];

  recordMetric(type: string, value: number, metadata?: any): void {
    this.metrics.push({
      timestamp: Date.now(),
      type,
      value,
      metadata
    });
  }

  recordPageLoad(): void {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      this.recordMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart);
      this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
      this.recordMetric('first_paint', this.getFirstPaint());
      this.recordMetric('first_contentful_paint', this.getFirstContentfulPaint());
    }
  }

  private getFirstPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : 0;
  }

  private getFirstContentfulPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : 0;
  }

  getMetrics(): typeof this.metrics {
    return [...this.metrics];
  }

  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }
}

/**
 * Bundle size monitoring
 */
export function createBundleSizeConfig() {
  return {
    files: [
      {
        path: 'dist/assets/*.js',
        maxSize: '250 kB',
        compression: 'gzip'
      },
      {
        path: 'dist/assets/*.css',
        maxSize: '50 kB',
        compression: 'gzip'
      }
    ],
    ci: {
      trackBranches: ['main', 'develop'],
      repoBranchBase: 'main'
    }
  };
}
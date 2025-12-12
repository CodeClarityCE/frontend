/**
 * Visual Testing Utilities
 * 
 * Utilities for component-level visual regression testing using Vitest and Playwright
 */

// import { type Page } from '@playwright/test';
import type { VueWrapper } from '@vue/test-utils';

/**
 * Configuration for visual snapshots
 */
export interface VisualTestConfig {
  threshold?: number;
  animations?: 'disabled' | 'allow';
  clip?: { x: number; y: number; width: number; height: number };
  fullPage?: boolean;
  mask?: string[];
  mode?: 'light' | 'dark' | 'both';
  responsive?: boolean;
  delay?: number;
}

/**
 * Default visual test configuration
 */
export const defaultVisualConfig: VisualTestConfig = {
  threshold: 0.2, // 20% threshold for pixel differences
  animations: 'disabled',
  fullPage: false,
  responsive: true,
  delay: 100 // Wait 100ms for animations to settle
};

/**
 * Responsive breakpoints for visual testing
 */
export const VISUAL_BREAKPOINTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
  wide: { width: 1920, height: 1080 }
} as const;

/**
 * Common viewport sizes for testing
 */
export const COMMON_VIEWPORTS = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'iPad Pro', width: 1024, height: 1366 },
  { name: 'Desktop', width: 1280, height: 720 },
  { name: 'Large Desktop', width: 1920, height: 1080 }
] as const;

/**
 * Prepare component for visual testing by stabilizing dynamic content
 */
export function prepareComponentForVisualTest(wrapper: VueWrapper<any>): void {
  // Hide or replace dynamic content
  const dynamicElements = wrapper.element.querySelectorAll('[data-dynamic]');
  dynamicElements.forEach((el: Element) => {
    (el as HTMLElement).style.visibility = 'hidden';
  });

  // Replace timestamps with fixed values
  const timeElements = wrapper.element.querySelectorAll('[data-timestamp]');
  timeElements.forEach((el: Element) => {
    el.textContent = '2025-01-01 12:00:00';
  });

  // Hide loading indicators
  const loadingElements = wrapper.element.querySelectorAll('.loading, .spinner, [data-loading]');
  loadingElements.forEach((el: Element) => {
    (el as HTMLElement).style.display = 'none';
  });

  // Stabilize animations
  const animatedElements = wrapper.element.querySelectorAll('[data-animate]');
  animatedElements.forEach((el: Element) => {
    (el as HTMLElement).style.animation = 'none';
    (el as HTMLElement).style.transition = 'none';
  });
}

/**
 * Apply visual test styles to prevent flaky tests
 */
export function applyVisualTestStyles(element: HTMLElement): void {
  const style = document.createElement('style');
  style.textContent = `
    /* Disable animations and transitions */
    *, *::before, *::after {
      animation-duration: 0ms !important;
      animation-delay: 0ms !important;
      transition-duration: 0ms !important;
      transition-delay: 0ms !important;
    }
    
    /* Hide scrollbars */
    ::-webkit-scrollbar {
      display: none !important;
    }
    
    /* Stabilize cursor */
    * {
      cursor: default !important;
    }
    
    /* Hide dynamic content */
    [data-visual-hide] {
      visibility: hidden !important;
    }
    
    /* Stabilize random content */
    [data-random]::before {
      content: "STABLE_CONTENT" !important;
    }
  `;
  
  element.ownerDocument.head.appendChild(style);
}

/**
 * Mock data for consistent visual tests
 */
export const VISUAL_TEST_DATA = {
  user: {
    name: 'Test User',
    email: 'test@example.com',
    avatar: 'https://via.placeholder.com/40x40/007bff/ffffff?text=TU'
  },
  vulnerabilities: Array.from({ length: 5 }, (_, i) => ({
    id: `vuln-${i + 1}`,
    title: `Test Vulnerability ${i + 1}`,
    severity: ['critical', 'high', 'medium', 'low'][i % 4],
    package: `test-package-${i + 1}`,
    version: '1.0.0',
    description: 'This is a test vulnerability for visual testing purposes.'
  })),
  projects: Array.from({ length: 3 }, (_, i) => ({
    id: `project-${i + 1}`,
    name: `Test Project ${i + 1}`,
    language: ['JavaScript', 'TypeScript', 'Python'][i],
    vulnerabilities: (i + 1) * 5,
    lastScan: '2025-01-01T12:00:00Z'
  }))
};

/**
 * Wait for component to be visually stable
 */
export async function waitForVisualStability(
  wrapper: VueWrapper<any>, 
  timeout = 2000
): Promise<void> {
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const checkStability = () => {
      const loadingElements = wrapper.element.querySelectorAll(
        '.loading, .spinner, [data-loading="true"]'
      );
      
      if (loadingElements.length === 0) {
        resolve();
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error('Component did not become visually stable within timeout'));
        return;
      }
      
      setTimeout(checkStability, 50);
    };
    
    checkStability();
  });
}

/**
 * Create a visual test suite for a component across multiple breakpoints
 */
export function createResponsiveVisualTest(
  componentName: string,
  renderComponent: () => VueWrapper<any>,
  scenarios: {
    name: string;
    setup?: (wrapper: VueWrapper<any>) => void | Promise<void>;
  }[]
) {
  return {
    run: async () => {
      const results: {
        breakpoint: string;
        scenario: string;
        success: boolean;
        error?: string;
      }[] = [];

      for (const breakpoint of Object.keys(VISUAL_BREAKPOINTS)) {
        for (const scenario of scenarios) {
          try {
            const wrapper = renderComponent();
            
            // Apply breakpoint styles
            const { width, height } = VISUAL_BREAKPOINTS[breakpoint as keyof typeof VISUAL_BREAKPOINTS];
            wrapper.element.style.width = `${width}px`;
            wrapper.element.style.height = `${height}px`;
            
            // Run scenario setup
            if (scenario.setup) {
              await scenario.setup(wrapper);
            }
            
            // Prepare for visual testing
            prepareComponentForVisualTest(wrapper);
            applyVisualTestStyles(wrapper.element);
            
            // Wait for stability
            await waitForVisualStability(wrapper);
            
            // In a real implementation, you would take a screenshot here
            // and compare it against a baseline image
            
            results.push({
              breakpoint,
              scenario: scenario.name,
              success: true
            });
            
            wrapper.unmount();
          } catch (error) {
            results.push({
              breakpoint,
              scenario: scenario.name,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }
      
      return results;
    }
  };
}

/**
 * Performance-aware visual testing
 */
export async function measureVisualRenderTime(
  renderComponent: () => VueWrapper<any>
): Promise<{
  renderTime: number;
  stabilityTime: number;
  totalTime: number;
}> {
  const startTime = performance.now();
  
  const wrapper = renderComponent();
  const renderTime = performance.now() - startTime;
  
  const stabilityStart = performance.now();
  await waitForVisualStability(wrapper);
  const stabilityTime = performance.now() - stabilityStart;
  
  const totalTime = performance.now() - startTime;
  
  wrapper.unmount();
  
  return {
    renderTime,
    stabilityTime,
    totalTime
  };
}

/**
 * Visual test result type
 */
interface VisualTestResult {
  component: string;
  scenario: string;
  breakpoint: string;
  passed: boolean;
  differences?: number;
  renderTime?: number;
  error?: string;
}

/**
 * Visual test reporter
 */
export class VisualTestReporter {
  private results: VisualTestResult[] = [];

  addResult(result: VisualTestResult) {
    this.results.push(result);
  }

  generateReport(): {
    summary: {
      total: number;
      passed: number;
      failed: number;
      successRate: number;
    };
    byComponent: Record<string, {
      total: number;
      passed: number;
      failed: number;
    }>;
    failures: VisualTestResult[];
    slowests: VisualTestResult[];
  } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;
    
    const byComponent = this.results.reduce((acc, result) => {
      if (!acc[result.component]) {
        acc[result.component] = { total: 0, passed: 0, failed: 0 };
      }
      const componentStats = acc[result.component]!;
      componentStats.total++;
      if (result.passed) {
        componentStats.passed++;
      } else {
        componentStats.failed++;
      }
      return acc;
    }, {} as Record<string, { total: number; passed: number; failed: number }>);
    
    const failures = this.results.filter(r => !r.passed);
    const slowests = this.results
      .filter(r => r.renderTime !== undefined)
      .sort((a, b) => (b.renderTime || 0) - (a.renderTime || 0))
      .slice(0, 10);
    
    return {
      summary: {
        total,
        passed,
        failed,
        successRate: total > 0 ? (passed / total) * 100 : 0
      },
      byComponent,
      failures,
      slowests
    };
  }

  printReport() {
    const report = this.generateReport();
    
    console.log('\n📸 Visual Test Report');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Success Rate: ${report.summary.successRate.toFixed(1)}%`);
    
    if (report.failures.length > 0) {
      console.log('\n❌ Failures:');
      report.failures.forEach((failure: VisualTestResult) => {
        console.log(`  ${failure.component} - ${failure.scenario} (${failure.breakpoint}): ${failure.error}`);
      });
    }

    if (report.slowests.length > 0) {
      console.log('\n🐌 Slowest Renders:');
      report.slowests.forEach((slow: VisualTestResult) => {
        console.log(`  ${slow.component} - ${slow.scenario}: ${slow.renderTime}ms`);
      });
    }
    
    console.log('\n📊 By Component:');
    Object.entries(report.byComponent).forEach(([component, stats]) => {
      const rate = (stats.passed / stats.total * 100).toFixed(1);
      console.log(`  ${component}: ${stats.passed}/${stats.total} (${rate}%)`);
    });
  }
}

/**
 * Theme variations for visual testing
 */
export const THEME_VARIATIONS = {
  light: {
    name: 'Light Theme',
    class: 'theme-light',
    css: `
      :root {
        --bg-primary: #ffffff;
        --text-primary: #000000;
        --border-color: #e5e7eb;
      }
    `
  },
  dark: {
    name: 'Dark Theme',
    class: 'theme-dark',
    css: `
      :root {
        --bg-primary: #1f2937;
        --text-primary: #ffffff;
        --border-color: #374151;
      }
    `
  },
  highContrast: {
    name: 'High Contrast',
    class: 'theme-high-contrast',
    css: `
      :root {
        --bg-primary: #000000;
        --text-primary: #ffffff;
        --border-color: #ffffff;
      }
    `
  }
} as const;

/**
 * Apply theme for visual testing
 */
export function applyTheme(
  element: HTMLElement, 
  theme: keyof typeof THEME_VARIATIONS
): void {
  const themeConfig = THEME_VARIATIONS[theme];
  
  // Add theme class
  element.classList.add(themeConfig.class);
  
  // Add theme CSS
  const style = document.createElement('style');
  style.textContent = themeConfig.css;
  element.ownerDocument.head.appendChild(style);
}

/**
 * Cross-browser visual testing utilities
 */
export const BROWSER_CONFIGS = {
  chrome: {
    name: 'Chrome',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },
  firefox: {
    name: 'Firefox',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0'
  },
  safari: {
    name: 'Safari',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
  }
} as const;
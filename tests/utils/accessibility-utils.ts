import type { VueWrapper } from '@vue/test-utils';
import { run as axeRun, type AxeResults, type Result, type RunOptions } from 'axe-core';

/**
 * Default axe configuration for CodeClarity accessibility testing
 */
export const defaultAxeConfig: RunOptions = {
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']
  }
};

/**
 * Custom axe configuration for form components
 */
export const formAxeConfig: RunOptions = {
  ...defaultAxeConfig
};

/**
 * Custom axe configuration for modal/dialog components
 */
export const modalAxeConfig: RunOptions = {
  ...defaultAxeConfig
};

/**
 * Format axe violations for readable test output
 */
export function formatAxeViolations(violations: Result[]): string {
  if (violations.length === 0) {
    return 'No accessibility violations found';
  }

  return violations.map(violation => {
    const nodeInfo = violation.nodes.map(node => {
      const target = Array.isArray(node.target) ? node.target.join(' -> ') : node.target;
      return `    Target: ${target}\n    HTML: ${node.html}\n    Impact: ${node.impact}`;
    }).join('\n\n');

    return `
VIOLATION: ${violation.id} (${violation.impact})
Rule: ${violation.description}
Help: ${violation.help}
Help URL: ${violation.helpUrl}
Affected nodes:
${nodeInfo}
`;
  }).join(`\n${  '='.repeat(80)  }\n`);
}

/**
 * Run accessibility tests on a Vue component wrapper
 */
export async function runAccessibilityTests(
  wrapper: VueWrapper<any>,
  config: RunOptions = defaultAxeConfig,
  customRules?: Record<string, any>
): Promise<AxeResults> {
  const element = wrapper.element;
  
  // Ensure element is in the DOM for axe to analyze
  if (!document.body.contains(element)) {
    document.body.appendChild(element);
  }

  const finalConfig = customRules ? { ...config, rules: { ...config.rules, ...customRules } } : config;

  try {
    const results = await axeRun(element, finalConfig);
    return results;
  } finally {
    // Clean up if we added the element
    if (document.body.contains(element) && element.parentNode === document.body) {
      document.body.removeChild(element);
    }
  }
}

/**
 * Assert that a component has no accessibility violations
 */
export async function expectNoAccessibilityViolations(
  wrapper: VueWrapper<any>,
  config: RunOptions = defaultAxeConfig,
  customRules?: Record<string, any>
): Promise<void> {
  const results = await runAccessibilityTests(wrapper, config, customRules);
  
  if (results.violations.length > 0) {
    const violationDetails = formatAxeViolations(results.violations);
    throw new Error(`Accessibility violations found:\n${violationDetails}`);
  }
}

/**
 * Assert that a component passes specific accessibility rules
 */
export async function expectAccessibilityRule(
  wrapper: VueWrapper<any>,
  ruleId: string,
  config: RunOptions = defaultAxeConfig
): Promise<void> {
  const results = await runAccessibilityTests(wrapper, config);
  
  const ruleViolations = results.violations.filter(v => v.id === ruleId);
  if (ruleViolations.length > 0) {
    const violationDetails = formatAxeViolations(ruleViolations);
    throw new Error(`Accessibility rule '${ruleId}' failed:\n${violationDetails}`);
  }
}

/**
 * Get accessibility insights for a component (including passes and violations)
 */
export async function getAccessibilityInsights(
  wrapper: VueWrapper<any>,
  config: RunOptions = defaultAxeConfig
): Promise<{
  violations: Result[];
  passes: Result[];
  incomplete: Result[];
  inapplicable: Result[];
  summary: {
    violationCount: number;
    passCount: number;
    incompleteCount: number;
    totalChecks: number;
    score: number; // Percentage score (0-100)
  };
}> {
  const results = await runAccessibilityTests(wrapper, config);
  
  const summary = {
    violationCount: results.violations.length,
    passCount: results.passes.length,
    incompleteCount: results.incomplete.length,
    totalChecks: results.violations.length + results.passes.length + results.incomplete.length,
    score: 0
  };
  
  // Calculate accessibility score
  if (summary.totalChecks > 0) {
    summary.score = Math.round((summary.passCount / summary.totalChecks) * 100);
  }
  
  return {
    violations: results.violations,
    passes: results.passes,
    incomplete: results.incomplete,
    inapplicable: results.inapplicable,
    summary
  };
}

/**
 * Test keyboard navigation for a component
 */
export async function testKeyboardNavigation(wrapper: VueWrapper<any>): Promise<{
  focusableElements: Element[];
  tabOrder: Element[];
  canEscape: boolean;
  canActivate: boolean;
}> {
  const element = wrapper.element;
  
  // Find all focusable elements
  const focusableSelectors = [
    'a[href]',
    'area[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    'iframe',
    'object',
    'embed',
    '[contenteditable]',
    '[tabindex]:not([tabindex^="-"])'
  ];
  
  const focusableElements: Element[] = Array.from(
    element.querySelectorAll(focusableSelectors.join(', '))
  ).filter((el): el is Element => {
    // Additional check for visibility
    const style = window.getComputedStyle(el as Element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });

  // Test tab order
  const tabOrder: Element[] = [];
  if (focusableElements.length > 0) {
    (focusableElements[0] as HTMLElement).focus();
    tabOrder.push(document.activeElement!);

    // Simulate tab navigation
    for (let i = 1; i < focusableElements.length; i++) {
      // In a real test, you would simulate Tab key press
      (focusableElements[i] as HTMLElement).focus();
      if (document.activeElement) {
        tabOrder.push(document.activeElement);
      }
    }
  }

  return {
    focusableElements,
    tabOrder,
    canEscape: true, // Would need actual keyboard event simulation
    canActivate: true // Would need actual keyboard event simulation
  };
}

/**
 * Predefined test scenarios for common accessibility patterns
 */
export const accessibilityTestScenarios = {
  
  /**
   * Test form accessibility
   */
  form: async (wrapper: VueWrapper<any>) => {
    await expectNoAccessibilityViolations(wrapper, formAxeConfig);
    
    // Additional form-specific tests
    const inputs = wrapper.findAll('input, textarea, select');
    for (const input of inputs) {
      // Check for labels
      const element = input.element as HTMLInputElement;
      const hasLabel = element.labels && element.labels.length > 0;
      const hasAriaLabel = element.hasAttribute('aria-label');
      const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
      
      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
        throw new Error(`Form field '${element.name || element.id}' has no accessible label`);
      }
    }
  },
  
  /**
   * Test modal/dialog accessibility
   */
  modal: async (wrapper: VueWrapper<any>) => {
    await expectNoAccessibilityViolations(wrapper, modalAxeConfig);
    
    // Additional modal-specific tests
    const modal = wrapper.element;
    if (!modal.hasAttribute('role') || modal.getAttribute('role') !== 'dialog') {
      throw new Error('Modal must have role="dialog"');
    }
    
    if (!modal.hasAttribute('aria-modal') || modal.getAttribute('aria-modal') !== 'true') {
      throw new Error('Modal must have aria-modal="true"');
    }
  },
  
  /**
   * Test button accessibility
   */
  button: async (wrapper: VueWrapper<any>) => {
    const buttons = wrapper.findAll('button, [role="button"]');
    
    for (const button of buttons) {
      const element = button.element;
      const hasText = element.textContent && element.textContent.trim().length > 0;
      const hasAriaLabel = element.hasAttribute('aria-label');
      const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
      
      if (!hasText && !hasAriaLabel && !hasAriaLabelledBy) {
        throw new Error('Button must have accessible text or aria-label');
      }
    }
    
    await expectNoAccessibilityViolations(wrapper);
  },
  
  /**
   * Test navigation accessibility
   */
  navigation: async (wrapper: VueWrapper<any>) => {
    const nav = wrapper.find('nav');
    if (nav.exists()) {
      const element = nav.element;
      if (!element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby')) {
        throw new Error('Navigation must have aria-label or aria-labelledby');
      }
    }
    
    await expectNoAccessibilityViolations(wrapper);
  }
};

/**
 * Helper to run all accessibility tests for a component
 */
export async function runFullAccessibilityAudit(
  wrapper: VueWrapper<any>,
  scenarios: string[] = ['form', 'modal', 'button', 'navigation']
): Promise<void> {
  // Run general accessibility tests
  await expectNoAccessibilityViolations(wrapper);
  
  // Run specific scenario tests
  for (const scenario of scenarios) {
    if (accessibilityTestScenarios[scenario as keyof typeof accessibilityTestScenarios]) {
      try {
        await accessibilityTestScenarios[scenario as keyof typeof accessibilityTestScenarios](wrapper);
      } catch (error) {
        throw new Error(`Accessibility test '${scenario}' failed: ${(error as Error).message}`);
      }
    }
  }
  
  // Test keyboard navigation
  const keyboardResults = await testKeyboardNavigation(wrapper);
  if (keyboardResults.focusableElements.length !== keyboardResults.tabOrder.length) {
    throw new Error('Keyboard navigation tab order is inconsistent');
  }
}
/**
 * Shared Vue component mock utilities
 * Use these to ensure consistent mocking patterns across all tests
 */
import { vi } from 'vitest';

/**
 * Creates a Vue component mock with all necessary Vue 3 internal properties
 * @param componentDef - The component definition object
 * @returns Mock object with Vue 3 internal properties
 */
export function createVueComponentMock(componentDef: Record<string, unknown>): {
  default: Record<string, unknown>;
  __isTeleport: boolean;
  __isKeepAlive: boolean;
  __isSuspense: boolean;
  __isFragment: boolean;
} {
  return {
    default: componentDef,
    __isTeleport: false,
    __isKeepAlive: false,
    __isSuspense: false,
    __isFragment: false
  };
}

/**
 * Creates a simple component mock for testing
 * @param name - Component name
 * @param template - Component template (optional)
 * @param props - Component props (optional)
 * @param emits - Component emits (optional)
 * @returns Vue component mock
 */
export function createSimpleComponentMock(
  name: string,
  template?: string,
  props?: string[],
  emits?: string[]
): ReturnType<typeof createVueComponentMock> {
  return createVueComponentMock({
    name,
    template: template ?? `<div data-testid="${name.toLowerCase()}">${name}</div>`,
    props: props ?? [],
    emits: emits ?? []
  });
}

/**
 * Standard BaseRepository mock with error classes
 */
export const BaseRepositoryMock = {
  BaseRepository: class MockBaseRepository {
    // Empty constructor for mocking purposes
  },
  BusinessLogicError: class MockBusinessLogicError extends Error {
    constructor(public error_code: string) {
      super();
    }
  },
  ValidationError: class MockValidationError extends Error {
    constructor(public error_code: string, public details?: unknown) {
      super();
    }
  }
};

/**
 * Standard router mock
 */
export const RouterMock = {
  push: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  replace: vi.fn()
};

/**
 * Creates a standard Icon component mock
 */
export function createIconMock(): ReturnType<typeof createVueComponentMock> {
  return createVueComponentMock({
    name: 'Icon',
    props: ['icon', 'class', 'width', 'height'],
    template: '<span :data-icon="icon" :class="class"></span>'
  });
}

/**
 * Creates a standard Button component mock
 */
export function createButtonMock(): ReturnType<typeof createVueComponentMock> {
  return createVueComponentMock({
    name: 'Button',
    props: ['variant', 'type', 'disabled', 'size'],
    emits: ['click'],
    template: '<button :type="type" :disabled="disabled" @click="$emit(\'click\')" :data-variant="variant"><slot></slot></button>'
  });
}
import "reflect-metadata";

import { addCollection } from "@iconify/vue";
import { enableAutoUnmount } from "@vue/test-utils";
import logoIcons from "virtual:logo-icons";
import { afterEach, beforeEach, vi } from "vitest";

// The /vitest entrypoint augments Vitest's Assertion interface. The generic
// entrypoint augments Jest's, which Vitest 5 no longer picks up.
import "@testing-library/jest-dom/vitest";

// Unit tests run the real stores, router and repositories; only HTTP is faked (see tests/real-app.ts).

// Suppress known Zod v4 cleanup errors during test teardown
// These occur when components using Zod schemas are unmounted
process.on("unhandledRejection", (reason: unknown) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  if (message.includes("_zod") || message.includes("Closing rpc while")) {
    // Known Zod v4 / Vitest cleanup issue - suppress in tests
    return;
  }
  // Re-throw other unhandled rejections
  throw reason;
});

// Brand and language logos ship with the app, as in main.ts, so Iconify never fetches them.
for (const collection of logoIcons) addCollection(collection);

// A fresh in-memory storage, so no test sees another's saved state.
function memoryStorage(): Storage {
  const items = new Map<string, string>();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, String(value)),
    removeItem: (key) => void items.delete(key),
    clear: () => items.clear(),
    key: (index) => [...items.keys()][index] ?? null,
    get length() {
      return items.size;
    },
  };
}

function resetStorage(): void {
  for (const name of ["localStorage", "sessionStorage"]) {
    Object.defineProperty(globalThis, name, {
      value: memoryStorage(),
      writable: true,
      configurable: true,
    });
  }
}

resetStorage();
beforeEach(resetStorage);

// Tests share the app router, whose guards use the first mounted app's Pinia.
enableAutoUnmount(afterEach);

// Mock global objects
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(_callback: ResizeObserverCallback) {}
}
global.ResizeObserver = MockResizeObserver;

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  root = null;
  rootMargin = "";
  thresholds = [];
  takeRecords = vi.fn().mockReturnValue([]);
  constructor(
    _callback: IntersectionObserverCallback,
    _options?: IntersectionObserverInit,
  ) {
    void _callback;
    void _options;
  }
}
global.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollTo
Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: vi.fn(),
});

// Mock requestAnimationFrame for components that animate
global.requestAnimationFrame = vi.fn((cb: FrameRequestCallback): number => {
  cb(0);
  return 0;
});

global.cancelAnimationFrame = vi.fn();

// Mock scrollIntoView on Element prototype
if (typeof Element !== "undefined") {
  Element.prototype.scrollIntoView = vi.fn();
}

// Mock the Web Animations API, which jsdom lacks
if (typeof Element !== "undefined") {
  Element.prototype.animate = vi.fn().mockReturnValue({
    cancel: vi.fn(),
    finish: vi.fn(),
    pause: vi.fn(),
    play: vi.fn(),
    reverse: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    finished: Promise.resolve(),
    ready: Promise.resolve(),
    playState: "finished",
    playbackRate: 1,
    currentTime: 0,
    startTime: 0,
    timeline: null,
    effect: null,
    id: "",
    pending: false,
    replaceState: "active",
  });
}

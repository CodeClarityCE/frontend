import { expect, test } from "vitest";

import {
  isCriticalSeverity,
  isHighSeverity,
  isLowSeverity,
  isMediumSeverity,
  isNoneSeverity,
} from "./severity";

// TEST NONE
test("0 is none", () => {
  expect(isNoneSeverity(0)).toBe(true);
  expect(isLowSeverity(0)).toBe(false);
  expect(isMediumSeverity(0)).toBe(false);
  expect(isHighSeverity(0)).toBe(false);
  expect(isCriticalSeverity(0)).toBe(false);
});

test("1 is low", () => {
  expect(isNoneSeverity(1)).toBe(false);
  expect(isLowSeverity(1)).toBe(true);
  expect(isMediumSeverity(1)).toBe(false);
  expect(isHighSeverity(1)).toBe(false);
  expect(isCriticalSeverity(1)).toBe(false);
});

test("4 is medium", () => {
  expect(isNoneSeverity(4)).toBe(false);
  expect(isLowSeverity(4)).toBe(false);
  expect(isMediumSeverity(4)).toBe(true);
  expect(isHighSeverity(4)).toBe(false);
  expect(isCriticalSeverity(4)).toBe(false);
});

test("7 is high", () => {
  expect(isNoneSeverity(7)).toBe(false);
  expect(isLowSeverity(7)).toBe(false);
  expect(isMediumSeverity(7)).toBe(false);
  expect(isHighSeverity(7)).toBe(true);
  expect(isCriticalSeverity(7)).toBe(false);
});

test("9 is critical", () => {
  expect(isNoneSeverity(9)).toBe(false);
  expect(isLowSeverity(9)).toBe(false);
  expect(isMediumSeverity(9)).toBe(false);
  expect(isHighSeverity(9)).toBe(false);
  expect(isCriticalSeverity(9)).toBe(true);
});

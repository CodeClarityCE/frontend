import { readonly, type Ref, ref } from "vue";

import { logger } from "@/utils/logger";

export type ThemeChoice = "system" | "light" | "dark";
export type AppliedTheme = "light" | "dark";

// The inline script in index.html reads the same key before first paint.
const THEME_STORAGE_KEY = "theme";

const choice = ref<ThemeChoice>("system");
const applied = ref<AppliedTheme>("light");
let osQuery: MediaQueryList | undefined;

/** True for one of the three Theme choices. */
export function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === "system" || value === "light" || value === "dark";
}

// Storage can be missing or throw when the browser blocks it; both mean System.
function readChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeChoice(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function writeChoice(value: ThemeChoice): void {
  try {
    if (value === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, value);
  } catch {
    logger.warn("Theme choice could not be saved: browser storage is blocked");
  }
}

function resolve(): AppliedTheme {
  if (choice.value !== "system") return choice.value;
  return osQuery?.matches ? "dark" : "light";
}

// Sets the root class, then points the browser theme colour at the applied background.
function apply(): void {
  applied.value = resolve();
  const root = document.documentElement;
  root.classList.toggle("dark", applied.value === "dark");
  const background = getComputedStyle(root)
    .getPropertyValue("--background")
    .trim();
  if (background) {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", background);
  }
}

// Applies the choice, and listens for OS scheme changes only while it is System.
function applyAndFollow(): void {
  apply();
  if (choice.value === "system") osQuery?.addEventListener("change", apply);
  else osQuery?.removeEventListener("change", apply);
}

/** Reads the stored choice, applies it, and follows the OS while on System and other tabs always. */
export function installTheme(): void {
  osQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : undefined;
  choice.value = readChoice();
  applyAndFollow();
  // Takes up a choice made in another tab.
  window.addEventListener("storage", (event) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
    choice.value = readChoice();
    applyAndFollow();
  });
}

/** The Theme choice, the theme it applies, and a way to change the choice. */
export function useTheme(): {
  choice: Readonly<Ref<ThemeChoice>>;
  applied: Readonly<Ref<AppliedTheme>>;
  setChoice: (value: ThemeChoice) => void;
} {
  return {
    choice: readonly(choice),
    applied: readonly(applied),
    setChoice(value: ThemeChoice): void {
      choice.value = value;
      writeChoice(value);
      applyAndFollow();
    },
  };
}

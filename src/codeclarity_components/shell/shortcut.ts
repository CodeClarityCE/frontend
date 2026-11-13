// Apple keyboards use Command for shortcuts, everything else uses Control.
const isApple =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/.test(navigator.userAgent);

export const shortcutLabel = isApple ? "⌘K" : "Ctrl K";

/** True for the keystroke that toggles the command palette. */
export function isPaletteShortcut(event: KeyboardEvent): boolean {
  return event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);
}

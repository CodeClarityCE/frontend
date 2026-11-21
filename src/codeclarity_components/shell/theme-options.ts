import { type LucideIcon, Monitor, Moon, Sun } from "@lucide/vue";

import type { ThemeChoice } from "@/utils/theme";

export interface ThemeOption {
  value: ThemeChoice;
  label: string;
  icon: LucideIcon;
}

// The three Theme choices, as the user menu and the command palette list them.
export const themeOptions: ThemeOption[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

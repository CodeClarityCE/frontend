import type { StatusTone } from "@/base_components/page";

import type { SemVer } from "./Patching";

export interface PatchStatus {
  label: string;
  tone: StatusTone;
}

// The shared status of a patch: full, partial or none.
export function patchStatus(isPatchable: string | undefined): PatchStatus {
  if (isPatchable === "FULL") return { label: "Full patch", tone: "success" };
  if (isPatchable === "PARTIAL")
    return { label: "Partial patch", tone: "warning" };
  return { label: "No patch", tone: "danger" };
}

// A version as text, or null when there is none to upgrade to.
export function semverText(version: SemVer | undefined): string | null {
  if (!version) return null;
  const { Major, Minor, Patch, PreReleaseTag } = version;
  if (Major === 0 && Minor === 0 && Patch === 0 && !PreReleaseTag) return null;
  const tag = PreReleaseTag ? `-${PreReleaseTag}` : "";
  return `${Major}.${Minor}.${Patch}${tag}`;
}

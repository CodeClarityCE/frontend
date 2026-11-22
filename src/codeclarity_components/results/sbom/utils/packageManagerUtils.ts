/**
 * Package Manager Utilities
 * Simple helper functions for different package managers
 */

export interface PackageUpdate {
  name: string;
  currentVersion: string;
  latestVersion: string;
  isDev: boolean;
  isProd: boolean;
  // Ecosystem of the dependency, e.g. "npm" or "packagist"
  ecosystem?: string;
}

export interface ManagerUpdates {
  // Null when the SBOM names no package manager we have commands for
  manager: PackageManager | null;
  updates: PackageUpdate[];
}

export type PackageManager = "npm" | "yarn" | "pnpm" | "bun" | "composer";

interface ManagerInfo {
  icon: string;
  manifest: string;
  lockfile: string;
  install: string;
  // Commands that add packages as production or development dependencies.
  add: string;
  addDev: string;
  // Joins a package name and version range, e.g. "express@^5.0.1".
  spec: (name: string, range: string) => string;
  help: string;
}

const npmSpec = (name: string, range: string): string => `${name}@${range}`;

const MANAGERS: Record<PackageManager, ManagerInfo> = {
  npm: {
    icon: "devicon:npm",
    manifest: "package.json",
    lockfile: "package-lock.json",
    install: "npm install",
    add: "npm install",
    addDev: "npm install --save-dev",
    spec: npmSpec,
    help: "npm install writes the new ranges to package.json too.",
  },
  yarn: {
    icon: "devicon:yarn",
    manifest: "package.json",
    lockfile: "yarn.lock",
    install: "yarn install",
    add: "yarn add",
    addDev: "yarn add --dev",
    spec: npmSpec,
    help: "yarn add writes the new ranges to package.json too.",
  },
  pnpm: {
    icon: "devicon:pnpm",
    manifest: "package.json",
    lockfile: "pnpm-lock.yaml",
    install: "pnpm install",
    add: "pnpm add",
    addDev: "pnpm add --save-dev",
    spec: npmSpec,
    help: "pnpm add writes the new ranges to package.json too.",
  },
  bun: {
    icon: "devicon:bun",
    manifest: "package.json",
    lockfile: "bun.lock",
    install: "bun install",
    add: "bun add",
    addDev: "bun add --dev",
    spec: npmSpec,
    help: "bun add writes the new ranges to package.json too.",
  },
  composer: {
    icon: "devicon:composer",
    manifest: "composer.json",
    lockfile: "composer.lock",
    install: "composer update --lock",
    add: "composer require",
    addDev: "composer require --dev",
    spec: (name, range) => `${name}:${range}`,
    help: "composer require writes the new constraints to composer.json too.",
  },
};

/**
 * The package manager named by an SBOM, or null when it is not one we know
 * (for example "multi-language").
 */
function toPackageManager(value?: string): PackageManager | null {
  const name = value?.toLowerCase() ?? "";
  return name in MANAGERS ? (name as PackageManager) : null;
}

/**
 * Splits updates by the package manager of their ecosystem when the workspace
 * uses more than one, else keeps them together under the workspace's manager.
 */
export function groupUpdatesByManager(
  updates: PackageUpdate[],
  workspaceManager?: string,
  managersByEcosystem: Record<string, string> = {},
): ManagerUpdates[] {
  const managers = new Set(
    Object.values(managersByEcosystem).map((m) => m.toLowerCase()),
  );
  if (managers.size < 2)
    return [{ manager: toPackageManager(workspaceManager), updates }];

  const groups = new Map<string, ManagerUpdates>();
  for (const update of updates) {
    const manager = toPackageManager(
      managersByEcosystem[update.ecosystem ?? ""],
    );
    const key = manager ?? "";
    if (!groups.has(key)) groups.set(key, { manager, updates: [] });
    groups.get(key)!.updates.push(update);
  }
  return [...groups.values()];
}

/** Get package manager logo icon */
export function getPackageManagerIcon(packageManager: PackageManager): string {
  return MANAGERS[packageManager].icon;
}

/** Get the manifest file the package manager reads, e.g. package.json */
export function getManifestName(packageManager: PackageManager): string {
  return MANAGERS[packageManager].manifest;
}

/** Get lockfile name for package manager */
export function getLockfileName(packageManager: PackageManager): string {
  return MANAGERS[packageManager].lockfile;
}

/** Get the command that refreshes the lockfile after a manifest edit */
export function getInstallCommand(packageManager: PackageManager): string {
  return MANAGERS[packageManager].install;
}

/** Generate update commands for a package manager */
export function generateUpdateCommands(
  packageManager: PackageManager,
  updates: PackageUpdate[],
): string[] {
  const info = MANAGERS[packageManager];
  const specs = (list: PackageUpdate[]): string =>
    list.map((u) => info.spec(u.name, `^${u.latestVersion}`)).join(" ");

  const prodUpdates = updates.filter((update) => update.isProd);
  const devUpdates = updates.filter((update) => update.isDev && !update.isProd);

  const commands: string[] = [];
  if (prodUpdates.length > 0)
    commands.push(`${info.add} ${specs(prodUpdates)}`);
  if (devUpdates.length > 0)
    commands.push(`${info.addDev} ${specs(devUpdates)}`);
  return commands;
}

/** Get help text for package manager */
export function getPackageManagerHelpText(
  packageManager: PackageManager,
): string {
  return MANAGERS[packageManager].help;
}

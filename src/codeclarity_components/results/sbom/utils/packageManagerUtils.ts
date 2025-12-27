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
}

export type PackageManager = "npm" | "yarn" | "pnpm" | "bun";

/**
 * Get package manager logo icon
 */
export function getPackageManagerIcon(packageManager: PackageManager): string {
  const icons = {
    npm: "logos:npm-icon",
    yarn: "logos:yarn",
    pnpm: "logos:pnpm",
    bun: "logos:bun",
  };
  return icons[packageManager] || icons.yarn;
}

/**
 * Get lockfile name for package manager
 */
export function getLockfileName(packageManager: PackageManager): string {
  const lockfiles = {
    npm: "package-lock.json",
    yarn: "yarn.lock",
    pnpm: "pnpm-lock.yaml",
    bun: "bun.lockb",
  };
  return lockfiles[packageManager] || lockfiles.yarn;
}

/**
 * Get install command for package manager
 */
export function getInstallCommand(packageManager: PackageManager): string {
  const commands = {
    npm: "npm install",
    yarn: "yarn install",
    pnpm: "pnpm install",
    bun: "bun install",
  };
  return commands[packageManager] || commands.yarn;
}

/**
 * Generate update commands for a package manager
 */
export function generateUpdateCommands(
  packageManager: PackageManager,
  updates: PackageUpdate[],
): string[] {
  const commands: string[] = [];

  // Separate production and dev dependencies
  const prodUpdates = updates.filter((update) => update.isProd);
  const devUpdates = updates.filter((update) => update.isDev && !update.isProd);

  // Generate production dependencies command
  if (prodUpdates.length > 0) {
    const prodPackages = prodUpdates
      .map((update) => `${update.name}@^${update.latestVersion}`)
      .join(" ");

    switch (packageManager) {
      case "npm":
        commands.push(`npm install ${prodPackages}`);
        break;
      case "yarn":
        commands.push(`yarn upgrade ${prodPackages}`);
        break;
      case "pnpm":
        commands.push(`pnpm update ${prodPackages}`);
        break;
      case "bun":
        commands.push(`bun update ${prodPackages}`);
        break;
      default:
        // No-op for unknown package managers
        break;
    }
  }

  // Generate dev dependencies command
  if (devUpdates.length > 0) {
    const devPackages = devUpdates
      .map((update) => `${update.name}@^${update.latestVersion}`)
      .join(" ");

    switch (packageManager) {
      case "npm":
        commands.push(`npm install --save-dev ${devPackages}`);
        break;
      case "yarn":
        commands.push(`yarn upgrade ${devPackages}`);
        break;
      case "pnpm":
        commands.push(`pnpm update ${devPackages}`);
        break;
      case "bun":
        commands.push(`bun update ${devPackages}`);
        break;
      default:
        // No-op for unknown package managers
        break;
    }
  }

  return commands;
}

/**
 * Get help text for package manager
 */
export function getPackageManagerHelpText(
  packageManager: PackageManager,
): string {
  const helpTexts = {
    npm: "NPM will install the exact versions specified, ensuring your dependencies are updated to the latest available versions.",
    yarn: "Unlike yarn add, the yarn upgrade command will update packages even if current versions satisfy semver constraints.",
    pnpm: "The pnpm update command will update packages to their latest versions, respecting the version ranges specified.",
    bun: "Bun's bun update command efficiently updates packages to their latest compatible versions.",
  };
  return helpTexts[packageManager] || helpTexts.yarn;
}

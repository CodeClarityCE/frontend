import type { EcosystemInfo } from "./ecosystem-shared";

// Re-export types for components that depend on them
export type { EcosystemInfo };

// Interface for dependency objects
interface Dependency {
  name?: string;
  ecosystem?: string;
  purl?: string;
  package_url?: string;
  extra?: Record<string, unknown>;
}

export enum PackageEcosystem {
  NPM = "npm",
  PACKAGIST = "packagist", // PHP Composer
  PYPI = "pypi",
  CRATES_IO = "crates-io", // Rust
  MAVEN_CENTRAL = "maven",
  NUGET = "nuget",
  UNKNOWN = "unknown",
}

// The shared type plus the legacy type field. Brand colours are left out:
// logos carry their own, and the UI colours come from tokens.
export interface EcosystemInfoExtended extends Omit<EcosystemInfo, "color"> {
  type: PackageEcosystem;
}

export const ECOSYSTEMS: Record<PackageEcosystem, EcosystemInfoExtended> = {
  [PackageEcosystem.NPM]: {
    type: PackageEcosystem.NPM,
    name: "JavaScript",
    ecosystem: "npm",
    language: "JavaScript",
    packageManagerPattern: "(npm|yarn|pnpm|bun)",
    defaultPackageManager: "npm",
    icon: "devicon:javascript",
    website: "https://www.npmjs.com",
    purlType: "npm",
    registryUrl: "https://registry.npmjs.org",
    tools: ["npm", "yarn", "pnpm", "bun"],
  },
  [PackageEcosystem.PACKAGIST]: {
    type: PackageEcosystem.PACKAGIST,
    name: "PHP",
    ecosystem: "packagist",
    language: "PHP",
    packageManagerPattern: "composer",
    defaultPackageManager: "composer",
    icon: "devicon:php",
    website: "https://packagist.org",
    purlType: "composer",
    registryUrl: "https://packagist.org",
    tools: ["composer"],
  },
  [PackageEcosystem.PYPI]: {
    type: PackageEcosystem.PYPI,
    name: "PyPI",
    ecosystem: "pypi",
    language: "Python",
    packageManagerPattern: "(pip|poetry|pipenv|conda)",
    defaultPackageManager: "pip",
    icon: "devicon:python",
    website: "https://pypi.org",
    purlType: "pypi",
    registryUrl: "https://pypi.org/simple",
    tools: ["pip", "poetry", "pipenv", "conda"],
  },
  [PackageEcosystem.CRATES_IO]: {
    type: PackageEcosystem.CRATES_IO,
    name: "crates.io",
    ecosystem: "cargo",
    language: "Rust",
    packageManagerPattern: "cargo",
    defaultPackageManager: "cargo",
    icon: "devicon:rust",
    website: "https://crates.io",
    purlType: "cargo",
    registryUrl: "https://crates.io",
    tools: ["cargo"],
  },
  [PackageEcosystem.MAVEN_CENTRAL]: {
    type: PackageEcosystem.MAVEN_CENTRAL,
    name: "Maven Central",
    ecosystem: "maven",
    language: "Java",
    packageManagerPattern: "(maven|gradle|sbt)",
    defaultPackageManager: "maven",
    icon: "devicon:maven",
    website: "https://mvnrepository.com",
    purlType: "maven",
    registryUrl: "https://repo1.maven.org/maven2",
    tools: ["maven", "gradle", "sbt"],
  },
  [PackageEcosystem.NUGET]: {
    type: PackageEcosystem.NUGET,
    name: "NuGet",
    ecosystem: "nuget",
    language: "C#",
    packageManagerPattern: "(dotnet|nuget|paket)",
    defaultPackageManager: "dotnet",
    icon: "devicon:nuget",
    website: "https://www.nuget.org",
    purlType: "nuget",
    registryUrl: "https://api.nuget.org/v3/index.json",
    tools: ["dotnet", "nuget", "paket"],
  },
  [PackageEcosystem.UNKNOWN]: {
    type: PackageEcosystem.UNKNOWN,
    name: "Unknown",
    ecosystem: "unknown",
    language: "Unknown",
    packageManagerPattern: "",
    defaultPackageManager: "",
    icon: "",
    website: "",
    purlType: "",
    registryUrl: "",
    tools: [],
  },
};

export class EcosystemDetector {
  /**
   * Detects ecosystem from Package URL (PURL)
   * PURL format: pkg:type/namespace/name@version?qualifiers#subpath
   */
  static detectFromPURL(purl: string): EcosystemInfoExtended {
    if (!purl?.startsWith("pkg:")) {
      return ECOSYSTEMS[PackageEcosystem.UNKNOWN];
    }

    // "pkg:type/..." gives the PURL type
    const type = purl.split("/")[0]?.split(":")[1];
    for (const ecosystem of Object.values(ECOSYSTEMS)) {
      if (ecosystem.purlType === type) {
        return ecosystem;
      }
    }
    return ECOSYSTEMS[PackageEcosystem.UNKNOWN];
  }

  /**
   * Detects ecosystem from dependency object
   */
  static detectFromDependency(dependency: Dependency): EcosystemInfoExtended {
    // First check explicit ecosystem field from backend (most reliable)
    if (dependency.ecosystem) {
      switch (dependency.ecosystem.toLowerCase()) {
        case "npm":
          return ECOSYSTEMS[PackageEcosystem.NPM];
        case "packagist":
          return ECOSYSTEMS[PackageEcosystem.PACKAGIST];
        case "pypi":
          return ECOSYSTEMS[PackageEcosystem.PYPI];
        case "cargo":
          return ECOSYSTEMS[PackageEcosystem.CRATES_IO];
        case "maven":
          return ECOSYSTEMS[PackageEcosystem.MAVEN_CENTRAL];
        case "nuget":
          return ECOSYSTEMS[PackageEcosystem.NUGET];
        default:
          // Continue to fallback detection methods
          break;
      }
    }

    // Fallback to PURL detection if available
    if (dependency.purl ?? dependency.package_url) {
      const purl = (dependency.purl ?? dependency.package_url)!;
      const detected = this.detectFromPURL(purl);
      if (detected.type !== PackageEcosystem.UNKNOWN) {
        return detected;
      }
    }

    // Fallback to package name patterns (least reliable)
    if (dependency.name) {
      // PHP Composer packages typically have vendor/package format
      if (dependency.name.includes("/") && !dependency.name.startsWith("@")) {
        return ECOSYSTEMS[PackageEcosystem.PACKAGIST];
      }

      // npm scoped packages start with @
      if (dependency.name.startsWith("@")) {
        return ECOSYSTEMS[PackageEcosystem.NPM];
      }

      // If no slash and not scoped, likely npm (since PHP packages almost always have vendor/package format)
      if (!dependency.name.includes("/")) {
        return ECOSYSTEMS[PackageEcosystem.NPM];
      }
    }

    return ECOSYSTEMS[PackageEcosystem.UNKNOWN];
  }

  /**
   * Gets all supported ecosystems
   */
  static getAllEcosystems(): EcosystemInfoExtended[] {
    return Object.values(ECOSYSTEMS).filter(
      (eco) => eco.type !== PackageEcosystem.UNKNOWN,
    );
  }

  /**
   * Gets ecosystem by type
   */
  static getEcosystem(type: PackageEcosystem): EcosystemInfoExtended {
    return ECOSYSTEMS[type] || ECOSYSTEMS[PackageEcosystem.UNKNOWN];
  }
}

/**
 * Utility functions for ecosystem-specific metadata extraction
 */
export class EcosystemMetadataExtractor {
  /**
   * Extracts NPM-specific metadata from dependency extra field
   */
  static extractNpmMetadata(dependency: Dependency): Record<string, unknown> {
    if (!dependency.extra?.npm) return {};

    const npm = dependency.extra.npm as Record<string, unknown>;
    return {
      scripts: npm.scripts,
      engines: npm.engines,
      peerDependencies: npm.peerDependencies,
      keywords: npm.keywords,
      ...npm,
    };
  }

  /**
   * Extracts Composer/Packagist-specific metadata from dependency extra field
   */
  static extractComposerMetadata(
    dependency: Dependency,
  ): Record<string, unknown> {
    if (!dependency.extra?.composer) return {};

    const composer = dependency.extra.composer as Record<string, unknown>;
    return {
      type: composer.type,
      autoload: composer.autoload,
      autoloadDev: composer["autoload-dev"],
      require: composer.require,
      requireDev: composer["require-dev"],
      suggest: composer.suggest,
      provide: composer.provide,
      conflict: composer.conflict,
      replace: composer.replace,
      scripts: composer.scripts,
      config: composer.config,
      ...composer,
    };
  }

  /**
   * Extracts ecosystem-specific metadata
   */
  static extractMetadata(
    dependency: Dependency,
    ecosystem: Pick<EcosystemInfo, "ecosystem">,
  ): Record<string, unknown> {
    // Use ecosystem name instead of type since shared EcosystemInfo doesn't have type
    switch (ecosystem.ecosystem) {
      case "npm":
        return this.extractNpmMetadata(dependency);
      case "packagist":
        return this.extractComposerMetadata(dependency);
      default:
        return dependency.extra ?? {};
    }
  }
}

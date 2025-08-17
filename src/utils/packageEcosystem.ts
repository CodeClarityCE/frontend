export enum PackageEcosystem {
    NPM = 'npm',
    PACKAGIST = 'packagist', // PHP Composer
    PYPI = 'pypi',
    CRATES_IO = 'crates-io', // Rust
    MAVEN_CENTRAL = 'maven',
    NUGET = 'nuget',
    UNKNOWN = 'unknown'
}

export interface EcosystemInfo {
    type: PackageEcosystem;
    name: string;
    icon: string;
    color: string;
    website: string;
    language: string;
    purlType: string; // The type used in Package URLs
    registryUrl: string;
    // Common tools that work with this ecosystem
    tools: string[];
}

export const ECOSYSTEMS: Record<PackageEcosystem, EcosystemInfo> = {
    [PackageEcosystem.NPM]: {
        type: PackageEcosystem.NPM,
        name: 'npm Registry',
        icon: 'devicon:npm',
        color: '#CB3837',
        website: 'https://www.npmjs.com',
        language: 'JavaScript',
        purlType: 'npm',
        registryUrl: 'https://registry.npmjs.org',
        tools: ['npm', 'yarn', 'pnpm', 'bun']
    },
    [PackageEcosystem.PACKAGIST]: {
        type: PackageEcosystem.PACKAGIST,
        name: 'Packagist',
        icon: 'devicon:composer',
        color: '#885630',
        website: 'https://packagist.org',
        language: 'PHP',
        purlType: 'composer',
        registryUrl: 'https://packagist.org',
        tools: ['composer']
    },
    [PackageEcosystem.PYPI]: {
        type: PackageEcosystem.PYPI,
        name: 'PyPI',
        icon: 'devicon:python',
        color: '#3776AB',
        website: 'https://pypi.org',
        language: 'Python',
        purlType: 'pypi',
        registryUrl: 'https://pypi.org/simple',
        tools: ['pip', 'poetry', 'pipenv', 'conda']
    },
    [PackageEcosystem.CRATES_IO]: {
        type: PackageEcosystem.CRATES_IO,
        name: 'crates.io',
        icon: 'devicon:rust',
        color: '#000000',
        website: 'https://crates.io',
        language: 'Rust',
        purlType: 'cargo',
        registryUrl: 'https://crates.io',
        tools: ['cargo']
    },
    [PackageEcosystem.MAVEN_CENTRAL]: {
        type: PackageEcosystem.MAVEN_CENTRAL,
        name: 'Maven Central',
        icon: 'devicon:maven',
        color: '#C71A36',
        website: 'https://mvnrepository.com',
        language: 'Java',
        purlType: 'maven',
        registryUrl: 'https://repo1.maven.org/maven2',
        tools: ['maven', 'gradle', 'sbt']
    },
    [PackageEcosystem.NUGET]: {
        type: PackageEcosystem.NUGET,
        name: 'NuGet',
        icon: 'devicon:nuget',
        color: '#004880',
        website: 'https://www.nuget.org',
        language: 'C#',
        purlType: 'nuget',
        registryUrl: 'https://api.nuget.org/v3/index.json',
        tools: ['dotnet', 'nuget', 'paket']
    },
    [PackageEcosystem.UNKNOWN]: {
        type: PackageEcosystem.UNKNOWN,
        name: 'Unknown',
        icon: 'solar:question-circle-linear',
        color: '#6B7280',
        website: '',
        language: 'Unknown',
        purlType: '',
        registryUrl: '',
        tools: []
    }
};

export class EcosystemDetector {
    /**
     * Detects ecosystem from Package URL (PURL)
     * PURL format: pkg:type/namespace/name@version?qualifiers#subpath
     */
    static detectFromPURL(purl: string): EcosystemInfo {
        if (!purl || !purl.startsWith('pkg:')) {
            return ECOSYSTEMS[PackageEcosystem.UNKNOWN];
        }

        try {
            // Extract the type from PURL
            const purlParts = purl.split('/');
            const typeWithPrefix = purlParts[0]; // "pkg:type"
            const type = typeWithPrefix.split(':')[1]; // "type"

            // Find ecosystem by PURL type
            for (const ecosystem of Object.values(ECOSYSTEMS)) {
                if (ecosystem.purlType === type) {
                    return ecosystem;
                }
            }

            return ECOSYSTEMS[PackageEcosystem.UNKNOWN];
        } catch (error) {
            console.warn('Failed to parse PURL:', purl, error);
            return ECOSYSTEMS[PackageEcosystem.UNKNOWN];
        }
    }

    /**
     * Detects ecosystem from dependency object
     */
    static detectFromDependency(dependency: any): EcosystemInfo {
        // First try to detect from PURL if available
        if (dependency.purl) {
            const detected = this.detectFromPURL(dependency.purl);
            if (detected.type !== PackageEcosystem.UNKNOWN) {
                return detected;
            }
        }

        // Fallback: try to detect from package name patterns
        if (dependency.name) {
            // PHP Composer packages typically have vendor/package format
            if (dependency.name.includes('/') && !dependency.name.startsWith('@')) {
                return ECOSYSTEMS[PackageEcosystem.PACKAGIST];
            }

            // npm scoped packages start with @
            if (dependency.name.startsWith('@')) {
                return ECOSYSTEMS[PackageEcosystem.NPM];
            }
        }

        // Check extra field for hints
        if (dependency.extra) {
            if (dependency.extra.composer) {
                return ECOSYSTEMS[PackageEcosystem.PACKAGIST];
            }
            if (dependency.extra.npm) {
                return ECOSYSTEMS[PackageEcosystem.NPM];
            }
        }

        return ECOSYSTEMS[PackageEcosystem.UNKNOWN];
    }

    /**
     * Gets all supported ecosystems
     */
    static getAllEcosystems(): EcosystemInfo[] {
        return Object.values(ECOSYSTEMS).filter((eco) => eco.type !== PackageEcosystem.UNKNOWN);
    }

    /**
     * Gets ecosystem by type
     */
    static getEcosystem(type: PackageEcosystem): EcosystemInfo {
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
    static extractNpmMetadata(dependency: any): any {
        if (!dependency.extra?.npm) return {};

        return {
            scripts: dependency.extra.npm.scripts,
            engines: dependency.extra.npm.engines,
            peerDependencies: dependency.extra.npm.peerDependencies,
            keywords: dependency.extra.npm.keywords,
            ...dependency.extra.npm
        };
    }

    /**
     * Extracts Composer/Packagist-specific metadata from dependency extra field
     */
    static extractComposerMetadata(dependency: any): any {
        if (!dependency.extra?.composer) return {};

        return {
            type: dependency.extra.composer.type,
            autoload: dependency.extra.composer.autoload,
            autoloadDev: dependency.extra.composer['autoload-dev'],
            require: dependency.extra.composer.require,
            requireDev: dependency.extra.composer['require-dev'],
            suggest: dependency.extra.composer.suggest,
            provide: dependency.extra.composer.provide,
            conflict: dependency.extra.composer.conflict,
            replace: dependency.extra.composer.replace,
            scripts: dependency.extra.composer.scripts,
            config: dependency.extra.composer.config,
            ...dependency.extra.composer
        };
    }

    /**
     * Extracts ecosystem-specific metadata
     */
    static extractMetadata(dependency: any, ecosystem: EcosystemInfo): any {
        switch (ecosystem.type) {
            case PackageEcosystem.NPM:
                return this.extractNpmMetadata(dependency);
            case PackageEcosystem.PACKAGIST:
                return this.extractComposerMetadata(dependency);
            default:
                return dependency.extra || {};
        }
    }
}

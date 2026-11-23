import { gzipSync } from "node:zlib";

/** One npm dependency with its lockfile entry. */
export interface Dependency {
  name: string;
  version: string;
  integrity: string;
}

/** The default dependency, which the knowledge dump fixture gives one advisory. */
export const DEPENDENCY: Dependency = {
  name: "ms",
  version: "0.7.1",
  integrity:
    "sha512-lRLiIR9fSNpnP6TC4v8+4OU7oStC01esuNowdQ34L+Gk8e5Puoc88IqJ+XAY/B3Mn2ZKis8l8HX90oU8ivzUHg==",
};

// package.json and package-lock.json of a project with one dependency.
function manifests(dependency: Dependency): [unknown, unknown] {
  const packageJson = {
    name: "journey-app",
    version: "1.0.0",
    dependencies: { [dependency.name]: dependency.version },
  };
  const packageLock = {
    name: "journey-app",
    version: "1.0.0",
    lockfileVersion: 3,
    requires: true,
    packages: {
      "": packageJson,
      [`node_modules/${dependency.name}`]: {
        version: dependency.version,
        resolved: `https://registry.npmjs.org/${dependency.name}/-/${dependency.name}-${dependency.version}.tgz`,
        integrity: dependency.integrity,
      },
    },
  };
  return [packageJson, packageLock];
}

// Writes an ASCII value into a tar header field.
function field(header: Buffer, offset: number, length: number, value: string) {
  header.write(value.slice(0, length), offset, length, "ascii");
}

// One ustar entry: a 512-byte header, then the content padded to 512 bytes.
function tarEntry(name: string, content: Buffer): Buffer {
  const header = Buffer.alloc(512);
  field(header, 0, 100, name);
  field(header, 100, 8, "0000644\0");
  field(header, 108, 8, "0000000\0");
  field(header, 116, 8, "0000000\0");
  field(header, 124, 12, `${content.length.toString(8).padStart(11, "0")}\0`);
  field(header, 136, 12, "00000000000\0");
  field(header, 148, 8, "        ");
  field(header, 156, 1, "0");
  field(header, 257, 8, "ustar\u000000");
  const sum = header.reduce((total, byte) => total + byte, 0);
  field(header, 148, 8, `${sum.toString(8).padStart(6, "0")}\0 `);
  const padding = Buffer.alloc((512 - (content.length % 512)) % 512);
  return Buffer.concat([header, content, padding]);
}

/** A tiny npm project as a .tar.gz archive: package.json and its lockfile. */
export function npmProjectArchive(dependency = DEPENDENCY): Buffer {
  const [packageJson, packageLock] = manifests(dependency);
  const json = (value: unknown) =>
    Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  return gzipSync(
    Buffer.concat([
      tarEntry("package.json", json(packageJson)),
      tarEntry("package-lock.json", json(packageLock)),
      Buffer.alloc(1024),
    ]),
  );
}

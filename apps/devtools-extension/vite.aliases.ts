import path from 'node:path';

const RIPL_PACKAGES = [
    'canvas',
    'core',
    'devtools',
    'dom',
    'svg',
    'utilities',
    'web',
];

/** Maps every `@ripl/*` package to its workspace source entry so builds compile against the monorepo source. */
export function getRiplAliases(rootDir: string): Record<string, string> {
    return Object.fromEntries(RIPL_PACKAGES.map(name => [
        `@ripl/${name}`,
        path.resolve(rootDir, `../../packages/${name}/src/index.ts`),
    ]));
}

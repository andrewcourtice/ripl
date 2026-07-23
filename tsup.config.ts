import {
    readFileSync,
} from 'node:fs';

import {
    resolve,
} from 'node:path';

import type {
    Options,
} from 'tsup';

/**
 * Derives a distinct IIFE global for the package being built from its `package.json` name
 * (`@ripl/core` → `RiplCore`, `@ripl/3d` → `Ripl3d`). Every package previously shared the single
 * `Ripl` global, so loading two Ripl IIFE bundles on one page clobbered `window.Ripl`; a
 * package-specific name lets them coexist. Falls back to `Ripl` if the name can't be read.
 */
function resolveGlobalName(): string {
    try {
        const { name } = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as {
            name: string;
        };

        const suffix = name.replace(/^@ripl\//, '').replace(/[^a-z0-9]/gi, '');

        return suffix
            ? `Ripl${suffix.charAt(0).toUpperCase()}${suffix.slice(1)}`
            : 'Ripl';
    } catch {
        return 'Ripl';
    }
}

export default (): Options => ({
    clean: true,
    // Build against `tsconfig.build.json`, which drops the workspace source aliases (`paths: {}`)
    // that the root tsconfig defines. API Extractor reads this tsconfig directly, so without it the
    // rollup would resolve `@ripl/*` to each dependency's source and pull that source into the
    // analysis; with it, cross-package types resolve to the dependency's built `dist` and stay
    // external imports in the emitted declarations.
    tsconfig: 'tsconfig.build.json',
    // Emit one flat, self-contained `dist/index.d.ts` per package via tsup's API-Extractor-backed
    // declaration rollup (API Extractor's compiler is pinned to the project's TypeScript 6 through
    // the root `resolutions`). Type-checking stays a separate `tsc --noEmit` step in each package's
    // build script (the CI gate); this flag only controls declaration output.
    experimentalDts: true,
    sourcemap: true,
    target: 'es2023',
    globalName: resolveGlobalName(),
    outDir: './dist',
    entry: [
        './src/index.ts',
    ],
    format: [
        'esm',
        'cjs',
        'iife',
    ],
    external: [
        /^@ripl\//,
    ],
});

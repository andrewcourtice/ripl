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
    // Declarations are emitted by `tsc` (see each package's `tsconfig.build.json`) rather than
    // tsup's bundled dts: tsup injects a `baseUrl` compiler option that TypeScript 6 deprecates
    // (TS5101) and its rollup-plugin-dts engine caps at `typescript <6.1.0`, so emitting through
    // `tsc` keeps the build working today and ready for the future TS7 native compiler.
    dts: false,
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

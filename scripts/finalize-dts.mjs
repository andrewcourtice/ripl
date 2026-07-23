/**
 * Flattens tsup's experimental (API Extractor) declaration output into a single, self-contained
 * `dist/index.d.ts` per package.
 *
 * tsup's `experimentalDts` emits two files: a thin `index.d.ts` that re-exports from a sibling
 * `_tsup-dts-rollup.d.ts`, and that rollup file, which already declares every symbol and exports it
 * under its public name (plus internal `_alias_N` re-exports that exist only so the thin entry can
 * reference them). Consumers that fetch a single declaration file - notably the docs playground,
 * which registers each package's `index.d.ts` with Monaco - can't follow the relative re-export, so
 * we promote the rollup to `index.d.ts`, drop the `_alias_N` re-exports, and delete the split
 * artifacts. Cross-package `@ripl/*` imports are left untouched (they stay external), and npm
 * consumers get one tidy declaration file.
 *
 * Run from a package directory (tsup's cwd) after the build: `node ../../scripts/finalize-dts.mjs`.
 */

import {
    existsSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'node:fs';

import {
    resolve,
} from 'node:path';

const dist = resolve(process.cwd(), 'dist');
const rollup = resolve(dist, '_tsup-dts-rollup.d.ts');
const indexDts = resolve(dist, 'index.d.ts');

// Remove tsup's `.tsup` scratch directory (intermediate declarations for the rollup); `clean`
// only clears `dist`, so it would otherwise linger and get picked up by lint/type tooling.
rmSync(resolve(process.cwd(), '.tsup'), {
    recursive: true,
    force: true,
});

// No rollup means the package emitted no declarations (or was already finalized); nothing to do.
if (!existsSync(rollup)) {
    process.exit(0);
}

const content = readFileSync(rollup, 'utf8')
    // Drop tsup's internal alias re-exports (`export { foo as foo_alias_1 }`). Every symbol is
    // already exported under its public name, so these only leak noise into the public surface.
    .replace(/^export \{ \w+ as \w+_alias_\d+ \};?[ \t]*\r?\n/gm, '');

writeFileSync(indexDts, content);

// Remove the split artifacts so `dist` ships a single declaration file.
for (const stale of ['_tsup-dts-rollup.d.ts', '_tsup-dts-rollup.d.cts', 'index.d.cts']) {
    const path = resolve(dist, stale);

    if (existsSync(path)) {
        rmSync(path);
    }
}

import {
    readFileSync,
} from 'node:fs';

import {
    resolve,
} from 'node:path';

import {
    defineConfig,
} from 'tsdown';

import type {
    TsdownPlugin,
    UserConfig,
} from 'tsdown';

/**
 * Matches every workspace package. Used to keep `@ripl/*` external in the ESM/CJS builds and
 * to force them back into the bundle for the standalone IIFE build.
 */
const RIPL_PACKAGES = /^@ripl\//;

/** Matches a declaration chunk (`index.d.ts` / `index.d.cts`). */
const DECLARATION_FILE = /\.d\.[cm]?ts$/;

/** Matches the `sourceMappingURL` comment rolldown appends to a declaration chunk. */
const DECLARATION_SOURCEMAP_COMMENT = /\s*\/\/# sourceMappingURL=\S+\.d\.[cm]?ts\.map\s*$/;

/**
 * Strips the dangling `//# sourceMappingURL=index.d.ts.map` comment from declaration output.
 *
 * `rolldown-plugin-dts` derives its own sourcemap flag from `compilerOptions.declarationMap`
 * (off here) but ORs the build's `sourcemap` option into the *output* options, so rolldown
 * appends the comment while the plugin drops the `.d.ts.map` chunk it refers to. Declaration
 * maps are of no use to consumers anyway — `files` publishes `dist` only, so the `src` they
 * point at never ships.
 *
 * This covers `index.d.ts`, which shares an output with `index.js` and therefore has to keep
 * `sourcemap` on. The standalone `.d.cts` pass turns `sourcemap` off outright instead, since
 * user plugins are not applied to it.
 */
function stripDeclarationSourcemapComment(): TsdownPlugin {
    return {
        name: 'ripl:strip-declaration-sourcemap-comment',
        generateBundle(_options, bundle) {
            for (const chunk of Object.values(bundle)) {
                if (chunk.type === 'chunk' && DECLARATION_FILE.test(chunk.fileName)) {
                    chunk.code = chunk.code.replace(DECLARATION_SOURCEMAP_COMMENT, '\n');
                }
            }
        },
    };
}

/** Reads the name of the package being built, or an empty string if it can't be read. */
function readPackageName(cwd: string): string {
    try {
        const { name } = JSON.parse(readFileSync(resolve(cwd, 'package.json'), 'utf8')) as {
            name: string;
        };

        return name;
    } catch {
        return '';
    }
}

/**
 * Derives a distinct IIFE global for the package being built from its `package.json` name
 * (`@ripl/core` → `RiplCore`, `@ripl/3d` → `Ripl3d`). Every package previously shared the single
 * `Ripl` global, so loading two Ripl IIFE bundles on one page clobbered `window.Ripl`; a
 * package-specific name lets them coexist. Falls back to `Ripl` if the name can't be read.
 */
function resolveGlobalName(packageName: string): string {
    const suffix = packageName.replace(/^@ripl\//, '').replace(/[^a-z0-9]/gi, '');

    return suffix
        ? `Ripl${suffix.charAt(0).toUpperCase()}${suffix.slice(1)}`
        : 'Ripl';
}

export default defineConfig((inlineConfig): UserConfig[] => {
    // `lerna run build` starts one tsdown process per package, so the invocation cwd is the
    // package directory and every per-package lookup (package.json, tsconfig.json) resolves
    // against it. Do NOT enable tsdown's `workspace` mode: it evaluates this config once for
    // the whole monorepo, so every package would inherit the first package's IIFE global.
    const cwd = inlineConfig.cwd ?? process.cwd();
    const packageName = readPackageName(cwd);

    const shared = {
        cwd,
        clean: true,
        sourcemap: true,
        target: 'es2023',
        outDir: './dist',
        entry: [
            './src/index.ts',
        ],
        // These are isomorphic rendering libraries, not Node tools. `neutral` also keeps
        // `fixedExtension` off, which is load-bearing: ESM must stay `index.js` (the packages
        // are `type: module`) and CJS `index.cjs`, matching every `main`/`module`/`exports`.
        platform: 'neutral',
        fixedExtension: false,
        outputOptions: (outputOptions, _format, { cjsDts }) => ({
            ...outputOptions,
            // JSDoc belongs in the declarations, where editors read it — in the runtime bundle
            // it is dead weight (up to a third of a file). `jsdoc: false` leaves the `legal`
            // and `annotation` categories on, so `@__PURE__` / `@__NO_SIDE_EFFECTS__` markers
            // survive and consumers can still tree-shake. Declaration chunks are unaffected:
            // rolldown-plugin-dts re-prints those from its own AST, not through rolldown codegen.
            comments: {
                jsdoc: false,
            },
            // The `.d.cts` pass emits declarations only, so a sourcemap there produces nothing
            // but a `sourceMappingURL` comment pointing at a map that is never written.
            ...cjsDts && {
                sourcemap: false,
            },
        }),
    } satisfies UserConfig;

    return [
        {
            ...shared,
            format: [
                'esm',
                'cjs',
            ],
            // Workspace packages are real `dependencies`, so consumers install them alongside.
            // Keeping them external also preserves type identity across packages: `@ripl/web`
            // re-exports `@ripl/core`'s declarations rather than duplicating them.
            deps: {
                neverBundle: [
                    RIPL_PACKAGES,
                ],
            },
            // tsdown bundles declarations into a single `index.d.ts` (plus `index.d.cts` for
            // the CJS condition), replacing the per-file `.d.ts` tree `tsc` used to emit.
            dts: true,
            attw: true,
            // `warning` drops publint's suggestion-level output (these are browser libraries,
            // so the suggested `engines.node` field would be noise) while still surfacing
            // genuine packaging mistakes.
            publint: {
                level: 'warning',
            },
            plugins: [
                stripDeclarationSourcemapComment(),
            ],
        },
        {
            ...shared,
            format: [
                'iife',
            ],
            globalName: resolveGlobalName(packageName),
            // The IIFE bundle is a standalone `<script>` drop-in, so it inlines its workspace
            // dependencies instead of expecting them on `window`. This matches what tsup
            // produced: esbuild ignored `external` for IIFE, so those bundles were already
            // self-contained.
            deps: {
                alwaysBundle: [
                    RIPL_PACKAGES,
                ],
            },
            // Declarations come from the ESM/CJS build above; without this the IIFE build
            // emits a stray `index.iife.d.ts`.
            dts: false,
        },
    ];
});

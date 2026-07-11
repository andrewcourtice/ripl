import type {
    Options,
} from 'tsup';

export default {
    clean: true,
    // Declarations are emitted by `tsc` (see each package's `tsconfig.build.json`) rather than
    // tsup's bundled dts: tsup injects a `baseUrl` compiler option that TypeScript 6 deprecates
    // (TS5101) and its rollup-plugin-dts engine caps at `typescript <6.1.0`, so emitting through
    // `tsc` keeps the build working today and ready for the future TS7 native compiler.
    dts: false,
    sourcemap: true,
    target: 'es2023',
    globalName: 'Ripl',
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
} as Options;
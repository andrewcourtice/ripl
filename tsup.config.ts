import type {
    Options,
} from 'tsup';

export default {
    clean: true,
    dts: true,
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
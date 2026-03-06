import type {
    Options,
} from 'tsup';

export default {
    clean: true,
    dts: true,
    sourcemap: true,
    target: 'es2023',
    outDir: './dist',
    entry: [
        './src/index.ts',
    ],
    format: [
        'esm',
        'cjs',
    ],
    external: [
        /^@ripl\//,
        'vue',
    ],
} as Options;

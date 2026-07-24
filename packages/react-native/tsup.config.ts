import {
    defineConfig,
} from 'tsup';

/**
 * Per-package build override for `@ripl/react-native`.
 *
 * Unlike the other packages (which inherit the repo-root `tsup.config.ts`), this package drops the
 * `iife` browser bundle — a React Native library has no `window` global to attach to and cannot
 * provide its native peers (`react`, `react-native`, Skia, gesture-handler) as browser globals — and
 * enables the automatic JSX runtime so the `.tsx` components compile without importing React.
 */
export default defineConfig({
    clean: true,
    dts: false,
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
        'react',
        'react/jsx-runtime',
        'react-native',
        '@shopify/react-native-skia',
        'react-native-gesture-handler',
    ],
    esbuildOptions(options) {
        options.jsx = 'automatic';
    },
});

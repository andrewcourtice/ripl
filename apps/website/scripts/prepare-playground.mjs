import fs from 'node:fs';

import path from 'node:path';

import {
    execSync,
} from 'node:child_process';

import {
    createRequire,
} from 'node:module';

import {
    fileURLToPath,
} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const packagesDir = path.resolve(__dirname, '../../../packages');
const outputDir = path.resolve(__dirname, '../src/public/_playground');

const PACKAGES = [
    '@ripl/utilities',
    '@ripl/core',
    '@ripl/dom',
    '@ripl/canvas',
    '@ripl/svg',
    '@ripl/web',
    '@ripl/3d',
    '@ripl/webgpu',
    '@ripl/terminal',
    '@ripl/charts',
];

// Clean output directory
if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true });
}

fs.mkdirSync(outputDir, { recursive: true });

const manifest = {};
const missingArtifacts = [];

for (const pkg of PACKAGES) {
    const shortName = pkg.replace('@ripl/', '');
    const pkgDistDir = path.resolve(packagesDir, shortName, 'dist');
    const pkgOutputDir = path.resolve(outputDir, shortName);

    fs.mkdirSync(pkgOutputDir, { recursive: true });

    const esmSrc = path.resolve(pkgDistDir, 'index.js');
    const dtsSrc = path.resolve(pkgDistDir, 'index.d.ts');

    // tsdown emits both the ESM bundle and the bundled declarations, so run the
    // package's build if either artifact is missing.
    if (!fs.existsSync(esmSrc) || !fs.existsSync(dtsSrc)) {
        const pkgDir = path.resolve(packagesDir, shortName);
        console.warn(`Building ${pkg}...`);

        try {
            execSync('yarn run -T tsdown', {
                cwd: pkgDir,
                stdio: 'inherit',
            });
        } catch {
            console.warn(`Warning: build for ${pkg} had errors, continuing...`);
        }
    }

    // The playground is unusable for a package without its bundle and types,
    // so a missing artifact fails the build rather than degrading silently.
    if (!fs.existsSync(esmSrc)) {
        missingArtifacts.push(esmSrc);
    }

    if (!fs.existsSync(dtsSrc)) {
        missingArtifacts.push(dtsSrc);
    }

    if (fs.existsSync(esmSrc)) {
        fs.copyFileSync(esmSrc, path.resolve(pkgOutputDir, 'index.js'));
    }

    if (fs.existsSync(dtsSrc)) {
        fs.copyFileSync(dtsSrc, path.resolve(pkgOutputDir, 'index.d.ts'));
    }

    manifest[pkg] = {
        esm: `/_playground/${shortName}/index.js`,
        types: `/_playground/${shortName}/index.d.ts`,
    };
}

if (missingArtifacts.length) {
    console.error(`Playground preparation failed; missing build artifacts:\n${missingArtifacts.join('\n')}`);
    process.exit(1);
}

// Bundle xterm.js (+ the fit addon) to a single self-contained ESM module served from the app
// origin, so the Terminal playground context resolves them from the import map with no external CDN.
try {
    // rolldown is the bundler tsdown builds the packages with, so the playground reuses the
    // existing toolchain rather than pulling in a second one. Its API is used directly rather
    // than tsdown's `build()`: tsdown is aimed at publishing libraries, so it externalises
    // `dependencies` and emits declarations — the opposite of the single self-contained module
    // needed here.
    const { rolldown } = await import('rolldown');
    const xtermOutput = path.resolve(outputDir, 'xterm');
    fs.mkdirSync(xtermOutput, { recursive: true });

    const entryFile = path.resolve(xtermOutput, 'entry.js');
    fs.writeFileSync(entryFile, [
        'export { Terminal } from \'@xterm/xterm\';',
        'export { FitAddon } from \'@xterm/addon-fit\';',
        '',
    ].join('\n'));

    const bundle = await rolldown({
        input: entryFile,
        platform: 'browser',
        logLevel: 'silent',
    });

    await bundle.write({
        file: path.resolve(xtermOutput, 'index.js'),
        format: 'esm',
    });

    await bundle.close();

    fs.rmSync(entryFile);

    // Copy xterm's stylesheet (resolved via its package root) for the terminal host.
    const xtermPkgDir = path.dirname(require.resolve('@xterm/xterm/package.json'));
    fs.copyFileSync(path.resolve(xtermPkgDir, 'css/xterm.css'), path.resolve(xtermOutput, 'xterm.css'));

    // Both specifiers point at the same bundle, which re-exports Terminal and FitAddon.
    manifest['@xterm/xterm'] = {
        esm: '/_playground/xterm/index.js',
        types: null,
    };
    manifest['@xterm/addon-fit'] = {
        esm: '/_playground/xterm/index.js',
        types: null,
    };
} catch (error) {
    console.warn('Warning: could not bundle xterm for the terminal playground, skipping:', error.message);
}

// Monaco bundles TypeScript 5.9, whose `lib.dom` predates the WebGPU interfaces that TypeScript 6
// ships (and that `@ripl/webgpu`'s declarations rely on). Serve `@webgpu/types` so the editor can
// resolve `GPUDevice` & co. `global: true` tells the editor to register it as an ambient lib
// rather than wrapping it in `declare module`, which is what the package entries get.
try {
    const webgpuTypesOutput = path.resolve(outputDir, 'webgpu-types');
    fs.mkdirSync(webgpuTypesOutput, { recursive: true });

    const webgpuTypesPkgDir = path.dirname(require.resolve('@webgpu/types/package.json'));

    fs.copyFileSync(
        path.resolve(webgpuTypesPkgDir, 'dist/index.d.ts'),
        path.resolve(webgpuTypesOutput, 'index.d.ts')
    );

    manifest['@webgpu/types'] = {
        esm: null,
        types: '/_playground/webgpu-types/index.d.ts',
        global: true,
    };
} catch (error) {
    console.warn('Warning: could not copy @webgpu/types for the playground, skipping:', error.message);
}

fs.writeFileSync(
    path.resolve(outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n'
);

console.log('Playground assets prepared:', Object.keys(manifest).join(', '));

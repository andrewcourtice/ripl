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

    // tsdown emits both artifacts together, so build the package if either is missing.
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

    // The playground is unusable without both, so fail the build rather than degrade silently.
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

// Bundle xterm.js to one self-contained module served from the app origin, so no external CDN is needed.
try {
    // rolldown directly, not tsdown's `build()`: tsdown externalises `dependencies`, the opposite of this.
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

// Monaco bundles TypeScript 5.9, whose `lib.dom` predates the WebGPU interfaces `@ripl/webgpu` relies on.
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

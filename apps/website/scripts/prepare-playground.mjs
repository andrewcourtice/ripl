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
    '@ripl/vdom',
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

for (const pkg of PACKAGES) {
    const shortName = pkg.replace('@ripl/', '');
    const pkgDistDir = path.resolve(packagesDir, shortName, 'dist');
    const pkgOutputDir = path.resolve(outputDir, shortName);

    fs.mkdirSync(pkgOutputDir, { recursive: true });

    const esmSrc = path.resolve(pkgDistDir, 'index.js');
    const dtsSrc = path.resolve(pkgDistDir, 'index.d.ts');

    if (!fs.existsSync(esmSrc)) {
        const pkgDir = path.resolve(packagesDir, shortName);
        console.warn(`Building ${pkg}...`);

        try {
            execSync('npx tsup', {
                cwd: pkgDir,
                stdio: 'inherit',
            });
        } catch {
            console.warn(`Warning: build for ${pkg} had errors, continuing...`);
        }
    }

    const entry = {
        esm: `/_playground/${shortName}/index.js`,
        types: `/_playground/${shortName}/index.d.ts`,
    };

    if (fs.existsSync(esmSrc)) {
        fs.copyFileSync(esmSrc, path.resolve(pkgOutputDir, 'index.js'));
    } else {
        console.warn(`Warning: ${esmSrc} not found, skipping ESM for ${pkg}`);
        entry.esm = null;
    }

    if (fs.existsSync(dtsSrc)) {
        fs.copyFileSync(dtsSrc, path.resolve(pkgOutputDir, 'index.d.ts'));
    } else {
        console.warn(`Warning: ${dtsSrc} not found, skipping types for ${pkg}`);
        entry.types = null;
    }

    manifest[pkg] = entry;
}

// Bundle xterm.js (+ the fit addon) to a single self-contained ESM module served from the app
// origin, so the Terminal playground context resolves them from the import map with no external CDN.
try {
    const esbuild = await import('esbuild');
    const xtermOutput = path.resolve(outputDir, 'xterm');
    fs.mkdirSync(xtermOutput, { recursive: true });

    const entryFile = path.resolve(xtermOutput, 'entry.js');
    fs.writeFileSync(entryFile, [
        'export { Terminal } from \'@xterm/xterm\';',
        'export { FitAddon } from \'@xterm/addon-fit\';',
        '',
    ].join('\n'));

    await esbuild.build({
        entryPoints: [entryFile],
        bundle: true,
        format: 'esm',
        outfile: path.resolve(xtermOutput, 'index.js'),
        logLevel: 'silent',
    });

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

fs.writeFileSync(
    path.resolve(outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n'
);

console.log('Playground assets prepared:', Object.keys(manifest).join(', '));

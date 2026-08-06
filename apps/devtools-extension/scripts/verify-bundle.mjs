/**
 * Post-build guard for the packed extension.
 *
 * Two entry points whose file basenames collide emit chunks with the same name, and
 * @crxjs/vite-plugin has resolved the service-worker loader to the wrong one — shipping a
 * background worker that is really the content script and dies on `window` at module scope.
 * A green `vite build` says nothing about that, so this checks the emitted bundle directly:
 * the worker must not share a chunk with any content script, and it must evaluate in a host
 * with no `window`, which is exactly what a service worker is.
 *
 * Run from the workspace root: node scripts/verify-bundle.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

import {
    fileURLToPath,
    pathToFileURL,
} from 'node:url';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const distDir = path.join(rootDir, 'dist');

function fail(message) {
    console.error(`\n  verify-bundle: ${message}\n`);
    process.exit(1);
}

function read(relativePath) {
    const absolute = path.join(distDir, relativePath);

    if (!fs.existsSync(absolute)) {
        fail(`expected ${relativePath} in dist; run the build first`);
    }

    return fs.readFileSync(absolute, 'utf8');
}

/**
 * Collects the scripts a built file references, as dist-relative paths. References come in three
 * shapes with two different bases: a sibling `import` resolves against the referrer, while a
 * root-absolute `src` and a `chrome.runtime.getURL` argument resolve against the extension root.
 * Both bases are tried and the one that exists on disk wins, so no reference is silently dropped.
 */
function getReferences(relativePath) {
    const fromDir = path.posix.dirname(relativePath);

    return Array
        .from(read(relativePath).matchAll(/["'`]([^"'`\s]+\.js)["'`]/g), match => match[1])
        .map(reference => {
            const candidates = reference.startsWith('/')
                ? [reference.slice(1)]
                : [
                    path.posix.normalize(path.posix.join(fromDir, reference)),
                    path.posix.normalize(reference),
                ];

            return candidates.find(candidate => fs.existsSync(path.join(distDir, candidate)));
        })
        .filter(Boolean);
}

const manifest = JSON.parse(read('manifest.json'));
const workerEntry = manifest.background?.service_worker;

if (!workerEntry) {
    fail('manifest declares no background.service_worker');
}

// One hop only: going transitive would flag the protocol module both sides legitimately share.
const workerTargets = getReferences(workerEntry);
const contentEntries = (manifest.content_scripts ?? []).flatMap(script => script.js ?? []);
const contentTargets = new Set(contentEntries.flatMap(entry => [entry, ...getReferences(entry)]));

const shared = workerTargets.filter(chunk => contentTargets.has(chunk));

if (shared.length) {
    fail([
        `the service worker executes a content script chunk: ${shared.join(', ')}`,
        'Entry basenames must stay unique, or @crxjs/vite-plugin mis-resolves the loader.',
    ].join('\n  '));
}

// Every emitted chunk should be reachable from something; an orphan means a loader points elsewhere.
const referrers = fs
    .readdirSync(distDir, {
        recursive: true,
    })
    .filter(entry => typeof entry === 'string' && /\.(?:html|js|json)$/.test(entry))
    .map(entry => entry.split(path.sep).join('/'));

const referenced = new Set(referrers.flatMap(referrer => getReferences(referrer)));

const orphans = fs.readdirSync(path.join(distDir, 'assets'))
    .filter(name => name.endsWith('.js'))
    .map(name => `assets/${name}`)
    .filter(chunk => !referenced.has(chunk));

if (orphans.length) {
    fail(`emitted but referenced by nothing: ${orphans.join(', ')}`);
}

const noop = () => undefined;

const listener = {
    addListener: noop,
    removeListener: noop,
};

globalThis.chrome = {
    runtime: {
        onConnect: listener,
        onMessage: listener,
        connect: () => ({
            onMessage: listener,
            onDisconnect: listener,
            postMessage: noop,
        }),
        getURL: value => value,
    },
    tabs: {
        onUpdated: listener,
        onRemoved: listener,
        sendMessage: () => Promise.resolve(),
    },
    action: {
        setIcon: noop,
        setTitle: noop,
    },
};

// Node has no `window` either, so importing here reproduces the service worker's own failure.
try {
    await import(pathToFileURL(path.join(distDir, workerEntry)).href);
} catch (error) {
    fail(`the service worker threw on evaluation: ${error.message}`);
}

console.log(`verify-bundle: ${workerEntry} -> ${workerTargets.join(', ')} evaluates cleanly and is not a content script`);

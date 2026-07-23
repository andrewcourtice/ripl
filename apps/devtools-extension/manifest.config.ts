import {
    version as packageVersion,
} from './package.json';

import {
    defineManifest,
} from '@crxjs/vite-plugin';

const GRAY_ICONS = {
    16: 'icons/icon-gray-16.png',
    32: 'icons/icon-gray-32.png',
    48: 'icons/icon-gray-48.png',
    128: 'icons/icon-gray-128.png',
};

// Chrome only accepts a numeric dotted `version`, so strip the prerelease
// suffix and surface the full package version via `version_name`. Keeping the
// package.json version as the single source of truth avoids version drift.
const numericVersion = packageVersion.replace(/-.*$/, '');

export default defineManifest({
    manifest_version: 3,
    name: 'Ripl Devtools',
    version: numericVersion,
    version_name: packageVersion,
    description: 'Inspect Ripl contexts, scenes, elements, and renderers on any page.',
    icons: GRAY_ICONS,
    action: {
        default_title: 'Ripl Devtools',
        default_popup: 'src/popup/index.html',
        default_icon: GRAY_ICONS,
    },
    devtools_page: 'src/devtools/index.html',
    background: {
        service_worker: 'src/background/index.ts',
        type: 'module',
    },
    content_scripts: [
        {
            matches: ['<all_urls>'],
            js: ['src/content/index.ts'],
            run_at: 'document_start',
        },
    ],
});

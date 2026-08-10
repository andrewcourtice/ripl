/**
 * Canonical URL construction, shared by the per-page `<link rel="canonical">` tag and the sitemap so
 * the two cannot disagree about which URL is the real one. `pageUrl` reproduces VitePress' own
 * sitemap transform: an `index.md` collapses to its directory (keeping the trailing slash) and every
 * other page drops its extension, which matches the extensionless links `cleanUrls` emits.
 */

/** Origin the site is served from, without a trailing slash. */
export const HOSTNAME = 'https://www.ripl.run';

/** Site-root-relative URL a source page publishes to, e.g. `charts/gauge`, `demos/terminal/`, ``. */
export function pageUrl(relativePath: string): string {
    return relativePath
        .replace(/(^|\/)index\.md$/, '$1')
        .replace(/\.md$/, '');
}

/** Absolute canonical URL of a source page, e.g. `https://www.ripl.run/charts/gauge`. */
export function canonicalUrl(relativePath: string): string {
    return `${HOSTNAME}/${pageUrl(relativePath)}`;
}

const API_PAGE_PATTERN = /^docs\/api\/(@ripl\/[^/]+)\/(classes|functions|interfaces|namespaces|type-aliases|variables)\/(.+)\.md$/;

const API_INDEX_PATTERN = /^docs\/api\/(@ripl\/[^/]+)\/index\.md$/;

const API_ROOT_DESCRIPTIONS: Record<string, string> = {
    'docs/api/index.md': 'Generated API reference for every Ripl package: core rendering, Canvas, SVG, terminal, charts, 3D, WebGPU, devtools and utilities.',
    'docs/api/packages.md': 'Index of the Ripl packages, each with its own generated API reference: core, canvas, svg, charts, 3d, webgpu, terminal, devtools, dom and utilities.',
};

const API_KINDS: Record<string, string> = {
    'classes': 'class',
    'functions': 'function',
    'interfaces': 'interface',
    'namespaces': 'namespace',
    'type-aliases': 'type',
    'variables': 'variable',
};

/**
 * Description for a TypeDoc-generated reference page, which carries no frontmatter of its own and
 * would otherwise fall back to the site description across all ~1000 of them.
 */
export function apiPageDescription(relativePath: string): string | undefined {
    if (API_ROOT_DESCRIPTIONS[relativePath]) {
        return API_ROOT_DESCRIPTIONS[relativePath];
    }

    const match = API_PAGE_PATTERN.exec(relativePath);

    if (match) {
        const [, pkg, kind, name] = match;

        return `API reference for the ${name} ${API_KINDS[kind]} in ${pkg}, part of Ripl: a zero-dependency TypeScript library for 2D drawing, charts and animation.`;
    }

    const pkg = API_INDEX_PATTERN.exec(relativePath)?.[1];

    return pkg && `API reference for ${pkg}: every exported class, function, interface, type and variable, with signatures and links to the Ripl source.`;
}

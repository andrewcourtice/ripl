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

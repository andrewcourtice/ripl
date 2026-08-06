/**
 * Base URL of the Ripl documentation site. The `www` host is deliberate: the apex redirects, and
 * the redirect preserves the path, so an extensionless link 404s after the hop.
 */
export const DOCS_ORIGIN = 'https://www.ripl.run';

/** Documentation page for the devtools themselves, linked from the panel's help action. */
export const DOCS_DEVTOOLS_URL = `${DOCS_ORIGIN}/docs/core/advanced/devtools.html`;

/**
 * Builds an absolute documentation URL from a site-relative path. The site is built without
 * `cleanUrls`, so leaf pages are real `.html` files and the extension must link to them as such.
 *
 * @param path - The site-relative path, with or without a leading slash.
 * @returns The absolute URL.
 */
export function getDocsUrl(path: string): string {
    return `${DOCS_ORIGIN}/${path.replace(/^\//, '')}`;
}
